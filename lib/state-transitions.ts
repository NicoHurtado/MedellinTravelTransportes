import { EstadoReserva } from '@prisma/client';

// Define valid state transitions
const VALID_TRANSITIONS: Record<EstadoReserva, EstadoReserva[]> = {
    [EstadoReserva.PENDIENTE_COTIZACION]: [
        EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
        EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.CONFIRMADA_PENDIENTE_PAGO]: [
        EstadoReserva.PAGADA_PENDIENTE_ASIGNACION,
        EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.PAGADA_PENDIENTE_ASIGNACION]: [
        EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR,
        EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION]: [
        EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR,
        EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR]: [
        EstadoReserva.COMPLETADA,
        EstadoReserva.CANCELADA,
    ],
    [EstadoReserva.COMPLETADA]: [],
    [EstadoReserva.CANCELADA]: [],
};

export function canTransitionTo(from: EstadoReserva, to: EstadoReserva): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAvailableTransitions(currentState: EstadoReserva): EstadoReserva[] {
    return VALID_TRANSITIONS[currentState] ?? [];
}

export function getStateLabel(state: EstadoReserva): string {
    const labels: Record<EstadoReserva, string> = {
        [EstadoReserva.PENDIENTE_COTIZACION]: 'Pendiente Cotización',
        [EstadoReserva.CONFIRMADA_PENDIENTE_PAGO]: 'Confirmada - Pendiente Pago',
        [EstadoReserva.PAGADA_PENDIENTE_ASIGNACION]: 'Pagada - Pendiente Asignación',
        [EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION]: 'Confirmada - Pendiente Asignación',
        [EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR]: 'Asignada - Pendiente Completar',
        [EstadoReserva.COMPLETADA]: 'Completada',
        [EstadoReserva.CANCELADA]: 'Cancelada',
    };
    return labels[state] ?? state;
}

export function getStateColor(state: EstadoReserva): string {
    const colors: Record<EstadoReserva, string> = {
        [EstadoReserva.PENDIENTE_COTIZACION]: 'bg-yellow-100 text-yellow-800',
        [EstadoReserva.CONFIRMADA_PENDIENTE_PAGO]: 'bg-gray-100 text-gray-800',
        [EstadoReserva.PAGADA_PENDIENTE_ASIGNACION]: 'bg-blue-100 text-blue-800',
        [EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION]: 'bg-purple-100 text-purple-800',
        [EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR]: 'bg-green-100 text-green-800',
        [EstadoReserva.COMPLETADA]: 'bg-green-200 text-green-900',
        [EstadoReserva.CANCELADA]: 'bg-red-100 text-red-800',
    };
    return colors[state] ?? 'bg-gray-100 text-gray-800';
}
