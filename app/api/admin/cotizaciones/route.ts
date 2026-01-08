import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateBoldHash } from '@/lib/bold';
import { Idioma, Municipio, TipoDocumento, AeropuertoNombre, EstadoReserva, EstadoPago, MetodoPago } from '@prisma/client';

// Función para generar código de cotización único
function generateQuoteLink(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres ambiguos
    let code = 'COT';
    for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * POST /api/admin/cotizaciones
 * Crear una cotización con precio personalizado
 * Requiere autenticación de admin
 */
export async function POST(req: NextRequest) {
    try {
        // Verificar autenticación
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        const body = await req.json();

        // Validar precio personalizado
        const precioPersonalizado = Number(body.precioPersonalizado);
        if (!precioPersonalizado || precioPersonalizado <= 0) {
            return NextResponse.json(
                { error: 'El precio personalizado debe ser mayor a 0' },
                { status: 400 }
            );
        }

        // Generar link único de cotización
        let linkCotizacion = generateQuoteLink();
        let attempts = 0;
        const maxAttempts = 10;

        // Asegurar que el link sea único
        while (attempts < maxAttempts) {
            const existing = await prisma.reserva.findUnique({
                where: { linkCotizacion }
            });
            if (!existing) break;
            linkCotizacion = generateQuoteLink();
            attempts++;
        }

        if (attempts >= maxAttempts) {
            return NextResponse.json(
                { error: 'No se pudo generar un link único. Intenta de nuevo.' },
                { status: 500 }
            );
        }

        // Generar código de reserva único
        const generateReservationCode = (): string => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let code = 'RES';
            for (let i = 0; i < 5; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        let codigo = generateReservationCode();
        attempts = 0;
        while (attempts < maxAttempts) {
            const existing = await prisma.reserva.findUnique({
                where: { codigo }
            });
            if (!existing) break;
            codigo = generateReservationCode();
            attempts++;
        }

        // Generar hash de Bold para el pago
        const hashPago = generateBoldHash(
            codigo,
            precioPersonalizado,
            'COP'
        );

        // Crear la cotización (reserva con precio manual)
        const cotizacion = await prisma.reserva.create({
            data: {
                codigo,
                linkCotizacion,
                esCotizacion: true,
                precioManual: true,

                // Información del cliente
                nombreCliente: body.nombreCliente,
                whatsappCliente: body.whatsappCliente,
                emailCliente: body.emailCliente,

                // Detalles del servicio
                servicioId: body.servicioId,
                fecha: new Date(body.fecha),
                hora: body.hora,
                idioma: body.idioma || Idioma.ES,
                municipio: body.municipio,
                otroMunicipio: body.otroMunicipio || null,
                numeroPasajeros: body.numeroPasajeros,
                vehiculoId: body.vehiculoId || null,

                // Campos específicos
                aeropuertoTipo: body.aeropuertoTipo || null,
                trasladoTipo: body.trasladoTipo || null,
                trasladoDestino: body.trasladoDestino || null,
                aeropuertoNombre: body.aeropuertoNombre || null,
                numeroVuelo: body.numeroVuelo || null,
                lugarRecogida: body.lugarRecogida || null,
                cantidadHoras: body.cantidadHoras || null,

                // Precios - Todo en precioTotal (precio personalizado)
                precioBase: precioPersonalizado,
                precioAdicionales: 0,
                recargoNocturno: 0,
                tarifaMunicipio: 0,
                descuentoAliado: 0,
                precioTotal: precioPersonalizado,

                // Estado
                estado: EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
                estadoPago: EstadoPago.PENDIENTE,
                metodoPago: MetodoPago.BOLD,

                // Pago
                hashPago,

                // Notas
                notas: body.notas || null,
                notasInternas: body.notasInternas || `Cotización creada por ${session.user?.email}`,

                // Datos dinámicos
                datosDinamicos: body.datosDinamicos || {},

                // Asistentes
                asistentes: body.asistentes?.length > 0 ? {
                    create: body.asistentes
                        .filter((a: any) => a.nombre && a.numeroDocumento)
                        .map((a: any) => ({
                            nombre: a.nombre,
                            tipoDocumento: a.tipoDocumento || TipoDocumento.CC,
                            numeroDocumento: a.numeroDocumento,
                        }))
                } : undefined,
            },
            include: {
                servicio: true,
                vehiculo: true,
                asistentes: true,
            }
        });

        console.log('✅ Cotización creada:', {
            codigo: cotizacion.codigo,
            linkCotizacion: cotizacion.linkCotizacion,
            precioTotal: cotizacion.precioTotal,
        });

        return NextResponse.json({
            success: true,
            data: {
                codigo: cotizacion.codigo,
                linkCotizacion: cotizacion.linkCotizacion,
                precioTotal: cotizacion.precioTotal,
                cotizacion,
            }
        });

    } catch (error: any) {
        console.error('❌ Error creando cotización:', error);
        return NextResponse.json(
            { error: error.message || 'Error al crear cotización' },
            { status: 500 }
        );
    }
}
