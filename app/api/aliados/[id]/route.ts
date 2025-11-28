import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/aliados/[id]
 * Obtener un aliado
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const aliado = await prisma.aliado.findUnique({
            where: { id },
            include: {
                tarifas: {
                    include: {
                        servicio: true,
                    },
                },
                _count: {
                    select: { reservas: true },
                },
            },
        });

        if (!aliado) {
            return NextResponse.json(
                { error: 'Aliado no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: aliado });
    } catch (error) {
        console.error('Error fetching aliado:', error);
        return NextResponse.json(
            { error: 'Error al obtener aliado' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/aliados/[id]
 * Actualizar aliado (ADMIN)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await req.json();

        const aliado = await prisma.aliado.update({
            where: { id },
            data: body,
        });

        return NextResponse.json({
            data: aliado,
            message: 'Aliado actualizado exitosamente',
        });
    } catch (error) {
        console.error('Error updating aliado:', error);
        return NextResponse.json(
            { error: 'Error al actualizar aliado' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/aliados/[id]
 * Eliminar aliado (ADMIN) - Soft delete
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const { id } = await params;

        // Verificar si tiene reservas activas
        const reservasActivas = await prisma.reserva.count({
            where: {
                aliadoId: id,
                estado: {
                    notIn: ['COMPLETADA', 'CANCELADA'],
                },
            },
        });

        if (reservasActivas > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un aliado con reservas activas' },
                { status: 400 }
            );
        }

        // Soft delete
        const aliado = await prisma.aliado.update({
            where: { id },
            data: { activo: false },
        });

        return NextResponse.json({
            data: aliado,
            message: 'Aliado eliminado exitosamente',
        });
    } catch (error) {
        console.error('Error deleting aliado:', error);
        return NextResponse.json(
            { error: 'Error al eliminar aliado' },
            { status: 500 }
        );
    }
}
