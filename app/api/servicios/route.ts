import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/servicios
 * Lista servicios activos
 * Query param: ?activo=true
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Filtro por activo (por defecto solo activos)
        const activoParam = searchParams.get('activo');
        const activo = activoParam === null ? true : activoParam === 'true';

        // Filtro por tipo (opcional)
        const tipo = searchParams.get('tipo');

        // Build where clause
        const where: any = { activo };
        if (tipo) {
            where.tipo = tipo;
        }

        const servicios = await prisma.servicio.findMany({
            where,
            include: {
                adicionales: true,
                tarifasMunicipios: true,
                tarifasAliados: {
                    include: {
                        aliado: true,
                    },
                },
                vehiculosPermitidos: {
                    include: {
                        vehiculo: true
                    }
                }
            },
        });

        return NextResponse.json({ data: servicios, success: true });
    } catch (error) {
        console.error('Error fetching servicios:', error);
        return NextResponse.json(
            { error: 'Error al obtener servicios' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/servicios
 * Crear servicio (ADMIN)
 */
export async function POST(request: Request) {
    try {
        // Verificar auth admin
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await request.json();

        // Validar campos requeridos
        const requiredFields = ['nombre', 'precioBase'];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Crear servicio
        const servicio = await prisma.servicio.create({
            data: {
                nombre: body.nombre,
                tipo: body.tipo || 'OTRO',
                descripcion: body.descripcion || body.descripcionLarga || body.descripcionCorta || '',
                imagen: body.imagen || '',
                duracion: body.duracion || (body.duracionHoras ? `${body.duracionHoras} horas` : null),
                incluye: body.incluye || [],
                precioBase: parseFloat(body.precioBase),

                // Recargo Nocturno
                aplicaRecargoNocturno: body.aplicaRecargoNocturno || false,
                recargoNocturnoInicio: body.recargoNocturnoInicio || null,
                recargoNocturnoFin: body.recargoNocturnoFin || null,
                montoRecargoNocturno: body.montoRecargoNocturno ? parseFloat(body.montoRecargoNocturno) : null,

                // Special service logic flags
                esAeropuerto: body.esAeropuerto || false,
                esPorHoras: body.esPorHoras || false,
                destinoAutoFill: body.destinoAutoFill || null,

                // Dynamic fields configuration
                camposPersonalizados: body.camposPersonalizados || [],

                activo: body.activo !== undefined ? body.activo : true,
            },
            include: {
                adicionales: true,
            },
        });

        return NextResponse.json(
            {
                data: servicio,
                message: 'Servicio creado exitosamente',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating servicio:', error);
        return NextResponse.json(
            { error: 'Error al crear servicio' },
            { status: 500 }
        );
    }
}
