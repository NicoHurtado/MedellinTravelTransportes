// Script to update service display order
// Run with: node scripts/update-service-order.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Update Tour Compartido Guatapé to position 3
        const result = await prisma.servicio.updateMany({
            where: {
                OR: [
                    {
                        nombre: {
                            path: ['es'],
                            string_contains: 'Tour compartido Guatape'
                        }
                    },
                    {
                        nombre: {
                            path: ['es'],
                            string_contains: 'Tour Compartido Guatape'
                        }
                    }
                ]
            },
            data: {
                orden: 3
            }
        });

        console.log(`✅ Updated ${result.count} service(s)`);
        console.log('Tour Compartido Guatapé should now appear in 3rd position');

        // Optional: Show all services with their orden
        const allServices = await prisma.servicio.findMany({
            select: {
                nombre: true,
                tipo: true,
                orden: true
            },
            orderBy: {
                orden: 'asc'
            }
        });

        console.log('\n📋 Current service order:');
        allServices.forEach((s, i) => {
            const nombre = typeof s.nombre === 'object' ? s.nombre.es || s.nombre.en : s.nombre;
            console.log(`${i + 1}. [orden: ${s.orden}] ${nombre}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
