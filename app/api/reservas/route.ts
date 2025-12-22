import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva } from '@prisma/client';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

/**
 * GET /api/reservas
 * Lista todas las reservas con filtros opcionales
 * Query params: ?estado=, ?fecha=, ?servicio=, ?esAliado=
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Construir filtros dinámicos
        const where: any = {};

        // Filtro por estado
        const estado = searchParams.get('estado');
        if (estado) {
            where.estado = estado;
        }

        // Filtro por fecha
        const fecha = searchParams.get('fecha');
        if (fecha) {
            where.fecha = new Date(fecha);
        }

        // Filtro por servicio
        const servicioId = searchParams.get('servicio');
        if (servicioId) {
            where.servicioId = parseInt(servicioId);
        }

        // Filtro por tipo (aliado o no)
        const esAliado = searchParams.get('esAliado');
        if (esAliado !== null) {
            where.esReservaAliado = esAliado === 'true';
        }

        // Buscar reservas
        const reservas = await prisma.reserva.findMany({
            where,
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
                calificacion: true,
            },
            orderBy: {
                fecha: 'desc',
            },
        });

        return NextResponse.json({ data: reservas });
    } catch (error) {
        console.error('Error fetching reservas:', error);
        return NextResponse.json(
            { error: 'Error al obtener reservas' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/reservas
 * Crear nueva reserva
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar campos requeridos
        const requiredFields = [
            'servicioId',
            'fecha',
            'hora',
            'nombreCliente',
            'whatsappCliente',
            'emailCliente',
            'numeroPasajeros',
            'municipio',
        ];

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Generar código único de 8 caracteres
        const codigo = await generateUniqueCodigo();

        // Calcular precio total
        const precioTotal =
            (parseFloat(body.precioBase) || 0) +
            (parseFloat(body.precioAdicionales) || 0) +
            (parseFloat(body.recargoNocturno) || 0) +
            (parseFloat(body.tarifaMunicipio) || 0) -
            (parseFloat(body.descuentoAliado) || 0);

        // Calcular comisión de aliado si aplica
        let comisionAliado = 0;
        if (body.esReservaAliado && body.aliadoId) {
            try {
                // Obtener el servicio para verificar el tipo
                const servicio = await prisma.servicio.findUnique({
                    where: { id: body.servicioId }
                });

                // Comisión especial para Transporte Municipal: 10% del precio total
                if (servicio?.tipo === 'TRANSPORTE_MUNICIPAL') {
                    comisionAliado = precioTotal * 0.10; // 10% del precio total
                    console.log('💰 [Transporte Municipal] Comisión 10%:', comisionAliado, 'de', precioTotal);
                } 
                // Comisión normal para otros servicios (basada en precio de vehículo)
                else if (body.vehiculoId) {
                    const servicioAliado = await prisma.servicioAliado.findUnique({
                        where: {
                            aliadoId_servicioId: {
                                aliadoId: body.aliadoId,
                                servicioId: body.servicioId
                            }
                        }
                    });

                    if (servicioAliado) {
                        const precioVehiculo = await prisma.precioVehiculoAliado.findUnique({
                            where: {
                                servicioAliadoId_vehiculoId: {
                                    servicioAliadoId: servicioAliado.id,
                                    vehiculoId: body.vehiculoId
                                }
                            }
                        });

                        if (precioVehiculo) {
                            comisionAliado = Number(precioVehiculo.comision);
                        }
                    }
                }
            } catch (e) {
                console.error('Error calculating ally commission:', e);
            }
        }

        // Determinar método de pago (default: BOLD)
        const metodoPago = body.metodoPago || 'BOLD';

        // Determinar estado inicial
        let estadoInicial: EstadoReserva;
        let estadoPago: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PROCESANDO' | null = null;

        if (body.municipio === 'OTRO') {
            // Municipio personalizado requiere cotización
            estadoInicial = EstadoReserva.PENDIENTE_COTIZACION;
            estadoPago = null;
        } else if (metodoPago === 'EFECTIVO') {
            // Pago en efectivo (HOTEL) va a CONFIRMADA pendiente de asignación
            estadoInicial = EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION;
            estadoPago = null;
        } else {
            // Pago con Bold sigue flujo normal
            if (body.esReservaAliado) {
                estadoInicial = EstadoReserva.CONFIRMADA_PENDIENTE_PAGO;
            } else {
                estadoInicial = EstadoReserva.CONFIRMADA_PENDIENTE_PAGO;
            }
            estadoPago = 'PENDIENTE';
        }

        // Crear reserva con asistentes
        const reserva = await prisma.reserva.create({
            data: {
                codigo,
                servicioId: body.servicioId,
                fecha: new Date(body.fecha),
                hora: body.hora,
                nombreCliente: body.nombreCliente,
                whatsappCliente: body.whatsappCliente,
                emailCliente: body.emailCliente,
                idioma: body.idioma || 'ES',
                municipio: body.municipio,
                otroMunicipio: body.otroMunicipio || null,
                numeroPasajeros: parseInt(body.numeroPasajeros),
                vehiculoId: body.vehiculoId || null,

                // Campos específicos
                aeropuertoTipo: body.aeropuertoTipo || null,
                aeropuertoNombre: body.aeropuertoNombre || null,
                numeroVuelo: body.numeroVuelo || null,
                trasladoTipo: body.trasladoTipo || null,
                trasladoDestino: body.trasladoDestino || null,
                lugarRecogida: body.lugarRecogida || null,
                guiaCertificado: body.guiaCertificado || false,
                vueltaBote: body.vueltaBote || false,
                cantidadAlmuerzos: body.cantidadAlmuerzos ? parseInt(body.cantidadAlmuerzos) : 0,
                cantidadMotos: body.cantidadMotos ? parseInt(body.cantidadMotos) : 0,
                cantidadParticipantes: body.cantidadParticipantes ? parseInt(body.cantidadParticipantes) : 0,

                // Precios
                precioBase: parseFloat(body.precioBase),
                precioAdicionales: parseFloat(body.precioAdicionales || 0),
                recargoNocturno: parseFloat(body.recargoNocturno || 0),
                tarifaMunicipio: parseFloat(body.tarifaMunicipio || 0),
                descuentoAliado: parseFloat(body.descuentoAliado || 0),
                precioTotal,
                comisionAliado,

                estado: estadoInicial,
                estadoPago: estadoPago,

                // Método de Pago
                metodoPago: metodoPago,

                // Aliado
                aliadoId: body.aliadoId || null,
                esReservaAliado: body.esReservaAliado || false,

                notas: body.notas || null,

                // Campos dinámicos del formulario
                datosDinamicos: body.datosDinamicos || {},

                // Crear asistentes
                asistentes: body.asistentes && body.asistentes.length > 0 ? {
                    create: body.asistentes.map((a: any) => ({
                        nombre: a.nombre,
                        tipoDocumento: a.tipoDocumento,
                        numeroDocumento: a.numeroDocumento,
                    }))
                } : undefined,
            },
            include: {
                servicio: true,
                aliado: true,
                asistentes: true,
                vehiculo: true,
            },
        });

        // Enviar email de confirmación
        try {
            const { sendReservaConfirmadaEmail, sendCotizacionPendienteEmail } = await import('@/lib/email-service');

            if (estadoInicial === EstadoReserva.PENDIENTE_COTIZACION) {
                await sendCotizacionPendienteEmail(reserva as any, body.idioma || 'ES');
            } else {
                await sendReservaConfirmadaEmail(reserva as any, body.idioma || 'ES');
            }
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
            // Don't fail the reservation if email fails
        }

        // Crear evento en Google Calendar
        try {
            const { createCalendarEvent } = await import('@/lib/google-calendar-service');
            const eventId = await createCalendarEvent(reserva as any);

            // Actualizar reserva con el eventId si se creó exitosamente
            if (eventId) {
                await prisma.reserva.update({
                    where: { id: reserva.id },
                    data: { googleCalendarEventId: eventId }
                });
                console.log('✅ [Reserva] Google Calendar event created and linked:', eventId);
            }
        } catch (calendarError) {
            console.error('❌ [Reserva] Error creating calendar event:', calendarError);
            // No fallar la reserva si el calendario falla
        }

        return NextResponse.json(
            {
                data: reserva,
                message: 'Reserva creada exitosamente'
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating reserva:', error);
        return NextResponse.json(
            { error: 'Error al crear reserva' },
            { status: 500 }
        );
    }
}

/**
 * Genera un código único de 8 caracteres alfanuméricos
 */
async function generateUniqueCodigo(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
    let codigo: string;
    let exists = true;

    while (exists) {
        codigo = '';
        for (let i = 0; i < 8; i++) {
            codigo += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        // Verificar si ya existe
        const existing = await prisma.reserva.findUnique({
            where: { codigo },
        });

        exists = !!existing;
    }

    return codigo!;
}
