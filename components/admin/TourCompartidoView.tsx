'use client';

import { FiEye, FiCalendar, FiUsers, FiMapPin } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getLocalizedText } from '@/types/multi-language';
import { getStateLabel, getStateColor } from '@/lib/state-transitions';
import { EstadoReserva } from '@prisma/client';

interface Reserva {
    id: string;
    codigo: string;
    nombreCliente: string;
    emailCliente: string;
    whatsappCliente: string;
    fecha: string;
    hora: string;
    numeroPasajeros: number;
    estado: EstadoReserva;
    precioTotal: number;
    createdAt: string;
    servicio?: {
        nombre: any;
        tipo: string;
    };
    asistentes?: Array<{
        id: string;
        nombre: string;
        tipoDocumento: string;
        numeroDocumento: string;
    }>;
}

interface TourCompartidoViewProps {
    reservas: Reserva[];
}

interface ReservasAgrupadas {
    fecha: string;
    fechaFormateada: string;
    servicioNombre: string;
    reservas: Reserva[];
    cupoTotal: number;
}

export default function TourCompartidoView({ reservas }: TourCompartidoViewProps) {
    const router = useRouter();

    // Agrupar reservas por fecha
    const reservasAgrupadas: ReservasAgrupadas[] = Object.values(
        reservas.reduce((acc, reserva) => {
            const fechaKey = new Date(reserva.fecha).toISOString().split('T')[0];

            if (!acc[fechaKey]) {
                acc[fechaKey] = {
                    fecha: fechaKey,
                    fechaFormateada: new Date(reserva.fecha).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    }),
                    servicioNombre: reserva.servicio?.nombre
                        ? getLocalizedText(reserva.servicio.nombre, 'ES')
                        : 'Tour Compartido',
                    reservas: [],
                    cupoTotal: 0
                };
            }

            acc[fechaKey].reservas.push(reserva);
            acc[fechaKey].cupoTotal += reserva.numeroPasajeros;

            return acc;
        }, {} as Record<string, ReservasAgrupadas>)
    ).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    if (reservasAgrupadas.length === 0) {
        return (
            <div className="bg-white rounded-xl p-8 text-center">
                <FiCalendar className="mx-auto text-4xl text-gray-300 mb-4" />
                <p className="text-gray-500">No hay reservas de Tour Compartido</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="text-[#D6A75D]" size={20} />
                <h2 className="text-lg font-semibold text-gray-900">
                    Vista Agrupada por Fecha - Tour Compartido
                </h2>
            </div>

            {reservasAgrupadas.map((grupo) => (
                <div
                    key={grupo.fecha}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                    {/* Header del grupo */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <FiCalendar className="text-amber-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                        📅 {grupo.fechaFormateada}
                                    </h3>
                                    <p className="text-sm text-amber-700">{grupo.servicioNombre}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-amber-200">
                                    <FiUsers className="text-amber-600" size={18} />
                                    <div>
                                        <span className="text-2xl font-bold text-amber-600">{grupo.cupoTotal}</span>
                                        <span className="text-sm text-gray-600 ml-1">
                                            {grupo.cupoTotal === 1 ? 'persona' : 'personas'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    ({grupo.reservas.length} {grupo.reservas.length === 1 ? 'reserva' : 'reservas'})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lista de reservas */}
                    <div className="divide-y divide-gray-100">
                        {grupo.reservas.map((reserva) => (
                            <div
                                key={reserva.id}
                                onClick={() => router.push(`/admin/dashboard/reservas/${reserva.id}`)}
                                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <span className="text-lg">🎫</span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-[#D6A75D]">
                                                    {reserva.codigo}
                                                </span>
                                                <span className="text-gray-400">•</span>
                                                <span className="font-medium text-gray-900">
                                                    {reserva.nombreCliente}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <FiUsers size={14} />
                                                    {reserva.numeroPasajeros} {reserva.numeroPasajeros === 1 ? 'pasajero' : 'pasajeros'}
                                                </span>
                                                <span>
                                                    Hora: {reserva.hora}
                                                </span>
                                                <span>
                                                    Creada: {new Date(reserva.createdAt).toLocaleDateString('es-CO')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStateColor(reserva.estado as EstadoReserva)}`}>
                                            {getStateLabel(reserva.estado as EstadoReserva)}
                                        </span>
                                        <span className="font-semibold text-gray-900">
                                            ${Number(reserva.precioTotal).toLocaleString('es-CO')}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/admin/dashboard/reservas/${reserva.id}`);
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
                                        >
                                            <FiEye size={14} />
                                            Ver
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
