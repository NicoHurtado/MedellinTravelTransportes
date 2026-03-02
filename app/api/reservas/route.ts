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
        const allReservas = await prisma.reserva.findMany({
            where,
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
                calificacion: true,
                asistentes: true,
            },
            orderBy: {
                fecha: 'desc',
            },
        });

        return NextResponse.json({ data: allReservas });
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
        const requestStart = Date.now();
        const body = await request.json();

        // Get service first to check type
        const servicio = await prisma.servicio.findUnique({
            where: { id: body.servicioId }
        });

        if (!servicio) {
            return NextResponse.json(
                { error: 'Servicio no encontrado' },
                { status: 404 }
            );
        }

        // Validar campos requeridos (municipio no es requerido para TOUR_COMPARTIDO)
        const requiredFields = [
            'servicioId',
            'fecha',
            'hora',
            'nombreCliente',
            'whatsappCliente',
            'emailCliente',
            'numeroPasajeros',
        ];

        // Add municipio to required fields only if NOT a shared tour
        if (servicio.tipo !== 'TOUR_COMPARTIDO') {
            requiredFields.push('municipio');
        }

        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { error: `Campo requerido: ${field}` },
                    { status: 400 }
                );
            }
        }

        const metodoPago = body.metodoPago === 'EFECTIVO' ? 'EFECTIVO' : 'BOLD';

        // Para hoteles o servicios normales, continuar con el flujo normal
        // Generar código único de 8 caracteres
        const codigo = await generateUniqueCodigo();

        // Calcular subtotal (precio del servicio sin comisión de Bold)
        const subtotal =
            (parseFloat(body.precioBase) || 0) +
            (parseFloat(body.precioAdicionales) || 0) +
            (parseFloat(body.recargoNocturno) || 0) +
            (parseFloat(body.tarifaMunicipio) || 0) -
            (parseFloat(body.descuentoAliado) || 0);

        // Calcular comisión de Volt/Bold (6% del subtotal para pagos con tarjeta)
        let comisionBold = 0;
        if (metodoPago === 'BOLD') {
            comisionBold = subtotal * 0.06;
        }

        // Calcular precio total (subtotal + comisión de Bold)
        const precioTotal = subtotal + comisionBold;

        // Calcular comisión de aliado si aplica
        let comisionAliado = 0;
        if (body.esReservaAliado && body.aliadoId) {
            try {
                // Obtener el servicio para verificar el tipo
                const servicio = await prisma.servicio.findUnique({
                    where: { id: body.servicioId }
                });

                // Comisión especial para Transporte Municipal: 10% del subtotal (sin Bold)
                if (servicio?.tipo === 'TRANSPORTE_MUNICIPAL') {
                    comisionAliado = subtotal * 0.10; // 10% del subtotal
                    console.log('💰 [Transporte Municipal] Comisión 10%:', comisionAliado, 'de', subtotal);
                }
                // Comisión para Tour Compartido: 10% del subtotal
                else if (servicio?.tipo === 'TOUR_COMPARTIDO') {
                    comisionAliado = subtotal * 0.10;
                    console.log('💰 [Tour Compartido] Comisión 10%:', comisionAliado, 'de', subtotal);
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

        // Determinar estado inicial
        let estadoInicial: EstadoReserva;
        let estadoPago: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'PROCESANDO' | null = null;

        if (body.municipio === 'OTRO') {
            // Municipio personalizado requiere cotización
            estadoInicial = EstadoReserva.PENDIENTE_COTIZACION;
            estadoPago = null;
        } else if (metodoPago === 'EFECTIVO') {
            // Pago en efectivo (NON-Tour Compartido) va a CONFIRMADA pendiente de asignación
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
                fecha: new Date(body.fecha + 'T12:00:00.000Z'),
                hora: body.hora,
                nombreCliente: body.nombreCliente,
                whatsappCliente: body.whatsappCliente,
                emailCliente: body.emailCliente,
                idioma: body.idioma || 'ES',
                municipio: body.municipio || null,
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
                comisionBold,
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
                        email: a.email,
                        telefono: a.telefono,
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

        // 📅 Calendar: BLOQUEANTE para que el evento aparezca inmediatamente
        const isExternalReservation = !body.esReservaAliado && !body.aliadoId;
        try {
            const calendarStart = Date.now();
            if (reserva.servicio.tipo === 'TOUR_COMPARTIDO') {
                const { createOrUpdateTourCompartidoEvent } = await import('@/lib/google-calendar-service');
                const eventId = await createOrUpdateTourCompartidoEvent(reserva as any);
                if (eventId) {
                    await prisma.reserva.update({
                        where: { id: reserva.id },
                        data: { googleCalendarEventId: eventId }
                    });
                    console.log('✅ [Tour Compartido] Calendar event created/updated:', eventId);
                }
            } else {
                const { createCalendarEvent } = await import('@/lib/google-calendar-service');
                const eventId = await createCalendarEvent(reserva as any);
                if (eventId) {
                    await prisma.reserva.update({
                        where: { id: reserva.id },
                        data: { googleCalendarEventId: eventId }
                    });
                    console.log('✅ [Reserva] Google Calendar event created:', eventId);
                }
            }
            console.log(`✅ [Reserva] Calendar flow completed in ${Date.now() - calendarStart}ms`);
        } catch (calendarError) {
            console.error('❌ [Reserva] Calendar error (non-blocking):', calendarError);
        }

        // 📧 Email: en segundo plano (no bloqueante)
        void (async () => {
            try {
                const { sendReservaConfirmadaEmail, sendCotizacionPendienteEmail, sendTourCompartidoConfirmationEmail } = await import('@/lib/email-service');

                if (reserva.servicio.tipo === 'TOUR_COMPARTIDO') {
                    await sendTourCompartidoConfirmationEmail(reserva as any, body.idioma || 'ES');
                } else if (estadoInicial === EstadoReserva.PENDIENTE_COTIZACION) {
                    await sendCotizacionPendienteEmail(reserva as any, body.idioma || 'ES');
                } else if (!isExternalReservation) {
                    const aliadoEmail = reserva.aliado?.email || null;
                    await sendReservaConfirmadaEmail(reserva as any, body.idioma || 'ES', aliadoEmail);
                } else {
                    console.log('📧 [Reserva Externa] Email de confirmación se enviará al confirmar pago');
                }
                console.log('✅ [Reserva] Email flow completed');
            } catch (emailError) {
                console.error('❌ [Reserva] Email error:', emailError);
            }
        })();

        console.log(`✅ [Reserva] POST responded in ${Date.now() - requestStart}ms`);

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
