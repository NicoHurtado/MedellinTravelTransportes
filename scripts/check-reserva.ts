import { prisma } from '../lib/prisma';

async function main() {
    // Find the most recent reservations for aliado PEDRO RAMÍREZ
    const reservas = await prisma.reserva.findMany({
        where: { aliadoId: 'cmmxkfwzm00008c92m3tu5ksh' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { servicio: true, aliado: true },
    });

    console.log(`=== Últimas ${reservas.length} reservas del aliado PEDRO RAMÍREZ ===`);
    for (const r of reservas) {
        console.log(`\n--- ${r.codigo} ---`);
        console.log('  Estado:', r.estado);
        console.log('  Estado Pago:', r.estadoPago);
        console.log('  Método Pago:', r.metodoPago);
        console.log('  Email:', r.emailCliente);
        console.log('  Es Pedido:', r.esPedido);
        console.log('  Calendar ID:', r.googleCalendarEventId ? '✅' : '❌');
        console.log('  Creada:', r.createdAt);
    }
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
    });
