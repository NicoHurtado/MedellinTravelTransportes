import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const codigo = '38HZEWW5';

    // 1. Buscar la reserva
    const reserva = await prisma.reserva.findUnique({
        where: { codigo },
        select: {
            id: true,
            codigo: true,
            estado: true,
            estadoPago: true,
            nombreCliente: true,
            precioTotal: true,
        }
    });

    if (!reserva) {
        console.error(`❌ Reserva ${codigo} no encontrada`);
        process.exit(1);
    }

    console.log('📋 Estado actual de la reserva:');
    console.log(`   Código: ${reserva.codigo}`);
    console.log(`   Cliente: ${reserva.nombreCliente}`);
    console.log(`   Estado: ${reserva.estado}`);
    console.log(`   Estado Pago: ${reserva.estadoPago}`);
    console.log(`   Precio Total: $${reserva.precioTotal}`);
    console.log('');

    // 2. Actualizar el estado
    const updated = await prisma.reserva.update({
        where: { codigo },
        data: {
            estado: 'PAGADA_PENDIENTE_ASIGNACION',
            estadoPago: 'APROBADO',
        },
        select: {
            codigo: true,
            estado: true,
            estadoPago: true,
        }
    });

    console.log('✅ Reserva actualizada:');
    console.log(`   Estado: ${updated.estado}`);
    console.log(`   Estado Pago: ${updated.estadoPago}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
