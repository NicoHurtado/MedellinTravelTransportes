import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

// Override the APP URL to the real production URL
process.env.NEXT_PUBLIC_APP_URL = 'https://tmedellintravel.com';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Import email functions
import { sendReservaConfirmadaEmail, sendTourCompartidoConfirmationEmail } from '../lib/email-service';

async function resendEmails() {
    const codigos = ['M9K47TFQ', 'V2JLN3DX'];

    for (const codigo of codigos) {
        try {
            const reserva = await prisma.reserva.findUnique({
                where: { codigo },
                include: {
                    servicio: true,
                    conductor: true,
                    vehiculo: true,
                    aliado: true,
                    asistentes: true,
                },
            });

            if (!reserva) {
                console.log(`❌ Reserva ${codigo}: NO ENCONTRADA`);
                continue;
            }

            console.log(`\n📧 Reenviando email para ${codigo}...`);
            console.log(`   Cliente: ${reserva.nombreCliente} (${reserva.emailCliente})`);
            console.log(`   Servicio: ${reserva.servicio?.tipo}`);
            console.log(`   Aliado: ${reserva.aliado?.nombre || 'N/A'}`);

            if (reserva.servicio?.tipo === 'TOUR_COMPARTIDO') {
                await sendTourCompartidoConfirmationEmail(reserva as any, reserva.idioma || 'ES');
                console.log(`✅ Email Tour Compartido enviado a ${reserva.emailCliente}`);
            } else {
                const aliadoEmail = reserva.aliado?.email || null;
                await sendReservaConfirmadaEmail(reserva as any, reserva.idioma || 'ES', aliadoEmail);
                console.log(`✅ Email Reserva Confirmada enviado a ${reserva.emailCliente}${aliadoEmail ? ` + ${aliadoEmail}` : ''}`);
            }

        } catch (error) {
            console.error(`❌ Error con reserva ${codigo}:`, error);
        }
    }

    await prisma.$disconnect();
    console.log('\n✅ Proceso completado');
}

resendEmails();
