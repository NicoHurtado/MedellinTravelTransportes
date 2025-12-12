import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

// GET - Obtener servicios configurados para un aliado
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const serviciosAliado = await prisma.servicioAliado.findMany({
            where: { aliadoId: id },
            include: {
                servicio: {
                    include: {
                        vehiculosPermitidos: {
                            include: {
                                vehiculo: true
                            }
                        }
                    }
                },
                preciosVehiculos: {
                    include: {
                        vehiculo: true
                    }
                }
            },
            orderBy: {
                servicio: {
                    esAeropuerto: 'desc' // Airport services first
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: serviciosAliado
        });
    } catch (error) {
        console.error('Error fetching servicios aliado:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener servicios del aliado' },
            { status: 500 }
        );
    }
}

// POST - Crear/Actualizar configuración de servicio para aliado
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: aliadoId } = params;
        const body = await request.json();
        const { servicioId, activo, preciosVehiculos } = body;

        // Upsert ServicioAliado
        const servicioAliado = await prisma.servicioAliado.upsert({
            where: {
                aliadoId_servicioId: {
                    aliadoId,
                    servicioId
                }
            },
            update: {
                activo
            },
            create: {
                aliadoId,
                servicioId,
                activo
            }
        });

        // Actualizar precios de vehículos
        if (preciosVehiculos && Array.isArray(preciosVehiculos)) {
            // Eliminar precios existentes
            await prisma.precioVehiculoAliado.deleteMany({
                where: { servicioAliadoId: servicioAliado.id }
            });

            // Crear nuevos precios
            if (preciosVehiculos.length > 0) {
                await prisma.precioVehiculoAliado.createMany({
                    data: preciosVehiculos.map((pv: any) => ({
                        servicioAliadoId: servicioAliado.id,
                        vehiculoId: pv.vehiculoId,
                        precio: parseFloat(pv.precio),
                        comision: parseFloat(pv.comision || 0)
                    }))
                });
            }
        }

        // Obtener configuración actualizada
        const updated = await prisma.servicioAliado.findUnique({
            where: { id: servicioAliado.id },
            include: {
                servicio: true,
                preciosVehiculos: {
                    include: {
                        vehiculo: true
                    }
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: updated
        });
    } catch (error) {
        console.error('Error saving servicio aliado:', error);
        return NextResponse.json(
            { success: false, error: 'Error al guardar configuración del servicio' },
            { status: 500 }
        );
    }
}

// DELETE - Eliminar servicio de aliado
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id: aliadoId } = params;
        const { searchParams } = new URL(request.url);
        const servicioId = searchParams.get('servicioId');

        if (!servicioId) {
            return NextResponse.json(
                { success: false, error: 'servicioId is required' },
                { status: 400 }
            );
        }

        await prisma.servicioAliado.delete({
            where: {
                aliadoId_servicioId: {
                    aliadoId,
                    servicioId
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Servicio eliminado del aliado'
        });
    } catch (error) {
        console.error('Error deleting servicio aliado:', error);
        return NextResponse.json(
            { success: false, error: 'Error al eliminar servicio del aliado' },
            { status: 500 }
        );
    }
}
