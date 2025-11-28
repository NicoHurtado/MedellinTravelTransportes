import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva } from '@prisma/client';
import { canCancelReservation } from '@/lib/timeline-states';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ codigo: string }> }
) {
    try {
        const { codigo } = await params;

        // Find reservation
        const reserva = await prisma.reserva.findUnique({
            where: { codigo },
            include: {
                servicio: true,
            },
        });

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Check if can be cancelled
        if (!canCancelReservation(reserva.fecha, reserva.estado)) {
            return NextResponse.json(
                { error: 'No se puede cancelar esta reserva. Debe faltar más de 24 horas o el estado no lo permite.' },
                { status: 400 }
            );
        }

        // Update reservation status
        const updatedReserva = await prisma.reserva.update({
            where: { id: reserva.id },
            data: {
                estado: EstadoReserva.CANCELADA,
            },
            include: {
                servicio: true,
                aliado: true,
            },
        });

        // Send cancellation email
        try {
            const { sendCancelacionEmail } = await import('@/lib/email-service');
            await sendCancelacionEmail(updatedReserva as any, reserva.idioma);
        } catch (emailError) {
            console.error('Error sending cancellation email:', emailError);
            // Don't fail the cancellation if email fails
        }

        return NextResponse.json({
            data: updatedReserva,
            message: 'Reserva cancelada exitosamente'
        });
    } catch (error) {
        console.error('Error cancelling reserva:', error);
        return NextResponse.json(
            { error: 'Error al cancelar reserva' },
            { status: 500 }
        );
    }
}
