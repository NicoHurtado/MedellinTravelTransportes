import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
