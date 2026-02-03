import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva, EstadoPago } from '@prisma/client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/pedido
 * Crear pedido con múltiples reservas desde el carrito
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Validar que hay items en el carrito
        if (!body.cartItems || body.cartItems.length === 0) {
            return NextResponse.json(
                { error: 'El carrito está vacío' },
                { status: 400 }
            );
        }

        // Usar el primer item como referencia para el pedido
        // Nota: Cada servicio puede tener diferentes clientes (nombre, email, whatsapp)
        const firstItem = body.cartItems[0];

        // Generar código único para el pedido
        const codigoPedido = await generateUniqueCodigo('PED');

        // Calcular subtotal (suma de todos los precios de las reservas)
        const subtotal = body.cartItems.reduce((sum: number, item: any) => {
            const itemTotal =
                (parseFloat(item.precioBase) || 0) +
                (parseFloat(item.precioAdicionales) || 0) +
                (parseFloat(item.recargoNocturno) || 0) +
                (parseFloat(item.tarifaMunicipio) || 0) -
                (parseFloat(item.descuentoAliado) || 0);
            return sum + itemTotal;
        }, 0);

        // Determinar método de pago y estado
        const metodoPago = body.metodoPago || 'BOLD';
        let estadoPago: EstadoPago | null = null;

        let comisionBold = 0;

        if (metodoPago === 'EFECTIVO') {
            estadoPago = null; // Hoteles no tienen estado de pago
            comisionBold = 0;
        } else {
            estadoPago = EstadoPago.PENDIENTE;
            comisionBold = subtotal * 0.06;
        }

        const precioTotal = subtotal + comisionBold;

        // Verificar si todas las reservas son del mismo aliado
        const aliadoId = firstItem.aliadoId || null;
        const esReservaAliado = firstItem.esReservaAliado || false;

        // Generar todos los códigos de reserva ANTES de la transacción
        // Esto evita problemas de timeout en la transacción
        const codigosReservas: string[] = [];
        for (let i = 0; i < body.cartItems.length; i++) {
            const codigo = await generateUniqueCodigo('RES');
            codigosReservas.push(codigo);
        }

        // Crear el pedido con todas las reservas en una transacción
        const pedido = await prisma.$transaction(async (tx) => {
            // 1. Crear el pedido
            const nuevoPedido = await tx.pedido.create({
                data: {
                    codigo: codigoPedido,
                    nombreCliente: firstItem.nombreCliente,
                    whatsappCliente: firstItem.whatsappCliente,
                    emailCliente: firstItem.emailCliente,
                    idioma: body.idioma || 'ES',
                    subtotal,
                    comisionBold,
                    precioTotal,
                    estadoPago,
                    metodoPago,
                    aliadoId,
                    esReservaAliado,
                },
            });

            // 2. Crear todas las reservas
            const reservasCreadas = [];
            for (let i = 0; i < body.cartItems.length; i++) {
                const item = body.cartItems[i];
                // Usar el código pre-generado
                const codigoReserva = codigosReservas[i];

                // Calcular precio total de la reserva individual
                const precioTotalReserva =
                    (parseFloat(item.precioBase) || 0) +
                    (parseFloat(item.precioAdicionales) || 0) +
                    (parseFloat(item.recargoNocturno) || 0) +
                    (parseFloat(item.tarifaMunicipio) || 0) -
                    (parseFloat(item.descuentoAliado) || 0);

                // Calcular comisión de aliado si aplica
                let comisionAliado = 0;
                if (item.esReservaAliado && item.aliadoId) {
                    try {
                        const servicio = await tx.servicio.findUnique({
                            where: { id: item.servicioId }
                        });

                        if (servicio?.tipo === 'TRANSPORTE_MUNICIPAL') {
                            comisionAliado = precioTotalReserva * 0.10;
                        } else if (item.vehiculoId) {
                            const servicioAliado = await tx.servicioAliado.findUnique({
                                where: {
                                    aliadoId_servicioId: {
                                        aliadoId: item.aliadoId,
                                        servicioId: item.servicioId
                                    }
                                }
                            });

                            if (servicioAliado) {
                                const precioVehiculo = await tx.precioVehiculoAliado.findUnique({
                                    where: {
                                        servicioAliadoId_vehiculoId: {
                                            servicioAliadoId: servicioAliado.id,
                                            vehiculoId: item.vehiculoId
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

                // Determinar estado inicial de la reserva
                let estadoInicial: EstadoReserva;
                if (item.municipio === 'OTRO') {
                    estadoInicial = EstadoReserva.PENDIENTE_COTIZACION;
                } else if (metodoPago === 'EFECTIVO') {
                    estadoInicial = EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION;
                } else {
                    estadoInicial = EstadoReserva.CONFIRMADA_PENDIENTE_PAGO;
                }

                const reserva = await tx.reserva.create({
                    data: {
                        codigo: codigoReserva,
                        servicioId: item.servicioId,
                        fecha: new Date(item.fecha + 'T12:00:00.000Z'),
                        hora: item.hora,
                        nombreCliente: item.nombreCliente,
                        whatsappCliente: item.whatsappCliente,
                        emailCliente: item.emailCliente,
                        idioma: body.idioma || 'ES',
                        municipio: item.municipio,
                        otroMunicipio: item.otroMunicipio || null,
                        numeroPasajeros: parseInt(item.numeroPasajeros),
                        vehiculoId: item.vehiculoId || null,

                        // Campos específicos
                        aeropuertoTipo: item.aeropuertoTipo || null,
                        aeropuertoNombre: item.aeropuertoNombre || null,
                        numeroVuelo: item.numeroVuelo || null,
                        trasladoTipo: item.trasladoTipo || null,
                        trasladoDestino: item.trasladoDestino || null,
                        lugarRecogida: item.lugarRecogida || null,
                        guiaCertificado: item.guiaCertificado || false,
                        vueltaBote: item.vueltaBote || false,
                        cantidadAlmuerzos: item.cantidadAlmuerzos ? parseInt(item.cantidadAlmuerzos) : 0,
                        cantidadMotos: item.cantidadMotos ? parseInt(item.cantidadMotos) : 0,
                        cantidadParticipantes: item.cantidadParticipantes ? parseInt(item.cantidadParticipantes) : 0,
                        cantidadHoras: item.cantidadHoras ? parseInt(item.cantidadHoras) : null,

                        // Precios
                        precioBase: parseFloat(item.precioBase),
                        precioAdicionales: parseFloat(item.precioAdicionales || 0),
                        recargoNocturno: parseFloat(item.recargoNocturno || 0),
                        tarifaMunicipio: parseFloat(item.tarifaMunicipio || 0),
                        descuentoAliado: parseFloat(item.descuentoAliado || 0),
                        precioTotal: precioTotalReserva,
                        comisionAliado,

                        estado: estadoInicial,
                        estadoPago: metodoPago === 'EFECTIVO' ? null : EstadoPago.PENDIENTE,
                        metodoPago,

                        // Aliado
                        aliadoId: item.aliadoId || null,
                        esReservaAliado: item.esReservaAliado || false,

                        // Pedido
                        pedidoId: nuevoPedido.id,
                        esPedido: true,

                        notas: item.notas || null,
                        datosDinamicos: item.datosDinamicos || {},

                        // Crear asistentes si existen
                        asistentes: item.asistentes && item.asistentes.length > 0 ? {
                            create: item.asistentes.map((a: any) => ({
                                nombre: a.nombre,
                                tipoDocumento: a.tipoDocumento,
                                numeroDocumento: a.numeroDocumento,
                            }))
                        } : undefined,
                    },
                    include: {
                        servicio: true,
                        vehiculo: true,
                        asistentes: true,
                    },
                });

                reservasCreadas.push(reserva);
            }

            // 3. Retornar pedido con todas las reservas
            return await tx.pedido.findUnique({
                where: { id: nuevoPedido.id },
                include: {
                    reservas: {
                        include: {
                            servicio: true,
                            vehiculo: true,
                            asistentes: true,
                        }
                    },
                    aliado: true,
                },
            });
        }, {
            maxWait: 5000,
            timeout: 20000,
        });

        // Verificar que el pedido se creó correctamente
        if (!pedido) {
            return NextResponse.json(
                { error: 'Error creating pedido' },
                { status: 500 }
            );
        }

        // Enviar emails de confirmación individuales a cada cliente
        try {
            const { sendReservaConfirmadaEmail } = await import('@/lib/email-service');

            console.log(`📧 [Pedido] Sending ${pedido.reservas.length} confirmation emails for pedido: ${pedido.codigo}`);

            // Enviar un email por cada reserva del pedido
            // Include ally email so they also receive confirmation
            const aliadoEmail = pedido.aliado?.email || null;

            for (const reserva of pedido.reservas) {
                try {
                    await sendReservaConfirmadaEmail(
                        reserva as any,
                        body.idioma || 'ES',
                        aliadoEmail
                    );
                    console.log(`✅ [Pedido] Email sent successfully for reserva: ${reserva.codigo} to ${reserva.emailCliente}${aliadoEmail ? ` + ally: ${aliadoEmail}` : ''}`);
                } catch (emailError) {
                    console.error(`❌ [Pedido] Error sending email for reserva ${reserva.codigo}:`, emailError);
                    // Continuar enviando los demás emails aunque uno falle
                }
            }

            console.log(`✅ [Pedido] All confirmation emails processed for pedido: ${pedido.codigo}`);
        } catch (emailError) {
            console.error('❌ [Pedido] Error in email sending process:', emailError);
            // No fallar la creación del pedido si los emails fallan
        }

        // Crear eventos en Google Calendar para cada reserva
        try {
            const { createCalendarEvent } = await import('@/lib/google-calendar-service');

            for (const reserva of pedido!.reservas) {
                try {
                    const eventId = await createCalendarEvent(reserva as any);
                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: reserva.id },
                            data: { googleCalendarEventId: eventId }
                        });
                        console.log('✅ [Pedido] Calendar event created for reserva:', reserva.codigo);
                    }
                } catch (calError) {
                    console.error('❌ [Pedido] Error creating calendar event for reserva:', reserva.codigo, calError);
                }
            }
        } catch (calendarError) {
            console.error('❌ [Pedido] Error in calendar integration:', calendarError);
        }

        return NextResponse.json(
            {
                data: pedido,
                message: 'Pedido creado exitosamente'
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating pedido:', error);
        return NextResponse.json(
            { error: 'Error al crear pedido', details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * GET /api/pedido/[codigo]
 * Obtener pedido por código
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const codigo = searchParams.get('codigo');

        if (!codigo) {
            return NextResponse.json(
                { error: 'Código de pedido requerido' },
                { status: 400 }
            );
        }

        const pedido = await prisma.pedido.findUnique({
            where: { codigo },
            include: {
                reservas: {
                    include: {
                        servicio: true,
                        vehiculo: true,
                        asistentes: true,
                        conductor: true,
                    }
                },
                aliado: true,
            },
        });

        if (!pedido) {
            return NextResponse.json(
                { error: 'Pedido no encontrado' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: pedido });
    } catch (error) {
        console.error('Error fetching pedido:', error);
        return NextResponse.json(
            { error: 'Error al obtener pedido' },
            { status: 500 }
        );
    }
}

/**
 * Genera un código único de 8 caracteres alfanuméricos con prefijo
 */
async function generateUniqueCodigo(prefix: string): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo: string;
    let exists = true;

    while (exists) {
        let randomPart = '';
        for (let i = 0; i < 5; i++) {
            randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        codigo = `${prefix}${randomPart}`;

        // Verificar si ya existe en Pedido o Reserva
        const [existingPedido, existingReserva] = await Promise.all([
            prisma.pedido.findUnique({ where: { codigo } }),
            prisma.reserva.findUnique({ where: { codigo } }),
        ]);

        exists = !!(existingPedido || existingReserva);
    }

    return codigo!;
}
