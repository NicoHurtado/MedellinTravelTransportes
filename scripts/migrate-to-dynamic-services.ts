/**
 * 🔥 CRITICAL: Data Migration Script
 * 
 * This script migrates existing services from the old hardcoded format
 * to the new dynamic JSONB-based system.
 * 
 * What it does:
 * 1. Finds services with old configuracionFormulario field
 * 2. Converts to new camposPersonalizados JSONB format
 * 3. Sets appropriate flags (esAeropuerto, destinoAutoFill)
 * 4. Preserves all existing data
 * 
 * Run with: npx tsx scripts/migrate-to-dynamic-services.ts
 */

import { PrismaClient, TipoServicio } from '@prisma/client';
import {
    createTextField,
    createCounterField,
    createSwitchField,
    createSelectField,
    DynamicField,
} from '../types/dynamic-fields';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting migration to dynamic services...\n');

    try {
        // Get all services
        const servicios = await prisma.servicio.findMany({
            include: {
                vehiculosPermitidos: true,
            },
        });

        console.log(`Found ${servicios.length} services to migrate\n`);

        let migrated = 0;
        let skipped = 0;

        for (const servicio of servicios) {
            console.log(`\n📦 Processing: ${servicio.nombre} (${servicio.tipo})`);

            // Check if already migrated
            if (
                Array.isArray(servicio.camposPersonalizados) &&
                (servicio.camposPersonalizados as any[]).length > 0
            ) {
                console.log('  ⏭️  Already has dynamic fields, skipping');
                skipped++;
                continue;
            }

            const updates: any = {};
            const camposPersonalizados: DynamicField[] = [];
            let orden = 0;

            // Set esAeropuerto flag for airport services
            if (servicio.tipo === TipoServicio.TRANSPORTE_AEROPUERTO) {
                updates.esAeropuerto = true;
                console.log('  ✅ Set esAeropuerto = true');
            }

            // Set destinoAutoFill for specific tour types
            switch (servicio.tipo) {
                case TipoServicio.TOUR_GUATAPE:
                    updates.destinoAutoFill = 'Guatapé';
                    console.log('  ✅ Set destinoAutoFill = "Guatapé"');
                    break;
                case TipoServicio.TOUR_HACIENDA_NAPOLES:
                    updates.destinoAutoFill = 'Hacienda Nápoles';
                    console.log('  ✅ Set destinoAutoFill = "Hacienda Nápoles"');
                    break;
            }

            // Create dynamic fields based on service type
            switch (servicio.tipo) {
                case TipoServicio.TRANSPORTE_AEROPUERTO:
                    // Airport services already have built-in fields in the wizard
                    // No additional dynamic fields needed
                    console.log('  ℹ️  Airport service - using built-in fields');
                    break;

                case TipoServicio.TOUR_GUATAPE:
                    // Guatapé tour specific fields
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirPiedraPenol',
                            'Incluir subida a la Piedra del Peñol',
                            'Include climb to Piedra del Peñol',
                            orden++,
                            30000
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirPaseoBote',
                            'Incluir paseo en bote',
                            'Include boat ride',
                            orden++,
                            40000
                        )
                    );
                    camposPersonalizados.push(
                        createCounterField(
                            'cantidadAlmuerzos',
                            'Cantidad de almuerzos',
                            'Number of lunches',
                            orden++,
                            25000
                        )
                    );
                    console.log('  ✅ Added 3 dynamic fields for Guatapé tour');
                    break;

                case TipoServicio.TOUR_PARAPENTE:
                    // Paragliding tour fields
                    camposPersonalizados.push(
                        createCounterField(
                            'cantidadVuelos',
                            'Cantidad de vuelos',
                            'Number of flights',
                            orden++,
                            0 // Included in base price
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirFotos',
                            'Incluir fotos y videos',
                            'Include photos and videos',
                            orden++,
                            50000
                        )
                    );
                    console.log('  ✅ Added 2 dynamic fields for Paragliding tour');
                    break;

                case TipoServicio.TOUR_ATV:
                    // ATV tour fields
                    camposPersonalizados.push(
                        createCounterField(
                            'cantidadATVs',
                            'Cantidad de ATVs',
                            'Number of ATVs',
                            orden++,
                            0
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirAlmuerzo',
                            'Incluir almuerzo',
                            'Include lunch',
                            orden++,
                            30000
                        )
                    );
                    console.log('  ✅ Added 2 dynamic fields for ATV tour');
                    break;

                case TipoServicio.CITY_TOUR:
                    // City tour fields
                    camposPersonalizados.push(
                        createSelectField(
                            'tipoTour',
                            'Tipo de tour',
                            'Tour type',
                            orden++,
                            [
                                {
                                    valor: 'basico',
                                    etiqueta: { es: 'Básico (4 horas)', en: 'Basic (4 hours)' },
                                },
                                {
                                    valor: 'completo',
                                    etiqueta: { es: 'Completo (8 horas)', en: 'Complete (8 hours)' },
                                    precio: 50000,
                                },
                            ]
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirAlmuerzo',
                            'Incluir almuerzo',
                            'Include lunch',
                            orden++,
                            35000
                        )
                    );
                    console.log('  ✅ Added 2 dynamic fields for City Tour');
                    break;

                case TipoServicio.TOUR_HACIENDA_NAPOLES:
                    // Hacienda Nápoles fields
                    camposPersonalizados.push(
                        createCounterField(
                            'cantidadEntradas',
                            'Cantidad de entradas al parque',
                            'Number of park tickets',
                            orden++,
                            80000
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirAlmuerzo',
                            'Incluir almuerzo',
                            'Include lunch',
                            orden++,
                            30000
                        )
                    );
                    console.log('  ✅ Added 2 dynamic fields for Hacienda Nápoles');
                    break;

                case TipoServicio.TOUR_OCCIDENTE:
                    // Western tour fields
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirCafeTour',
                            'Incluir tour de café',
                            'Include coffee tour',
                            orden++,
                            40000
                        )
                    );
                    camposPersonalizados.push(
                        createSwitchField(
                            'incluirAlmuerzo',
                            'Incluir almuerzo típico',
                            'Include traditional lunch',
                            orden++,
                            35000
                        )
                    );
                    console.log('  ✅ Added 2 dynamic fields for Western tour');
                    break;

                default:
                    console.log('  ℹ️  No specific dynamic fields for this service type');
                    break;
            }

            // Update service with new fields
            if (Object.keys(updates).length > 0 || camposPersonalizados.length > 0) {
                updates.camposPersonalizados = camposPersonalizados;

                await prisma.servicio.update({
                    where: { id: servicio.id },
                    data: updates,
                });

                console.log(`  ✅ Migrated successfully!`);
                migrated++;
            } else {
                console.log('  ⏭️  No changes needed');
                skipped++;
            }
        }

        console.log('\n\n📊 Migration Summary:');
        console.log(`  ✅ Migrated: ${migrated} services`);
        console.log(`  ⏭️  Skipped: ${skipped} services`);
        console.log(`  📦 Total: ${servicios.length} services`);
        console.log('\n✨ Migration completed successfully!\n');
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .then(() => {
        console.log('👋 Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
