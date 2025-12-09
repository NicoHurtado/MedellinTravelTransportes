import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva } from '@prisma/client';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// GET /api/reservas/by-id/[id] - Fetch reservation by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const reserva = await prisma.reserva.findUnique({
            where: { id: params.id },
            include: {
                servicio: true,
                vehiculo: true,
                conductor: true,
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

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        return NextResponse.json(reserva);
    } catch (error) {
        console.error('Error fetching reserva by ID:', error);
        return NextResponse.json(
            { error: 'Error al obtener la reserva' },
            { status: 500 }
        );
    }
}

// PUT /api/reservas/by-id/[id] - Update reservation
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();

        // Prepare update data
        const updateData: any = {};

        // Estado y conductor
        if (body.estado !== undefined) {
            updateData.estado = body.estado;
        }
        if (body.conductorId !== undefined) {
            updateData.conductorId = body.conductorId;
        }

        // Customer data
        if (body.nombreCliente !== undefined) {
            updateData.nombreCliente = body.nombreCliente;
        }
        if (body.emailCliente !== undefined) {
            updateData.emailCliente = body.emailCliente;
        }
        if (body.whatsappCliente !== undefined) {
            updateData.whatsappCliente = body.whatsappCliente;
        }
        if (body.idioma !== undefined) {
            updateData.idioma = body.idioma;
        }

        // Pricing updates (for quotes)
        if (body.precioTotal !== undefined) {
            updateData.precioTotal = parseFloat(body.precioTotal);
        }
        if (body.precioBase !== undefined) {
            updateData.precioBase = parseFloat(body.precioBase);
        }

        // Update reservation
        const reserva = await prisma.reserva.update({
            where: { id: params.id },
            data: updateData,
            include: {
                servicio: true,
                vehiculo: true,
                conductor: true,
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

        // Send email notifications based on state changes
        if (body.estado && body.estado !== body.previousEstado) {
            try {
                const emailService = await import('@/lib/email-service');
                const idioma = reserva.idioma || 'ES';

                switch (body.estado) {
                    case EstadoReserva.CONFIRMADA_PENDIENTE_PAGO:
                        await emailService.sendReservaConfirmadaEmail(reserva as any, idioma);
                        break;
                    case EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION:
                        await emailService.sendPagoAprobadoEmail(reserva as any, idioma);
                        break;
                    case EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR:
                        if (reserva.conductor) {
                            await emailService.sendConductorAsignadoEmail(reserva as any, idioma);
                        }
                        break;
                    case EstadoReserva.COMPLETADA:
                        await emailService.sendServicioCompletadoEmail(reserva as any, idioma);
                        break;
                    case EstadoReserva.CANCELADA:
                        // Email de cancelación no implementado aún
                        break;
                }
            } catch (emailError) {
                console.error('Error sending email notification:', emailError);
                // Don't fail the update if email fails
            }
        }

        // Sync with Google Calendar if needed
        if (body.estado || body.conductorId || body.fecha || body.hora) {
            try {
                const { updateCalendarEvent } = await import('@/lib/google-calendar-service');
                if (reserva.googleCalendarEventId) {
                    await updateCalendarEvent(reserva as any);
                }
            } catch (calendarError) {
                console.error('Error updating calendar event:', calendarError);
                // Don't fail the update if calendar sync fails
            }
        }

        return NextResponse.json({
            data: reserva,
            message: 'Reserva actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error updating reserva:', error);
        return NextResponse.json(
            { error: 'Error al actualizar la reserva' },
            { status: 500 }
        );
    }
}
