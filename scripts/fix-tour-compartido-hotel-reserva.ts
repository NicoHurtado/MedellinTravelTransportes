// Script to fix existing Tour Compartido hotel reservation
// Run with: npx tsx scripts/fix-tour-compartido-hotel-reserva.ts

import { PrismaClient, EstadoReserva } from '@prisma/client';

const prisma = new PrismaClient();

async function fixReservation() {
    try {
        const codigo = 'TFAZQ8CW';

        // Find the reservation
        const reserva = await prisma.reserva.findUnique({
            where: { codigo },
            include: {
                servicio: true,
                aliado: true,
            }
        });

        if (!reserva) {
            console.error(`❌ Reserva ${codigo} no encontrada`);
            return;
        }

        console.log('📋 Reserva actual:');
        console.log(`   Código: ${reserva.codigo}`);
        console.log(`   Estado: ${reserva.estado}`);
        console.log(`   Método de Pago: ${reserva.metodoPago}`);
        console.log(`   Es Aliado: ${reserva.esReservaAliado}`);
        console.log(`   Tipo Aliado: ${reserva.aliado?.tipo}`);
        console.log(`   Tipo Servicio: ${reserva.servicio?.tipo}`);

        // Check if it's a Tour Compartido hotel reservation
        const isTourCompartido = reserva.servicio?.tipo === 'TOUR_COMPARTIDO';
        const isHotelAlly = reserva.esReservaAliado && (reserva.aliado?.tipo === 'HOTEL' || reserva.aliado?.tipo === 'AGENCIA');

        if (!isTourCompartido || !isHotelAlly) {
            console.log('⚠️  Esta reserva no es un Tour Compartido de hotel');
            return;
        }

        // Update the reservation
        const updated = await prisma.reserva.update({
            where: { codigo },
            data: {
                estado: EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
                metodoPago: 'BOLD',
                estadoPago: 'PENDIENTE',
            }
        });

        console.log('\n✅ Reserva actualizada exitosamente:');
        console.log(`   Nuevo Estado: ${updated.estado}`);
        console.log(`   Nuevo Método de Pago: ${updated.metodoPago}`);
        console.log(`   Nuevo Estado de Pago: ${updated.estadoPago}`);
        console.log('\n🎉 Ahora la reserva mostrará la UI de selección de método de pago en la página de tracking');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixReservation();
