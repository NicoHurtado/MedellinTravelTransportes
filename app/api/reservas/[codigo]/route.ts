import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBoldHash } from '@/lib/bold';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendCambioEstadoEmail, sendPagoAprobadoEmail, sendConductorAsignadoEmail, sendServicioCompletadoEmail, sendCotizacionListaEmail, sendCancelacionEmail } from '@/lib/email-service';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/reservas/[codigo]
 * Obtener reserva por CÓDIGO (público) o ID (admin/interno)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    try {
        const { codigo } = await params;

        // Intentar buscar por ID (String CUID)
        let reserva = await prisma.reserva.findUnique({
            where: { id: codigo },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                calificacion: true,
                aliado: true,
                asistentes: true,
                adicionalesSeleccionados: {
                    include: {
                        adicional: true,
                    },
                },
            },
        });

        // Si no se encontró por ID, buscar por código
        if (!reserva) {
            reserva = await prisma.reserva.findUnique({
                where: { codigo },
                include: {
                    servicio: true,
                    conductor: true,
                    vehiculo: true,
                    calificacion: true,
                    aliado: true,
                    asistentes: true,
                    adicionalesSeleccionados: {
                        include: {
                            adicional: true,
                        },
                    },
                },
            });
        }

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva not found' },
                { status: 404 }
            );
        }

        // Verificar y actualizar hash si es necesario (si cambió el precio o no existe)
        if (reserva.estado === 'CONFIRMADA_PENDIENTE_PAGO' || reserva.estado === 'PENDIENTE_COTIZACION') {
            const amount = Math.round(Number(reserva.precioTotal));
            const expectedHash = generateBoldHash(reserva.codigo, amount, 'COP');

            if (reserva.hashPago !== expectedHash) {
                console.log('🔄 [API] Updating Bold Hash for reservation:', reserva.codigo);
                console.log('  - Old Hash:', reserva.hashPago ? 'Exists' : 'Null');
                console.log('  - New Hash:', expectedHash);
                console.log('  - Amount:', amount);

                await prisma.reserva.update({
                    where: { id: reserva.id },
                    data: { hashPago: expectedHash },
                });

                reserva.hashPago = expectedHash;
            }
        }

        return NextResponse.json(reserva);
    } catch (error) {
        console.error('Get reserva error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reserva', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/reservas/[codigo]
 * Actualizar reserva (ADMIN) - Se usa el ID (String) preferiblemente
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    try {
        // Verificar auth admin
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { codigo } = await params;
        const id = codigo; // El parámetro puede ser el ID directamente

        const body = await req.json();

        // Obtener reserva actual por ID
        let reservaActual = await prisma.reserva.findUnique({
            where: { id },
            include: {
                servicio: true,
                conductor: true,
            },
        });

        // Si no encuentra por ID, intentar por código (aunque para PUT idealmente es ID)
        if (!reservaActual) {
            reservaActual = await prisma.reserva.findUnique({
                where: { codigo: id }, // id variable holds the param value
                include: {
                    servicio: true,
                    conductor: true,
                },
            });
        }

        if (!reservaActual) {
            return NextResponse.json(
                { error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Actualizar reserva usando el ID real encontrado
        const reservaActualizada = await prisma.reserva.update({
            where: { id: reservaActual.id },
            data: body,
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
            },
        });

        // Enviar emails según cambios de estado
        try {
            if (body.estado && body.estado !== reservaActual.estado) {
                await sendCambioEstadoEmail(reservaActualizada, reservaActual.estado);

                if (body.estado === 'PAGADA_PENDIENTE_ASIGNACION' && reservaActual.estado !== 'PAGADA_PENDIENTE_ASIGNACION') {
                    await sendPagoAprobadoEmail(reservaActualizada);
                }

                if (body.estado === 'COMPLETADA' && reservaActual.estado !== 'COMPLETADA') {
                    await sendServicioCompletadoEmail(reservaActualizada);
                }

                if (reservaActual.estado === 'PENDIENTE_COTIZACION' && body.estado === 'CONFIRMADA_PENDIENTE_PAGO') {
                    await sendCotizacionListaEmail(reservaActualizada);
                }
            }

            if (body.conductorId && body.conductorId !== reservaActual.conductorId) {
                await sendConductorAsignadoEmail(reservaActualizada);
            }
        } catch (emailError) {
            console.error('❌ [Reserva] Error sending status change email:', emailError);
        }

        // Actualizar evento en Google Calendar si cambió fecha/hora o se asignó conductor
        const cambioRelevante = body.fecha || body.hora || body.conductorId || body.vehiculoId || body.estado;

        if (cambioRelevante) {
            try {
                // Check if this is a Tour Compartido reservation
                if (reservaActualizada.servicio?.tipo === 'TOUR_COMPARTIDO') {
                    // Use consolidation function to update/maintain all reservations for the day
                    const { createOrUpdateTourCompartidoEvent } = await import('@/lib/google-calendar-service');
                    await createOrUpdateTourCompartidoEvent(reservaActualizada as any);
                    console.log('✅ [Reserva] Tour Compartido consolidated calendar event updated');
                } else if (reservaActualizada.googleCalendarEventId) {
                    // Regular services: update individual event
                    const { updateCalendarEvent } = await import('@/lib/google-calendar-service');
                    await updateCalendarEvent(reservaActualizada as any);
                    console.log('✅ [Reserva] Google Calendar event updated');
                }
            } catch (calendarError) {
                console.error('❌ [Reserva] Error updating calendar event:', calendarError);
            }
        }

        return NextResponse.json({
            data: reservaActualizada,
            message: 'Reserva actualizada exitosamente',
        });
    } catch (error) {
        console.error('Error updating reserva:', error);
        return NextResponse.json(
            { error: 'Error al actualizar reserva' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/reservas/[codigo]
 * Cancelar reserva (ADMIN) - Se usa el ID (String)
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    try {
        // Verificar auth admin
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { codigo } = await params;

        // Intentar encontrar por ID o Código
        let reserva = await prisma.reserva.findUnique({ where: { id: codigo } });
        if (!reserva) {
            reserva = await prisma.reserva.findUnique({ where: { codigo } });
        }

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Soft delete: cambiar estado a CANCELADA
        const reservaActualizada = await prisma.reserva.update({
            where: { id: reserva.id },
            data: {
                estado: 'CANCELADA',
            },
            include: {
                servicio: true,
            },
        });

        // Enviar email de cancelación
        try {
            await sendCancelacionEmail(reservaActualizada);
        } catch (emailError) {
            console.error('❌ [Reserva] Error sending cancellation email:', emailError);
        }

        // Actualizar/eliminar evento de Google Calendar
        try {
            // Check if this is a Tour Compartido reservation
            if (reservaActualizada.servicio?.tipo === 'TOUR_COMPARTIDO') {
                // Update consolidation to reflect cancellation (will show updated status)
                const { createOrUpdateTourCompartidoEvent } = await import('@/lib/google-calendar-service');
                await createOrUpdateTourCompartidoEvent(reservaActualizada as any);
                console.log('✅ [Reserva] Tour Compartido consolidated calendar event updated after cancellation');
            } else if (reserva.googleCalendarEventId) {
                // Regular services: delete individual event
                const { deleteCalendarEvent } = await import('@/lib/google-calendar-service');
                await deleteCalendarEvent(reserva.googleCalendarEventId);
                console.log('✅ [Reserva] Google Calendar event deleted');
            }
        } catch (calendarError) {
            console.error('❌ [Reserva] Error updating/deleting calendar event:', calendarError);
        }

        return NextResponse.json({
            data: reservaActualizada,
            message: 'Reserva cancelada exitosamente',
        });
    } catch (error) {
        console.error('Error deleting reserva:', error);
        return NextResponse.json(
            { error: 'Error al cancelar reserva' },
            { status: 500 }
        );
    }
}
