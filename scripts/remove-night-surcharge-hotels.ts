/**
 * Script to configure night surcharge override for specific hotels
 * 
 * Target hotels:
 * - HOTEL Torre Poblado
 * - HOTEL REFUGIO DEL JAGUAR
 * 
 * This script will:
 * 1. Find the target hotels by name
 * 2. For each active service associated with these hotels:
 *    - Set sobrescribirRecargoNocturno = true
 *    - Set aplicaRecargoNocturno = false
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for target hotels...\n');

    // Find the hotels by name (case-insensitive search)
    const hotels = await prisma.aliado.findMany({
        where: {
            OR: [
                { nombre: { contains: 'Torre Poblado', mode: 'insensitive' } },
                { nombre: { contains: 'REFUGIO', mode: 'insensitive' } },
            ],
            tipo: 'HOTEL',
        },
        include: {
            serviciosAliado: {
                where: {
                    activo: true,
                },
                include: {
                    servicio: true,
                },
            },
        },
    });

    if (hotels.length === 0) {
        console.log('❌ No hotels found matching the criteria');
        return;
    }

    console.log(`✅ Found ${hotels.length} hotel(s):\n`);
    hotels.forEach((hotel) => {
        console.log(`  📍 ${hotel.nombre}`);
        console.log(`     ID: ${hotel.id}`);
        console.log(`     Code: ${hotel.codigo}`);
        console.log(`     Active: ${hotel.activo}`);
        console.log(`     Active Services: ${hotel.serviciosAliado.length}`);
        console.log('');
    });

    // Configure each hotel's services
    let totalUpdated = 0;

    for (const hotel of hotels) {
        console.log(`\n🔧 Configuring services for: ${hotel.nombre}\n`);

        for (const servicioAliado of hotel.serviciosAliado) {
            const serviceName = typeof servicioAliado.servicio.nombre === 'object' && servicioAliado.servicio.nombre !== null
                ? (servicioAliado.servicio.nombre as any).es || 'N/A'
                : 'N/A';

            console.log(`  📦 Service: ${serviceName}`);
            console.log(`     Current override: ${servicioAliado.sobrescribirRecargoNocturno}`);
            console.log(`     Service night surcharge: ${servicioAliado.servicio.aplicaRecargoNocturno}`);

            // Update to disable night surcharge for this hotel
            await prisma.servicioAliado.update({
                where: { id: servicioAliado.id },
                data: {
                    sobrescribirRecargoNocturno: true,
                    aplicaRecargoNocturno: false,
                    recargoNocturnoInicio: null,
                    recargoNocturnoFin: null,
                    montoRecargoNocturno: null,
                },
            });

            console.log(`     ✅ Updated: Night surcharge DISABLED for this hotel`);
            console.log('');
            totalUpdated++;
        }
    }

    console.log(`\n✨ Configuration complete!`);
    console.log(`   Total services updated: ${totalUpdated}`);
    console.log(`\n📋 Summary:`);
    hotels.forEach((hotel) => {
        console.log(`   - ${hotel.nombre}: ${hotel.serviciosAliado.length} service(s) configured`);
    });
    console.log(`\n⚠️  Note: Other hotels and direct reservations will continue to use the service's default night surcharge configuration.`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
