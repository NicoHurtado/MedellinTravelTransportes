import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateBoldHash } from '@/lib/bold';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { reservaId, pedidoId } = await req.json();

        // Debe proporcionar reservaId O pedidoId
        if (!reservaId && !pedidoId) {
            return NextResponse.json(
                { error: 'reservaId or pedidoId is required' },
                { status: 400 }
            );
        }

        let orderId: string;
        let baseAmount: number;
        let comisionBold: number;
        let finalAmount: number;
        let entityType: 'reserva' | 'pedido';

        // Caso 1: Pedido (múltiples servicios)
        if (pedidoId) {
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
            });

            if (!pedido) {
                return NextResponse.json(
                    { error: 'Pedido not found' },
                    { status: 404 }
                );
            }

            // Verificar que el pedido necesita pago
            if (pedido.estadoPago !== 'PENDIENTE') {
                return NextResponse.json(
                    { error: 'Pedido no requiere pago o ya fue pagado' },
                    { status: 400 }
                );
            }

            orderId = pedido.codigo;
            // El pedido ya tiene el precio total con comisión incluida
            finalAmount = Math.round(Number(pedido.precioTotal));
            entityType = 'pedido';

            console.log('🔵 [BOLD HASH] Processing PEDIDO payment:');
            console.log('  - Pedido ID:', pedido.id);
            console.log('  - Pedido Code:', pedido.codigo);
            console.log('  - Subtotal:', Number(pedido.subtotal));
            console.log('  - Comisión Bold (6%):', Number(pedido.comisionBold));
            console.log('  - Total Final:', finalAmount);
        }
        // Caso 2: Reserva individual
        else {
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

            orderId = reserva.codigo;
            baseAmount = Number(reserva.precioTotal);

            // Calcular comisión Bold del 6%
            comisionBold = Math.round(baseAmount * 0.06);
            finalAmount = Math.round(baseAmount + comisionBold);
            entityType = 'reserva';

            console.log('🔵 [BOLD HASH] Processing RESERVA payment:');
            console.log('  - Reserva ID:', reserva.id);
            console.log('  - Reserva Code:', reserva.codigo);
            console.log('  - Precio Base:', baseAmount);
            console.log('  - Comisión Bold (6%):', comisionBold);
            console.log('  - Total Final:', finalAmount);

            // Actualizar la reserva con la comisión Bold
            await prisma.reserva.update({
                where: { id: reservaId },
                data: {
                    comisionBold: comisionBold,
                },
            });
        }

        // Generar hash de Bold
        const hash = generateBoldHash(orderId, finalAmount, 'COP');

        console.log('🔵 [BOLD HASH] Generated hash for payment:');
        console.log('  - Order ID:', orderId);
        console.log('  - Amount:', finalAmount);
        console.log('  - Currency: COP');
        console.log('  - Hash:', hash);

        // Guardar hash en la base de datos
        if (entityType === 'pedido') {
            await prisma.pedido.update({
                where: { id: pedidoId },
                data: { hashPago: hash },
            });
        } else {
            await prisma.reserva.update({
                where: { id: reservaId },
                data: { hashPago: hash },
            });
        }

        console.log('✅ [BOLD HASH] Hash saved to database');

        return NextResponse.json({
            success: true,
            hash,
            orderId,
            amount: finalAmount,
            currency: 'COP',
            entityType,
        });
    } catch (error) {
        console.error('Generate hash error:', error);
        return NextResponse.json(
            { error: 'Failed to generate payment hash', details: String(error) },
            { status: 500 }
        );
    }
}
