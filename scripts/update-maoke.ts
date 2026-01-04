import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const allyId = 'cmj3fvglp000858k0vju5grmy'; // MAOKE TRAVEL

        // Target CreatedAt: Dec 23, 2025
        const startRange = new Date('2025-12-23T00:00:00.000Z');
        const endRange = new Date('2025-12-23T23:59:59.999Z');

        const result = await prisma.reserva.updateMany({
            where: {
                aliadoId: allyId,
                createdAt: {
                    gte: startRange,
                    lte: endRange
                },
                comisionAliado: {
                    gt: 0
                }
            },
            data: {
                comisionAliado: 0
            }
        });

        console.log(`✅ Updated ${result.count} reservation(s) to 0 commission.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
