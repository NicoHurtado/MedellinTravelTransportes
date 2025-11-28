import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { secret } = await request.json();

        // Simple security check
        if (secret !== 'create-admin-2024') {
            return NextResponse.json(
                { error: 'Secret incorrecto' },
                { status: 403 }
            );
        }

        const email = 'admin@transportesmedellin.com';
        const password = 'Admin123!';

        console.log('Checking for existing admin...');

        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log('Admin already exists');
            return NextResponse.json(
                {
                    message: 'El usuario admin ya existe',
                    credentials: {
                        email,
                        password: 'Admin123!',
                        note: 'Usa estas credenciales para hacer login'
                    }
                },
                { status: 200 }
            );
        }

        console.log('Creating new admin user...');

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });

        console.log('Admin user created successfully');

        return NextResponse.json({
            message: '✅ Usuario administrador creado exitosamente',
            credentials: {
                email,
                password,
            },
            instructions: {
                url: 'http://localhost:3000/admin/login',
                steps: [
                    '1. Ve a http://localhost:3000/admin/login',
                    `2. Ingresa email: ${email}`,
                    `3. Ingresa password: ${password}`,
                    '4. Haz click en "Iniciar Sesión"'
                ]
            },
            warning: '⚠️  IMPORTANTE: Cambia la contraseña después del primer login',
        });
    } catch (error: any) {
        console.error('Error creating admin:', error);
        return NextResponse.json(
            {
                error: 'Error al crear administrador',
                details: error.message
            },
            { status: 500 }
        );
    }
}
