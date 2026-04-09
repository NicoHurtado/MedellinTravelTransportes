import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkReservas() {
    const codigos = ['M9K47TFQ', 'V2JLN3DX'];
    
    for (const codigo of codigos) {
        const reserva = await prisma.reserva.findUnique({
            where: { codigo },
            include: {
                servicio: true,
                aliado: true,
                vehiculo: true,
                conductor: true,
                pedido: true,
            },
        });
        
        if (!reserva) {
            console.log(`\n❌ Reserva ${codigo}: NO ENCONTRADA`);
            continue;
        }
        
        console.log(`\n========== RESERVA ${codigo} ==========`);
        console.log(`  Cliente: ${reserva.nombreCliente}`);
        console.log(`  Email: ${reserva.emailCliente}`);
        console.log(`  WhatsApp: ${reserva.whatsappCliente}`);
        console.log(`  Servicio: ${reserva.servicio?.tipo} (ID: ${reserva.servicioId})`);
        console.log(`  Fecha: ${reserva.fecha}`);
        console.log(`  Hora: ${reserva.hora}`);
        console.log(`  Estado: ${reserva.estado}`);
        console.log(`  Estado Pago: ${reserva.estadoPago}`);
        console.log(`  Método Pago: ${reserva.metodoPago}`);
        console.log(`  esCotizacion: ${reserva.esCotizacion}`);
        console.log(`  esPedido: ${reserva.esPedido}`);
        console.log(`  esReservaAliado: ${reserva.esReservaAliado}`);
        console.log(`  aliadoId: ${reserva.aliadoId}`);
        console.log(`  Aliado: ${reserva.aliado?.nombre || 'N/A'} (tipo: ${reserva.aliado?.tipo || 'N/A'})`);
        console.log(`  precioTotal: ${reserva.precioTotal}`);
        console.log(`  precioBase: ${reserva.precioBase}`);
        console.log(`  precioManual: ${reserva.precioManual}`);
        console.log(`  Municipio: ${reserva.municipio}`);
        console.log(`  Vehiculo: ${reserva.vehiculo?.nombre || 'N/A'}`);
        console.log(`  Conductor: ${reserva.conductor?.nombre || 'N/A'}`);
        console.log(`  Calendar Event: ${reserva.googleCalendarEventId || 'NONE'}`);
        console.log(`  Pedido: ${reserva.pedido?.codigo || 'N/A'}`);
        console.log(`  Created: ${reserva.createdAt}`);
        console.log(`  Updated: ${reserva.updatedAt}`);
    }
    
    await prisma.$disconnect();
}

checkReservas().catch(console.error);
