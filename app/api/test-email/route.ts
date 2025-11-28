import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailConfig } from '@/lib/email';
import { sendReservaConfirmadaEmail } from '@/lib/email-service';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        // Verificar configuración de email
        const isConfigured = await verifyEmailConfig();

        if (!isConfigured) {
            return NextResponse.json(
                { error: 'Email configuration error' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            status: 'Email service configured',
            user: process.env.GMAIL_USER,
        });
    } catch (error) {
        console.error('Email test error:', error);
        return NextResponse.json(
            { error: 'Email test failed', details: String(error) },
            { status: 500 }
        );
    }
}

// Endpoint de prueba para enviar email
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { reservaId, type, language } = body;

        if (!reservaId || !type) {
            return NextResponse.json(
                { error: 'Missing reservaId or type' },
                { status: 400 }
            );
        }

        // Buscar reserva con relaciones
        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
            },
        });

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva not found' },
                { status: 404 }
            );
        }

        // Enviar email según tipo
        const lang = (language || reserva.idioma) as 'ES' | 'EN';

        switch (type) {
            case 'confirmada':
                await sendReservaConfirmadaEmail(reserva, lang);
                break;
            default:
                return NextResponse.json(
                    { error: 'Invalid email type' },
                    { status: 400 }
                );
        }

        return NextResponse.json({
            success: true,
            message: `Email ${type} sent to ${reserva.emailCliente}`,
        });
    } catch (error) {
        console.error('Email send error:', error);
        return NextResponse.json(
            { error: 'Failed to send email', details: String(error) },
            { status: 500 }
        );
    }
}
