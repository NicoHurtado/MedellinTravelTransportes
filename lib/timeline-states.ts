import { EstadoReserva } from '@prisma/client';
import { FiCheck, FiClock, FiX, FiTruck, FiCheckCircle } from 'react-icons/fi';

export interface TimelineState {
    label: string;
    icon: any;
    color: string;
    bgColor: string;
    description: string;
}

export const TIMELINE_STATES: Record<EstadoReserva, TimelineState> = {
    [EstadoReserva.PENDIENTE_COTIZACION]: {
        label: 'Pendiente Cotización',
        icon: FiClock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        description: 'Estamos preparando tu cotización personalizada'
    },
    [EstadoReserva.CONFIRMADA_PENDIENTE_PAGO]: {
        label: 'Confirmada',
        icon: FiCheck,
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        description: 'Reserva confirmada. Pendiente de pago'
    },
    [EstadoReserva.PAGADA_PENDIENTE_ASIGNACION]: {
        label: 'Pagada',
        icon: FiCheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Pago recibido. Asignando conductor'
    },
    [EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION]: {
        label: 'Confirmada',
        icon: FiCheck,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Reserva confirmada. El pago se realizará en efectivo al recibir el servicio.'
    },
    [EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR]: {
        label: 'Asignada',
        icon: FiTruck,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Conductor asignado. Listo para tu viaje'
    },
    [EstadoReserva.COMPLETADA]: {
        label: 'Completada',
        icon: FiCheckCircle,
        color: 'text-green-700',
        bgColor: 'bg-green-200',
        description: 'Servicio completado exitosamente'
    },
    [EstadoReserva.CANCELADA]: {
        label: 'Cancelada',
        icon: FiX,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        description: 'Reserva cancelada'
    },
};

export function getStateOrder(estado: EstadoReserva): number {
    const order = {
        [EstadoReserva.PENDIENTE_COTIZACION]: 0,
        [EstadoReserva.CONFIRMADA_PENDIENTE_PAGO]: 1,
        [EstadoReserva.PAGADA_PENDIENTE_ASIGNACION]: 2,
        [EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION]: 1, // Same level as CONFIRMADA_PENDIENTE_PAGO
        [EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR]: 3,
        [EstadoReserva.COMPLETADA]: 4,
        [EstadoReserva.CANCELADA]: -1, // Special case
    };
    return order[estado] ?? 0;
}

export function canCancelReservation(fecha: Date, estado: EstadoReserva): boolean {
    if (estado === EstadoReserva.COMPLETADA || estado === EstadoReserva.CANCELADA) {
        return false;
    }

    const now = new Date();
    const reservationDate = new Date(fecha);
    const hoursUntilReservation = (reservationDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursUntilReservation > 24;
}
