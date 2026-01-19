import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateBoldHash } from '@/lib/bold';
import { sendPagoAprobadoEmail, sendCambioEstadoEmail } from '@/lib/email-service';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * Webhook de Bold para notificaciones de pago
 * https://developers.bold.co/pagos-en-linea/consulta-de-transacciones
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        console.log('Bold webhook received:', body);

        // Extraer datos del webhook de Bold
        const {
            order_id,
            payment_status,
            transaction_id,
            amount,
            currency,
            // Bold también puede enviar más campos
        } = body;

        if (!order_id) {
            return NextResponse.json(
                { error: 'order_id is required' },
                { status: 400 }
            );
        }

        // Detectar si es un pedido o una reserva individual
        const isPedido = order_id.startsWith('PED');

        if (isPedido) {
            // MANEJO DE PEDIDO
            const pedido = await prisma.pedido.findUnique({
                where: { codigo: order_id },
                include: {
                    reservas: {
                        include: {
                            servicio: true,
                            conductor: true,
                            vehiculo: true,
                        }
                    }
                },
            });

            if (!pedido) {
                console.error('Pedido not found for order_id:', order_id);
                return NextResponse.json(
                    { error: 'Pedido not found' },
                    { status: 404 }
                );
            }

            // Mapear estado de Bold a nuestro sistema
            let nuevoEstadoPago: string | null = null;
            let nuevoEstadoReserva: string | null = null;

            switch (payment_status) {
                case 'approved':
                    nuevoEstadoReserva = 'PAGADA_PENDIENTE_ASIGNACION';
                    nuevoEstadoPago = 'APROBADO';
                    break;
                case 'rejected':
                case 'failed':
                    nuevoEstadoPago = 'RECHAZADO';
                    break;
                case 'pending':
                    nuevoEstadoPago = 'PROCESANDO';
                    break;
            }

            // Actualizar el pedido
            await prisma.pedido.update({
                where: { id: pedido.id },
                data: {
                    ...(nuevoEstadoPago && { estadoPago: nuevoEstadoPago as any }),
                    ...(transaction_id && { pagoId: transaction_id }),
                },
            });

            // Actualizar TODAS las reservas del pedido
            if (nuevoEstadoReserva) {
                await prisma.reserva.updateMany({
                    where: { pedidoId: pedido.id },
                    data: {
                        estado: nuevoEstadoReserva as any,
                        ...(nuevoEstadoPago && { estadoPago: nuevoEstadoPago as any }),
                        ...(transaction_id && { pagoId: transaction_id }),
                    },
                });
            }

            // Enviar emails si el pago fue aprobado
            if (payment_status === 'approved') {
                try {
                    // Enviar un email por cada reserva del pedido
                    for (const reserva of pedido.reservas) {
                        const reservaActualizada = await prisma.reserva.findUnique({
                            where: { id: reserva.id },
                            include: {
                                servicio: true,
                                conductor: true,
                                vehiculo: true,
                            },
                        });

                        if (reservaActualizada) {
                            await sendPagoAprobadoEmail(
                                reservaActualizada,
                                pedido.idioma as 'ES' | 'EN'
                            );
                        }
                    }
                } catch (emailError) {
                    console.error('Error sending payment emails for pedido:', emailError);
                    // No fallar el webhook si el email falla
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Pedido webhook processed successfully',
                order_id,
                reservations_updated: pedido.reservas.length,
                new_status: nuevoEstadoReserva || 'unchanged',
            });

        } else {
            // MANEJO DE RESERVA INDIVIDUAL (código existente)
            const reserva = await prisma.reserva.findUnique({
                where: { codigo: order_id },
                include: {
                    servicio: true,
                    conductor: true,
                    vehiculo: true,
                },
            });

            if (!reserva) {
                console.error('Reserva not found for order_id:', order_id);
                return NextResponse.json(
                    { error: 'Reserva not found' },
                    { status: 404 }
                );
            }

            // Mapear estado de Bold a nuestro sistema
            let nuevoEstado: string | null = null;
            let nuevoEstadoPago: string | null = null;

            switch (payment_status) {
                case 'approved':
                    nuevoEstado = 'PAGADA_PENDIENTE_ASIGNACION';
                    nuevoEstadoPago = 'APROBADO';
                    break;
                case 'rejected':
                case 'failed':
                    nuevoEstadoPago = 'RECHAZADO';
                    break;
                case 'pending':
                    nuevoEstadoPago = 'PROCESANDO';
                    break;
            }

            // Actualizar reserva
            const estadoAnterior = reserva.estado;

            await prisma.reserva.update({
                where: { id: reserva.id },
                data: {
                    ...(nuevoEstado && { estado: nuevoEstado as any }),
                    ...(nuevoEstadoPago && { estadoPago: nuevoEstadoPago as any }),
                    ...(transaction_id && { pagoId: transaction_id }),
                    ...(amount && { comisionBold: Number(amount) * 0.029 }), // Bold cobra ~2.9%
                },
            });

            // Enviar email si el pago fue aprobado
            if (payment_status === 'approved') {
                try {
                    const reservaActualizada = await prisma.reserva.findUnique({
                        where: { id: reserva.id },
                        include: {
                            servicio: true,
                            conductor: true,
                            vehiculo: true,
                        },
                    });

                    if (reservaActualizada) {
                        await sendPagoAprobadoEmail(
                            reservaActualizada,
                            reserva.idioma as 'ES' | 'EN'
                        );
                    }
                } catch (emailError) {
                    console.error('Error sending payment email:', emailError);
                    // No fallar el webhook si el email falla
                }
            }

            // Enviar email de cambio de estado si hubo cambio
            if (nuevoEstado && nuevoEstado !== estadoAnterior) {
                try {
                    const reservaActualizada = await prisma.reserva.findUnique({
                        where: { id: reserva.id },
                        include: {
                            servicio: true,
                            conductor: true,
                            vehiculo: true,
                        },
                    });

                    if (reservaActualizada) {
                        await sendCambioEstadoEmail(
                            reservaActualizada,
                            estadoAnterior,
                            reserva.idioma as 'ES' | 'EN'
                        );
                    }
                } catch (emailError) {
                    console.error('Error sending status change email:', emailError);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Webhook processed successfully',
                order_id,
                new_status: nuevoEstado || reserva.estado,
            });
        }
    } catch (error) {
        console.error('Bold webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed', details: String(error) },
            { status: 500 }
        );
    }
}

// Bold también puede enviar GET para verificar el endpoint
export async function GET(req: NextRequest) {
    return NextResponse.json({
        status: 'Bold webhook endpoint active',
        timestamp: new Date().toISOString(),
    });
}
