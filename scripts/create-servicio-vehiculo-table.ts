import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMissingTable() {
    try {
        console.log('Creating ServicioVehiculo table...');

        // Create the table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "ServicioVehiculo" (
                "id" TEXT NOT NULL,
                "servicioId" TEXT NOT NULL,
                "vehiculoId" TEXT NOT NULL,
                "precio" DECIMAL(10,2) NOT NULL,
                CONSTRAINT "ServicioVehiculo_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('✅ Table created');

        // Create unique index
        await prisma.$executeRawUnsafe(`
            CREATE UNIQUE INDEX IF NOT EXISTS "ServicioVehiculo_servicioId_vehiculoId_key" 
            ON "ServicioVehiculo"("servicioId", "vehiculoId");
        `);

        console.log('✅ Unique index created');

        // Add foreign keys (with error handling in case they already exist)
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "ServicioVehiculo" 
                ADD CONSTRAINT "ServicioVehiculo_servicioId_fkey" 
                FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
            `);
            console.log('✅ Foreign key to Servicio added');
        } catch (e: any) {
            if (e.code === '42710') {
                console.log('ℹ️  Foreign key to Servicio already exists');
            } else {
                throw e;
            }
        }

        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "ServicioVehiculo" 
                ADD CONSTRAINT "ServicioVehiculo_vehiculoId_fkey" 
                FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
            `);
            console.log('✅ Foreign key to Vehiculo added');
        } catch (e: any) {
            if (e.code === '42710') {
                console.log('ℹ️  Foreign key to Vehiculo already exists');
            } else {
                throw e;
            }
        }

        console.log('\n✅ ServicioVehiculo table created successfully!');
        console.log('You can now restart your dev server.');

    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

createMissingTable();
