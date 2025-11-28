import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/servicios/[id]
 * Obtener un servicio
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const servicio = await prisma.servicio.findUnique({
            where: { id },
            include: {
                adicionales: true,
                tarifasAliados: {
                    include: {
                        aliado: true,
                    },
                },
            },
        });

        if (!servicio) {
            return NextResponse.json(
                { error: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: servicio });
    } catch (error) {
        console.error('Error fetching servicio:', error);
        return NextResponse.json(
            { error: 'Error al obtener servicio' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/servicios/[id]
 * Actualizar servicio (ADMIN)
 */
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;
        const body = await req.json();

        const servicio = await prisma.servicio.update({
            where: { id },
            data: body,
            include: {
                adicionales: true,
            },
        });

        return NextResponse.json({
            data: servicio,
            message: 'Servicio actualizado exitosamente',
        });
    } catch (error) {
        console.error('Error updating servicio:', error);
        return NextResponse.json(
            { error: 'Error al actualizar servicio' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/servicios/[id]
 * Eliminar servicio (ADMIN) - Soft delete
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;

        // Verificar si tiene reservas activas
        const reservasActivas = await prisma.reserva.count({
            where: {
                servicioId: id,
                estado: {
                    notIn: ['COMPLETADA', 'CANCELADA'],
                },
            },
        });

        if (reservasActivas > 0) {
            return NextResponse.json(
                { error: 'No se puede eliminar un servicio con reservas activas' },
                { status: 400 }
            );
        }

        // Soft delete
        const servicio = await prisma.servicio.update({
            where: { id },
            data: { activo: false },
        });

        return NextResponse.json({
            data: servicio,
            message: 'Servicio eliminado exitosamente',
        });
    } catch (error) {
        console.error('Error deleting servicio:', error);
        return NextResponse.json(
            { error: 'Error al eliminar servicio' },
            { status: 500 }
        );
    }
}
