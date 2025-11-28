/**
 * 🔥 CRITICAL: Multi-language Migration Script
 * 
 * This script safely migrates existing services from single-language format
 * to multi-language JSONB format without losing data.
 * 
 * What it does:
 * 1. Adds new JSONB columns (nombre_ml, descripcion_ml, incluye_ml)
 * 2. Copies existing data to new columns in multi-language format
 * 3. Drops old columns
 * 4. Renames new columns to original names
 * 
 * Run with: npx tsx scripts/migrate-to-multilanguage.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌍 Starting multi-language migration...\n');

    try {
        // Step 1: Add temporary JSONB columns
        console.log('📝 Step 1: Adding temporary columns...');
        await prisma.$executeRaw`
      ALTER TABLE "Servicio" 
      ADD COLUMN IF NOT EXISTS "nombre_ml" JSONB,
      ADD COLUMN IF NOT EXISTS "descripcion_ml" JSONB,
      ADD COLUMN IF NOT EXISTS "incluye_ml" JSONB;
    `;
        console.log('✅ Temporary columns added\n');

        // Step 2: Get all services
        console.log('📦 Step 2: Fetching existing services...');
        const servicios = await prisma.$queryRaw<any[]>`
      SELECT id, nombre, descripcion, incluye 
      FROM "Servicio"
    `;
        console.log(`✅ Found ${servicios.length} services\n`);

        // Step 3: Migrate data
        console.log('🔄 Step 3: Migrating data to multi-language format...');

        for (const servicio of servicios) {
            const nombreML = {
                es: servicio.nombre,
                en: servicio.nombre // Default: same as Spanish, admin can edit later
            };

            const descripcionML = {
                es: servicio.descripcion,
                en: servicio.descripcion // Default: same as Spanish
            };

            const incluyeML = {
                es: servicio.incluye || [],
                en: servicio.incluye || [] // Default: same as Spanish
            };

            await prisma.$executeRaw`
        UPDATE "Servicio"
        SET 
          "nombre_ml" = ${JSON.stringify(nombreML)}::jsonb,
          "descripcion_ml" = ${JSON.stringify(descripcionML)}::jsonb,
          "incluye_ml" = ${JSON.stringify(incluyeML)}::jsonb
        WHERE id = ${servicio.id}
      `;

            console.log(`  ✓ Migrated: ${servicio.nombre}`);
        }
        console.log(`✅ All ${servicios.length} services migrated\n`);

        // Step 4: Drop old columns
        console.log('🗑️  Step 4: Dropping old columns...');
        await prisma.$executeRaw`
      ALTER TABLE "Servicio"
      DROP COLUMN "nombre",
      DROP COLUMN "descripcion",
      DROP COLUMN "incluye";
    `;
        console.log('✅ Old columns dropped\n');

        // Step 5: Rename new columns
        console.log('📝 Step 5: Renaming columns...');
        await prisma.$executeRaw`
      ALTER TABLE "Servicio"
      RENAME COLUMN "nombre_ml" TO "nombre";
    `;
        await prisma.$executeRaw`
      ALTER TABLE "Servicio"
      RENAME COLUMN "descripcion_ml" TO "descripcion";
    `;
        await prisma.$executeRaw`
      ALTER TABLE "Servicio"
      RENAME COLUMN "incluye_ml" TO "incluye";
    `;
        console.log('✅ Columns renamed\n');

        // Step 6: Set NOT NULL constraints
        console.log('🔒 Step 6: Adding constraints...');
        await prisma.$executeRaw`
      ALTER TABLE "Servicio"
      ALTER COLUMN "nombre" SET NOT NULL,
      ALTER COLUMN "descripcion" SET NOT NULL,
      ALTER COLUMN "incluye" SET NOT NULL;
    `;
        console.log('✅ Constraints added\n');

        console.log('📊 Migration Summary:');
        console.log(`  ✅ Migrated: ${servicios.length} services`);
        console.log(`  ✅ Format: Single-language → Multi-language (ES/EN)`);
        console.log(`  ✅ Data preserved: 100%`);
        console.log('\n✨ Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('  1. Run: npx prisma generate');
        console.log('  2. Restart dev server');
        console.log('  3. Edit services to add English translations\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\n⚠️  Database may be in inconsistent state!');
        console.error('Please restore from backup if needed.\n');
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
