import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoReserva } from '@prisma/client';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { codigoReserva, metodoPago } = body;

        // Validate input
        if (!codigoReserva || !metodoPago) {
            return NextResponse.json(
                { success: false, error: 'Código de reserva y método de pago son requeridos' },
                { status: 400 }
            );
        }

        if (metodoPago !== 'EFECTIVO' && metodoPago !== 'BOLD') {
            return NextResponse.json(
                { success: false, error: 'Método de pago inválido' },
                { status: 400 }
            );
        }

        // Find the reservation
        const reserva = await prisma.reserva.findUnique({
            where: { codigo: codigoReserva },
            include: {
                servicio: true,
                aliado: true,
            },
        });

        if (!reserva) {
            return NextResponse.json(
                { success: false, error: 'Reserva no encontrada' },
                { status: 404 }
            );
        }

        // Verify it's a Tour Compartido service
        if (reserva.servicio?.tipo !== 'TOUR_COMPARTIDO') {
            return NextResponse.json(
                { success: false, error: 'Esta función solo está disponible para Tour Compartido' },
                { status: 400 }
            );
        }

        // Verify it's a hotel/agency ally reservation
        if (!reserva.esReservaAliado || (reserva.aliado?.tipo !== 'HOTEL' && reserva.aliado?.tipo !== 'AGENCIA')) {
            return NextResponse.json(
                { success: false, error: 'Esta función solo está disponible para aliados hoteleros' },
                { status: 400 }
            );
        }

        // Verify current status is CONFIRMADA_PENDIENTE_PAGO
        if (reserva.estado !== EstadoReserva.CONFIRMADA_PENDIENTE_PAGO) {
            return NextResponse.json(
                { success: false, error: 'La reserva no está en estado pendiente de pago' },
                { status: 400 }
            );
        }

        // Determine new status based on payment method
        let newStatus: EstadoReserva = reserva.estado;
        if (metodoPago === 'EFECTIVO') {
            newStatus = EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION;
        }
        // If BOLD, status remains CONFIRMADA_PENDIENTE_PAGO

        // 🔥 RECALCULATE PRICE when switching to EFECTIVO
        // Remove Bold commission (6%) from the total
        let newPrecioTotal = Number(reserva.precioTotal);
        let newComisionBold = Number(reserva.comisionBold || 0);

        if (metodoPago === 'EFECTIVO') {
            // Remove Bold commission from total
            // precioTotal was: subtotal + comisionBold
            // We need: subtotal only
            const subtotal = Number(reserva.precioTotal) - Number(reserva.comisionBold || 0);
            newPrecioTotal = subtotal;
            newComisionBold = 0;
        } else if (metodoPago === 'BOLD') {
            // If switching back to BOLD, recalculate commission
            // (in case they selected EFECTIVO first, then changed to BOLD)
            const subtotal = Number(reserva.precioBase) +
                Number(reserva.precioAdicionales || 0) +
                Number(reserva.recargoNocturno || 0) +
                Number(reserva.tarifaMunicipio || 0) -
                Number(reserva.descuentoAliado || 0);
            newComisionBold = subtotal * 0.06;
            newPrecioTotal = subtotal + newComisionBold;
        }

        // Update the reservation
        const updatedReserva = await prisma.reserva.update({
            where: { codigo: codigoReserva },
            data: {
                metodoPago,
                estado: newStatus,
                precioTotal: newPrecioTotal,
                comisionBold: newComisionBold,
            },
            include: {
                servicio: true,
                aliado: true,
                vehiculo: true,
                conductor: true,
            },
        });

        return NextResponse.json({
            success: true,
            reserva: updatedReserva,
        });
    } catch (error) {
        console.error('Error al seleccionar método de pago:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
