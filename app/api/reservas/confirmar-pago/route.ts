import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { orderId, status } = await req.json();

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

        // Buscar la reserva
        const reserva = await prisma.reserva.findUnique({
            where: { codigo: orderId }
        });

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Verificar que la reserva esté en un estado que permita el pago
        if (reserva.estado !== 'CONFIRMADA_PENDIENTE_PAGO' && reserva.estado !== 'PENDIENTE_COTIZACION') {
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
            }
        });

        console.log(`✅ Reserva ${orderId} actualizada a PAGADA_PENDIENTE_ASIGNACION`);

        // TODO: Aquí se puede disparar el envío de email de confirmación (Fase 4 del proyecto)
        // await sendPaymentConfirmationEmail(updated);

        return NextResponse.json({
            success: true,
            data: updated,
            message: 'Pago confirmado exitosamente'
        });

    } catch (error) {
        console.error('Error confirmando pago:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
