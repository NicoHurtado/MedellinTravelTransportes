// Script to set proper display order for all main services
// Run with: node scripts/set-all-service-orders.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Define the desired order
        const serviceOrders = [
            { name: 'Traslado Privado Aeropuerto', orden: 1 },
            { name: 'Tour a Guatapé y El Peñol', orden: 2 },
            { name: 'Tour compartido Guatape', orden: 3 },
            { name: 'City Tour Medellín', orden: 4 },
            { name: 'Tour Comuna 13', orden: 5 },
            { name: 'Tour del Café', orden: 6 },
            { name: 'Tour de Cuatrimotos', orden: 7 },
            { name: 'Tour de Parapente', orden: 8 },
            { name: 'Disposición de Vehículo por Horas', orden: 9 },
        ];

        console.log('🔄 Updating service orders...\n');

        for (const { name, orden } of serviceOrders) {
            const result = await prisma.servicio.updateMany({
                where: {
                    nombre: {
                        path: ['es'],
                        string_contains: name
                    }
                },
                data: { orden }
            });

            if (result.count > 0) {
                console.log(`✅ [${orden}] ${name}`);
            } else {
                console.log(`⚠️  [${orden}] ${name} - Not found`);
            }
        }

        console.log('\n📋 Updated service order:');
        const allServices = await prisma.servicio.findMany({
            where: {
                activo: true,
                tipo: {
                    not: 'TRANSPORTE_MUNICIPAL'
                }
            },
            select: {
                nombre: true,
                tipo: true,
                orden: true
            },
            orderBy: {
                orden: 'asc'
            },
            take: 15
        });

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
