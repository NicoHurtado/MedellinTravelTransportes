import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: tsx scripts/create-admin.ts <email> <password>');
        process.exit(1);
    }

    const [email, password] = args;

    if (!email || !password) {
        console.error('Email and password are required.');
        process.exit(1);
    }

    console.log(`Creating/Updating admin user: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password: hashedPassword,
            },
            create: {
                email,
                password: hashedPassword,
            },
        });

        console.log(`✅ Admin user ${user.email} created/updated successfully.`);
        console.log(`ID: ${user.id}`);
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
