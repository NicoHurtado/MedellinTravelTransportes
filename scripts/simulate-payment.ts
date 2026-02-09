/**
 * Script para simular el pago de una reserva
 * Uso: npx tsx scripts/simulate-payment.ts VWYZURDL
 */

import { prisma } from '../lib/prisma';

async function simulatePayment(codigoReserva: string) {
    try {
        console.log(`🔍 Buscando reserva con código: ${codigoReserva}`);

        // Buscar la reserva
        const reserva = await prisma.reserva.findUnique({
            where: { codigo: codigoReserva },
            include: {
                servicio: true,
                aliado: true
            }
        });

        if (!reserva) {
            console.error(`❌ Reserva no encontrada: ${codigoReserva}`);
            process.exit(1);
        }

        console.log(`✅ Reserva encontrada:`);
        console.log(`   - Estado actual: ${reserva.estado}`);
        console.log(`   - Estado pago: ${reserva.estadoPago}`);
        console.log(`   - Es reserva aliado: ${reserva.esReservaAliado}`);
        console.log(`   - Servicio: ${reserva.servicio?.nombre || 'N/A'}`);

        // Verificar que la reserva esté en un estado que permita el pago
        if (reserva.estado !== 'CONFIRMADA_PENDIENTE_PAGO' && reserva.estado !== 'PENDIENTE_COTIZACION') {
            console.error(`❌ La reserva no está en estado pendiente de pago. Estado actual: ${reserva.estado}`);
            process.exit(1);
        }

        // Actualizar el estado de la reserva
        const updated = await prisma.reserva.update({
            where: { codigo: codigoReserva },
            data: {
                estado: 'PAGADA_PENDIENTE_ASIGNACION',
                estadoPago: 'APROBADO'
            },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
                asistentes: true
            }
        });

        console.log(`\n✅ Reserva ${codigoReserva} actualizada exitosamente:`);
        console.log(`   - Nuevo estado: ${updated.estado}`);
        console.log(`   - Nuevo estado pago: ${updated.estadoPago}`);

        // Determine if this is an external reservation (not from an ally)
        const isExternalReservation = !updated.esReservaAliado && !updated.aliadoId;

        // 📅 Crear evento en Google Calendar AHORA que el pago está confirmado
        if (isExternalReservation) {
            try {
                if (updated.servicio?.tipo === 'TOUR_COMPARTIDO') {
                    const { createOrUpdateTourCompartidoEvent } = await import('../lib/google-calendar-service');
                    const eventId = await createOrUpdateTourCompartidoEvent(updated as any);

                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: updated.id },
                            data: { googleCalendarEventId: eventId }
                        });
                        console.log(`📅 [Tour Compartido] Calendar event created/updated: ${eventId}`);
                    }
                } else {
                    const { createCalendarEvent } = await import('../lib/google-calendar-service');
                    const eventId = await createCalendarEvent(updated as any);

                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: updated.id },
                            data: { googleCalendarEventId: eventId }
                        });
                        console.log(`📅 [Reserva Externa] Calendar event created: ${eventId}`);
                    }
                }
            } catch (calendarError) {
                console.error('❌ Error creating calendar event:', calendarError);
            }

            // 📧 Enviar email de confirmación de pago para reservas externas
            try {
                const { sendReservaConfirmadaEmail } = await import('../lib/email-service');
                await sendReservaConfirmadaEmail(updated as any, updated.idioma || 'ES', null);
                console.log(`📧 [Reserva Externa] Email de confirmación enviado`);
            } catch (emailError) {
                console.error('❌ Error sending confirmation email:', emailError);
            }
        } else {
            console.log(`ℹ️  Reserva de aliado - no se envía email ni calendar`);
        }

        console.log(`\n🎉 ¡Pago simulado exitosamente!`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Obtener código de reserva de los argumentos
const codigoReserva = process.argv[2];

if (!codigoReserva) {
    console.error('❌ Por favor proporciona el código de reserva');
    console.log('Uso: npx tsx scripts/simulate-payment.ts VWYZURDL');
    process.exit(1);
}

simulatePayment(codigoReserva);
