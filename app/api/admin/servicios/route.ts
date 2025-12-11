import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateDynamicFields } from '@/types/dynamic-fields';
import { MultiLangTextSchema, MultiLangArraySchema } from '@/types/multi-language';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/servicios
 * List all services with pagination and filters
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';
        const tipo = searchParams.get('tipo') || '';
        const activo = searchParams.get('activo');

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};

        // No podemos usar contains en campos JSON, así que filtramos después
        if (tipo) {
            where.tipo = tipo;
        }

        if (activo !== null && activo !== undefined) {
            where.activo = activo === 'true';
        }

        // Fetch services
        let servicios = await prisma.servicio.findMany({
            where,
            skip: search ? undefined : skip, // Si hay búsqueda, no paginamos aún
            take: search ? undefined : limit,
            orderBy: { createdAt: 'desc' },
            include: {
                vehiculosPermitidos: {
                    include: {
                        vehiculo: true,
                    },
                },
                _count: {
                    select: {
                        reservas: true,
                    },
                },
                tarifasMunicipios: true,
            },
        });

        // Filtrar por búsqueda en memoria (ya que nombre es JSON)
        // Busca SOLO en los nombres de los servicios
        if (search) {
            const searchLower = search.toLowerCase();
            servicios = servicios.filter((servicio: any) => {
                const nombreEs = (servicio.nombre as any)?.es?.toLowerCase() || '';
                const nombreEn = (servicio.nombre as any)?.en?.toLowerCase() || '';
                
                return nombreEs.includes(searchLower) || nombreEn.includes(searchLower);
            });
        }

        const total = servicios.length;

        // Aplicar paginación después del filtro
        if (search) {
            servicios = servicios.slice(skip, skip + limit);
        }

        return NextResponse.json({
            success: true,
            data: servicios,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { error: 'Error al obtener servicios' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/servicios
 * Create a new service
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const {
            nombre,
            tipo,
            descripcion,
            imagen,
            duracion,
            incluye,
            precioBase,
            aplicaRecargoNocturno,
            recargoNocturnoInicio,
            recargoNocturnoFin,
            montoRecargoNocturno,
            esAeropuerto,
            esPorHoras,
            destinoAutoFill,
            camposPersonalizados,
            vehiculos, // Array of { vehiculoId, precio }
            tarifasMunicipios, // Array of { municipio, valorExtra }
        } = body;

        // Validate required fields
        if (!nombre || !tipo || !descripcion || !imagen) {
            return NextResponse.json(
                { error: 'Campos requeridos faltantes' },
                { status: 400 }
            );
        }

        // Validate multi-language format
        try {
            MultiLangTextSchema.parse(nombre);
            MultiLangTextSchema.parse(descripcion);
            MultiLangArraySchema.parse(incluye);
        } catch (error) {
            return NextResponse.json(
                { error: 'Formato multi-idioma inválido. Asegúrate de proporcionar texto en español e inglés.' },
                { status: 400 }
            );
        }

        // Validate dynamic fields if provided
        if (camposPersonalizados) {
            try {
                validateDynamicFields(camposPersonalizados);
            } catch (error) {
                return NextResponse.json(
                    { error: 'Configuración de campos dinámicos inválida', details: error },
                    { status: 400 }
                );
            }
        }

        // Create service
        const servicio = await prisma.servicio.create({
            data: {
                nombre,
                tipo,
                descripcion,
                imagen,
                duracion,
                incluye: incluye || [],
                precioBase: precioBase || 0,
                aplicaRecargoNocturno: aplicaRecargoNocturno || false,
                recargoNocturnoInicio,
                recargoNocturnoFin,
                montoRecargoNocturno: aplicaRecargoNocturno ? montoRecargoNocturno : null,
                esAeropuerto: esAeropuerto || false,
                esPorHoras: esPorHoras || false,
                destinoAutoFill,
                camposPersonalizados: camposPersonalizados || [],
                activo: true,
                // Create vehicle relationships
                vehiculosPermitidos: vehiculos
                    ? {
                        create: vehiculos.map((v: any) => ({
                            vehiculoId: v.vehiculoId,
                            precio: v.precio,
                        })),
                    }
                    : undefined,
                // Create municipality pricing
                tarifasMunicipios: tarifasMunicipios
                    ? {
                        create: tarifasMunicipios.map((t: any) => ({
                            municipio: t.municipio,
                            valorExtra: t.valorExtra,
                        })),
                    }
                    : undefined,
            },
            include: {
                vehiculosPermitidos: {
                    include: {
                        vehiculo: true,
                    },
                },
                tarifasMunicipios: true,
            },
        });

        return NextResponse.json({
            success: true,
            data: servicio,
        });
    } catch (error) {
        console.error('Error creating service:', error);
        return NextResponse.json(
            { error: 'Error al crear servicio' },
            { status: 500 }
        );
    }
}
