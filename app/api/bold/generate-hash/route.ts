import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBoldHash } from '@/lib/bold';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { reservaId } = await req.json();

        if (!reservaId) {
            return NextResponse.json(
                { error: 'reservaId is required' },
                { status: 400 }
            );
        }

        // Buscar reserva
        const reserva = await prisma.reserva.findUnique({
            where: { id: reservaId },
        });

        if (!reserva) {
            return NextResponse.json(
                { error: 'Reserva not found' },
                { status: 404 }
            );
        }

        // Verificar que la reserva necesita pago
        if (reserva.estado !== 'CONFIRMADA_PENDIENTE_PAGO' && reserva.estado !== 'PENDIENTE_COTIZACION') {
            return NextResponse.json(
                { error: 'Reserva no requiere pago o ya fue pagada' },
                { status: 400 }
            );
        }

        // Generar hash de Bold
        const amount = Math.round(Number(reserva.precioTotal)); // Bold usa enteros
        const hash = generateBoldHash(reserva.codigo, amount, 'COP');

        console.log('🔵 [BOLD HASH] Generated hash for payment:');
        console.log('  - Order ID:', reserva.codigo);
        console.log('  - Amount:', amount);
        console.log('  - Currency: COP');
        console.log('  - Hash:', hash);

        // Guardar hash en la base de datos
        await prisma.reserva.update({
            where: { id: reservaId },
            data: { hashPago: hash },
        });

        console.log('✅ [BOLD HASH] Hash saved to database');

        return NextResponse.json({
            success: true,
            hash,
            orderId: reserva.codigo,
            amount,
            currency: 'COP',
        });
    } catch (error) {
        console.error('Generate hash error:', error);
        return NextResponse.json(
            { error: 'Failed to generate payment hash', details: String(error) },
            { status: 500 }
        );
    }
}
