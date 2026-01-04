import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const aliados = await prisma.aliado.findMany({
            where: {
                nombre: {
                    contains: 'MAOKE',
                    mode: 'insensitive'
                }
            }
        });

        if (aliados.length === 0) {
            console.log('❌ No ally found matching "MAOKE"');
            return;
        }

        console.log(`✅ Found ${aliados.length} ally(s). Checking reservations for each...`);

        // Search by CreatedAt: Dec 23, 2025
        // Adjusting for potential timezone offsets, let's look at the whole day in UTC and maybe +/- 1 day to be safe, filtering visually.
        const startRange = new Date('2025-12-23T00:00:00.000Z');
        const endRange = new Date('2025-12-23T23:59:59.999Z');

        for (const ally of aliados) {
            console.log(`\nChecking Ally: ${ally.nombre} (ID: ${ally.id})`);

            const reservations = await prisma.reserva.findMany({
                where: {
                    aliadoId: ally.id,
                    createdAt: {
                        gte: startRange,
                        lte: endRange
                    }
                },
                select: {
                    id: true,
                    codigo: true,
                    createdAt: true,
                    fecha: true,
                    comisionAliado: true,
                    precioTotal: true,
                    nombreCliente: true,
                    estado: true
                }
            });

            if (reservations.length === 0) {
                console.log('   No reservations created on Dec 23');
            } else {
                console.log(`   Found ${reservations.length} records created on Dec 23:`);
                reservations.forEach(r => {
                    console.log(`   - [${r.codigo}] Created: ${r.createdAt.toISOString()} | ServiceDate: ${r.fecha.toISOString()} | Client: ${r.nombreCliente} | Comision: ${r.comisionAliado}`);
                });
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
