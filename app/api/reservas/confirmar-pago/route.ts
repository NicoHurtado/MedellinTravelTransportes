import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId) {
            return NextResponse.json(
                { error: 'orderId es requerido' },
                { status: 400 }
            );
        }

        // Solo actualizar si el pago fue aprobado
        if (status !== 'APPROVED' && status !== 'approved') {
            return NextResponse.json({
                message: 'No action needed for non-approved payments',
                orderId,
                status
            });
        }

        // Detectar si es un pedido (PED prefix) o una reserva individual
        const isPedido = orderId.startsWith('PED');

        if (isPedido) {
            // ==========================================
            // PEDIDO FLOW: Update pedido + all its reservas
            // ==========================================
            return await handlePedidoPayment(orderId);
        } else {
            // ==========================================
            // RESERVA INDIVIDUAL FLOW
            // ==========================================
            return await handleReservaPayment(orderId);
        }

    } catch (error) {
        console.error('Error confirmando pago:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

/**
 * Handle payment confirmation for an individual Reserva
 */
async function handleReservaPayment(orderId: string) {
    // Buscar la reserva existente
    const reserva = await prisma.reserva.findUnique({
        where: { codigo: orderId }
    });

    if (!reserva) {
        console.error(`❌ [Confirmar Pago] Reserva no encontrada: ${orderId}`);
        return NextResponse.json(
            { error: 'Reserva no encontrada' },
            { status: 404 }
        );
    }

    // Verificar que la reserva esté en un estado que permita el pago
    if (reserva.estado !== 'CONFIRMADA_PENDIENTE_PAGO' && reserva.estado !== 'PENDIENTE_COTIZACION') {
        // Si ya está pagada, retornar éxito (idempotencia)
        if (reserva.estadoPago === 'APROBADO') {
            console.log(`✅ [Confirmar Pago] Reserva ${orderId} ya estaba pagada (idempotente)`);
            return NextResponse.json({
                success: true,
                message: 'Reserva ya estaba pagada',
                alreadyPaid: true
            });
        }

        return NextResponse.json({
            message: 'Reserva no está en estado pendiente de pago',
            currentState: reserva.estado
        });
    }

    // Actualizar el estado de la reserva
    const updated = await prisma.reserva.update({
        where: { codigo: orderId },
        data: {
            estado: 'PAGADA_PENDIENTE_ASIGNACION',
            estadoPago: 'APROBADO'
        },
        include: {
            servicio: true,
            conductor: true,
            vehiculo: true,
            aliado: true,
            asistentes: true
        }
    });

    console.log(`✅ [Confirmar Pago] Reserva ${orderId} actualizada a PAGADA_PENDIENTE_ASIGNACION`);

    // Determine if this is an external reservation (not from an ally)
    const isExternalReservation = !updated.esReservaAliado && !updated.aliadoId;

    // 📅 Crear evento en Google Calendar AHORA que el pago está confirmado
    try {
        if (updated.servicio?.tipo === 'TOUR_COMPARTIDO') {
            const { createOrUpdateTourCompartidoEvent } = await import('@/lib/google-calendar-service');
            const eventId = await createOrUpdateTourCompartidoEvent(updated as any);

            if (eventId) {
                await prisma.reserva.update({
                    where: { id: updated.id },
                    data: { googleCalendarEventId: eventId }
                });
                console.log(`📅 [Tour Compartido] Calendar event created/updated: ${eventId}`);
            }
        } else if (isExternalReservation || (updated.aliado?.tipo === 'AIRBNB' || updated.aliado?.tipo === 'HOTEL')) {
            // External reservation or AIRBNB/HOTEL ally - create calendar event now
            if (!updated.googleCalendarEventId) {
                const { createCalendarEvent } = await import('@/lib/google-calendar-service');
                const eventId = await createCalendarEvent(updated as any);

                if (eventId) {
                    await prisma.reserva.update({
                        where: { id: updated.id },
                        data: { googleCalendarEventId: eventId }
                    });
                    console.log(`📅 [Reserva] Calendar event created: ${eventId}`);
                }
            }
        }
    } catch (calendarError) {
        console.error('❌ Error creating calendar event:', calendarError);
    }

    // 📧 Enviar email de confirmación de pago
    if (isExternalReservation || updated.aliado?.tipo === 'AIRBNB' || updated.aliado?.tipo === 'HOTEL') {
        try {
            const { sendReservaConfirmadaEmail } = await import('@/lib/email-service');
            await sendReservaConfirmadaEmail(updated as any, updated.idioma || 'ES', updated.aliado?.email || null);
            console.log(`📧 [Reserva] Email de confirmación enviado para: ${orderId}`);
        } catch (emailError) {
            console.error('❌ Error sending confirmation email:', emailError);
        }
    }

    return NextResponse.json({
        success: true,
        data: updated,
        message: 'Pago confirmado exitosamente'
    });
}

/**
 * Handle payment confirmation for a Pedido (multi-service order)
 */
async function handlePedidoPayment(orderId: string) {
    // Buscar el pedido
    const pedido = await prisma.pedido.findUnique({
        where: { codigo: orderId },
        include: {
            reservas: {
                include: {
                    servicio: true,
                    conductor: true,
                    vehiculo: true,
                    aliado: true,
                }
            },
            aliado: true,
        }
    });

    if (!pedido) {
        console.error(`❌ [Confirmar Pago] Pedido no encontrado: ${orderId}`);
        return NextResponse.json(
            { error: 'Pedido no encontrado' },
            { status: 404 }
        );
    }

    // Idempotencia: si ya está pagado, retornar éxito
    if (pedido.estadoPago === 'APROBADO') {
        console.log(`✅ [Confirmar Pago] Pedido ${orderId} ya estaba pagado (idempotente)`);
        return NextResponse.json({
            success: true,
            message: 'Pedido ya estaba pagado',
            alreadyPaid: true
        });
    }

    // Verificar que el pedido necesita pago
    if (pedido.estadoPago !== 'PENDIENTE') {
        return NextResponse.json({
            message: 'Pedido no está en estado pendiente de pago',
            currentState: pedido.estadoPago
        });
    }

    // 1. Actualizar el pedido
    await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
            estadoPago: 'APROBADO',
        }
    });

    // 2. Actualizar TODAS las reservas del pedido
    await prisma.reserva.updateMany({
        where: { pedidoId: pedido.id },
        data: {
            estado: 'PAGADA_PENDIENTE_ASIGNACION',
            estadoPago: 'APROBADO',
        }
    });

    console.log(`✅ [Confirmar Pago] Pedido ${orderId} y ${pedido.reservas.length} reservas actualizadas a PAGADO`);

    // 3. Enviar emails y crear eventos de calendario para cada reserva
    for (const reserva of pedido.reservas) {
        const reservaActualizada = await prisma.reserva.findUnique({
            where: { id: reserva.id },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
            },
        });

        if (!reservaActualizada) continue;

        // 📧 Enviar email de confirmación
        try {
            const { sendReservaConfirmadaEmail } = await import('@/lib/email-service');
            const aliadoEmail = reservaActualizada.aliado?.email || pedido.aliado?.email || null;
            await sendReservaConfirmadaEmail(
                reservaActualizada as any,
                pedido.idioma as 'ES' | 'EN',
                aliadoEmail
            );
            console.log(`📧 [Pedido] Email de confirmación enviado para reserva: ${reserva.codigo}`);
        } catch (emailError) {
            console.error(`❌ Error sending email for reserva ${reserva.codigo}:`, emailError);
        }

        // 📅 Crear evento en Google Calendar
        try {
            if (!reservaActualizada.googleCalendarEventId) {
                if (reservaActualizada.servicio?.tipo === 'TOUR_COMPARTIDO') {
                    const { createOrUpdateTourCompartidoEvent } = await import('@/lib/google-calendar-service');
                    const eventId = await createOrUpdateTourCompartidoEvent(reservaActualizada as any);
                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: reserva.id },
                            data: { googleCalendarEventId: eventId }
                        });
                        console.log(`📅 [Pedido] Tour Compartido calendar event for: ${reserva.codigo}`);
                    }
                } else {
                    const { createCalendarEvent } = await import('@/lib/google-calendar-service');
                    const eventId = await createCalendarEvent(reservaActualizada as any);
                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: reserva.id },
                            data: { googleCalendarEventId: eventId }
                        });
                        console.log(`📅 [Pedido] Calendar event created for: ${reserva.codigo}`);
                    }
                }
            }
        } catch (calendarError) {
            console.error(`❌ Error creating calendar event for ${reserva.codigo}:`, calendarError);
        }
    }

    return NextResponse.json({
        success: true,
        message: `Pedido ${orderId} confirmado exitosamente con ${pedido.reservas.length} reservas`,
        reservations_updated: pedido.reservas.length
    });
}
