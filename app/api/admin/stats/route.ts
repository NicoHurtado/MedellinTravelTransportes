import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EstadoReserva } from '@prisma/client';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Count reservations by state
        const stats = await Promise.all(
            Object.values(EstadoReserva).map(async (estado) => {
                const count = await prisma.reserva.count({
                    where: { estado },
                });
                return { estado, count };
            })
        );

        // Total reservations
        const total = await prisma.reserva.count();

        return NextResponse.json({
            stats,
            total,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Error al obtener estadísticas' },
            { status: 500 }
        );
    }
}
