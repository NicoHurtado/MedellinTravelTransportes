// Script para crear usuario admin
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
    try {
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Verificar si ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: 'admin@transportesmedellin.com' }
        });

        if (existingUser) {
            // Actualizar contraseña
            await prisma.user.update({
                where: { email: 'admin@transportesmedellin.com' },
                data: { password: hashedPassword }
            });
            console.log('✅ Contraseña actualizada para admin@transportesmedellin.com');
        } else {
            // Crear nuevo usuario
            await prisma.user.create({
                data: {
                    email: 'admin@transportesmedellin.com',
                    password: hashedPassword,
                    nombre: 'Administrador'
                }
            });
            console.log('✅ Usuario admin creado: admin@transportesmedellin.com');
        }

        console.log('\n📧 Email: admin@transportesmedellin.com');
        console.log('🔑 Contraseña: admin123\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
