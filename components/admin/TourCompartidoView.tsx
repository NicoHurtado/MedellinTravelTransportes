'use client';

import { useMemo, useState } from 'react';
import { FiEye, FiCalendar, FiUsers, FiMapPin, FiDownload } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { getLocalizedText } from '@/types/multi-language';
import { getStateLabel, getStateColor } from '@/lib/state-transitions';
import { EstadoReserva } from '@prisma/client';
import { exportarAsistentesTourCompartido } from '@/lib/exportUtils';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<'TODOS' | EstadoReserva>('TODOS');
    const [fechaFilter, setFechaFilter] = useState('');

    const estadosDisponibles = useMemo(
        () => Array.from(new Set(reservas.map((reserva) => reserva.estado))),
        [reservas]
    );

    const reservasFiltradas = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return reservas.filter((reserva) => {
            const matchesEstado = estadoFilter === 'TODOS' || reserva.estado === estadoFilter;
            const fechaReserva = new Date(reserva.fecha).toISOString().split('T')[0];
            const matchesFecha = !fechaFilter || fechaReserva === fechaFilter;
            const matchesSearch =
                !search ||
                reserva.codigo.toLowerCase().includes(search) ||
                reserva.nombreCliente.toLowerCase().includes(search) ||
                reserva.emailCliente.toLowerCase().includes(search) ||
                reserva.whatsappCliente.toLowerCase().includes(search);

            return matchesEstado && matchesFecha && matchesSearch;
        });
    }, [reservas, searchTerm, estadoFilter, fechaFilter]);

    // Agrupar reservas por fecha
    const reservasAgrupadas: ReservasAgrupadas[] = Object.values(
        reservasFiltradas.reduce((acc, reserva) => {
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

    if (reservas.length === 0) {
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

            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                    <div className="flex-1">
                        <label htmlFor="tour-search" className="block text-sm font-medium text-gray-700 mb-1">
                            Buscar
                        </label>
                        <input
                            id="tour-search"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Código, nombre, email o WhatsApp"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        />
                    </div>
                    <div className="w-full lg:w-64">
                        <label htmlFor="estado-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Estado
                        </label>
                        <select
                            id="estado-filter"
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value as 'TODOS' | EstadoReserva)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        >
                            <option value="TODOS">Todos</option>
                            {estadosDisponibles.map((estado) => (
                                <option key={estado} value={estado}>
                                    {getStateLabel(estado)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full lg:w-52">
                        <label htmlFor="fecha-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha
                        </label>
                        <input
                            id="fecha-filter"
                            type="date"
                            value={fechaFilter}
                            onChange={(e) => setFechaFilter(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setEstadoFilter('TODOS');
                            setFechaFilter('');
                        }}
                        className="h-10 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {reservasAgrupadas.length === 0 && (
                <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
                    <FiCalendar className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-700 font-medium">No se encontraron resultados con esos filtros</p>
                    <p className="text-sm text-gray-500 mt-1">Prueba con otro texto, estado o fecha</p>
                </div>
            )}

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
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Recopilar todos los asistentes de las reservas del grupo
                                        const asistentes = grupo.reservas.flatMap(reserva =>
                                            (reserva.asistentes || []).map(asistente => ({
                                                nombre: asistente.nombre,
                                                tipoDocumento: asistente.tipoDocumento,
                                                numeroDocumento: asistente.numeroDocumento,
                                                reservaCodigo: reserva.codigo,
                                                clienteNombre: reserva.nombreCliente
                                            }))
                                        );
                                        exportarAsistentesTourCompartido(asistentes, grupo.fecha, grupo.servicioNombre);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                                    title="Descargar lista de asistentes"
                                >
                                    <FiDownload size={16} />
                                    <span className="hidden sm:inline">Excel</span>
                                </button>
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
