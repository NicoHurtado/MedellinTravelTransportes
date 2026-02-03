'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    FiLoader,
    FiSearch,
    FiFilter,
    FiCalendar,
    FiDollarSign,
    FiCheckCircle,
    FiClock,
    FiTrendingUp,
    FiEye
} from 'react-icons/fi';
import { EstadoReserva } from '@prisma/client';
import { getStateLabel, getStateColor } from '@/lib/state-transitions';
import { getLocalizedText } from '@/types/multi-language';
import TourCompartidoView from '@/components/admin/TourCompartidoView';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [reservas, setReservas] = useState<any[]>([]);
    const [allReservas, setAllReservas] = useState<any[]>([]); // Store all reservations for KPI calculations
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Filters
    const [estadoFilter, setEstadoFilter] = useState<string>('');
    const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const [tourCompartidoFilter, setTourCompartidoFilter] = useState(false); // NEW: Tour Compartido special filter


    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);


    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchData();
        }
    }, [status]);

    useEffect(() => {
        // Filter reservas when estadoFilter or tourCompartidoFilter changes
        if (tourCompartidoFilter) {
            // Show only PAID Tour Compartido reservations (exclude CONFIRMADA_PENDIENTE_PAGO)
            const tourCompartidoReservas = allReservas.filter(r =>
                r.servicio?.tipo === 'TOUR_COMPARTIDO' &&
                r.estado !== 'CONFIRMADA_PENDIENTE_PAGO'
            );
            setReservas(tourCompartidoReservas);
        } else if (estadoFilter) {
            setReservas(allReservas.filter(r => r.estado === estadoFilter));
        } else {
            setReservas(allReservas);
        }
    }, [estadoFilter, tourCompartidoFilter, allReservas]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch stats
            const statsRes = await fetch('/api/admin/stats');
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData.stats || {});
            }

            // Fetch ALL reservations (no filter)
            const res = await fetch('/api/reservas');
            if (res.ok) {
                const data = await res.json();
                const allData = data.data || [];

                // Show ALL reservations to admins (no filtering)
                setAllReservas(allData);
                setReservas(allData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReservas = reservas.filter((reserva) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const servicioNombre = reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES').toLowerCase() : '';
        return (
            reserva.codigo.toLowerCase().includes(query) ||
            reserva.nombreCliente.toLowerCase().includes(query) ||
            servicioNombre.includes(query)
        );
    }).filter((reserva) => {
        // Skip serviceTypeFilter if Tour Compartido KPI button is active
        if (tourCompartidoFilter) return true;
        if (!serviceTypeFilter) return true;
        // For Tour Compartido, also exclude pending payment reservations
        if (serviceTypeFilter === 'TOUR_COMPARTIDO') {
            return reserva.servicio?.tipo === 'TOUR_COMPARTIDO' &&
                reserva.estado !== 'CONFIRMADA_PENDIENTE_PAGO';
        }
        return reserva.servicio?.tipo === serviceTypeFilter;
    }).sort((a, b) => {
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [estadoFilter, searchQuery, serviceTypeFilter, tourCompartidoFilter]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredReservas.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedReservas = filteredReservas.slice(startIndex, endIndex);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (status === 'loading' || loading) {

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <FiLoader className="animate-spin text-4xl text-[#D6A75D]" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // Calculate KPIs by state (always use ALL reservations, not filtered)
    const pendienteCotizacion = allReservas.filter(r => r.estado === 'PENDIENTE_COTIZACION').length;
    const confirmadaPendientePago = allReservas.filter(r => r.estado === 'CONFIRMADA_PENDIENTE_PAGO').length;
    const pagadaPendienteAsignacion = allReservas.filter(r => r.estado === 'PAGADA_PENDIENTE_ASIGNACION').length;
    const confirmadaPendienteAsignacion = allReservas.filter(r => r.estado === 'CONFIRMADA_PENDIENTE_ASIGNACION').length;
    const asignadaPendienteCompletar = allReservas.filter(r => r.estado === 'ASIGNADA_PENDIENTE_COMPLETAR').length;
    const completadas = allReservas.filter(r => r.estado === 'COMPLETADA').length;
    const canceladas = allReservas.filter(r => r.estado === 'CANCELADA').length;

    // 🚌 Tour Compartido: Count only PAID Tour Compartido reservations (exclude CONFIRMADA_PENDIENTE_PAGO)
    const tourCompartidoCount = allReservas.filter(r =>
        r.servicio?.tipo === 'TOUR_COMPARTIDO' &&
        r.estado !== 'CONFIRMADA_PENDIENTE_PAGO'
    ).length;

    const kpis = [
        {
            title: 'Pendiente Cotización',
            value: pendienteCotizacion,
            estado: 'PENDIENTE_COTIZACION',
            icon: FiClock,
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600',
            isTourCompartido: false
        },
        {
            title: 'Confirmada - Pendiente Pago',
            value: confirmadaPendientePago,
            estado: 'CONFIRMADA_PENDIENTE_PAGO',
            icon: FiDollarSign,
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600',
            isTourCompartido: false
        },
        {
            title: 'Hotel - Pendiente Asignación',
            value: confirmadaPendienteAsignacion,
            estado: 'CONFIRMADA_PENDIENTE_ASIGNACION',
            icon: FiCalendar,
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            isTourCompartido: false
        },
        {
            title: 'Pagada - Pendiente Asignación',
            value: pagadaPendienteAsignacion,
            estado: 'PAGADA_PENDIENTE_ASIGNACION',
            icon: FiCalendar,
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            isTourCompartido: false
        },
        {
            title: '🚌 Tour Compartido',
            value: tourCompartidoCount,
            estado: null, // Special filter
            icon: FiCheckCircle,
            bgColor: 'bg-amber-50',
            textColor: 'text-amber-600',
            isTourCompartido: true
        },
        {
            title: 'Asignada - Pendiente Completar',
            value: asignadaPendienteCompletar,
            estado: 'ASIGNADA_PENDIENTE_COMPLETAR',
            icon: FiTrendingUp,
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            isTourCompartido: false
        },
        {
            title: 'Completada',
            value: completadas,
            estado: 'COMPLETADA',
            icon: FiCheckCircle,
            bgColor: 'bg-green-50',
            textColor: 'text-green-700',
            isTourCompartido: false
        },
        {
            title: 'Cancelada',
            value: canceladas,
            estado: 'CANCELADA',
            icon: FiClock,
            bgColor: 'bg-red-50',
            textColor: 'text-red-600',
            isTourCompartido: false
        },
    ];

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'PENDIENTE_COTIZACION', label: 'Pendiente Cotización' },
        { value: 'CONFIRMADA_PENDIENTE_PAGO', label: 'Confirmada - Pendiente Pago' },
        { value: 'CONFIRMADA_PENDIENTE_ASIGNACION', label: 'Hotel - Pendiente Asignación' },
        { value: 'PAGADA_PENDIENTE_ASIGNACION', label: 'Pagada - Pendiente Asignación' },
        { value: 'ASIGNADA_PENDIENTE_COMPLETAR', label: 'Asignada - Pendiente Completar' },
        { value: 'COMPLETADA', label: 'Completada' },
        { value: 'CANCELADA', label: 'Cancelada' },
    ];

    const serviceTypes = [
        { value: '', label: 'Todos los tipos' },
        { value: 'TRANSPORTE_MUNICIPAL', label: 'Transporte Municipal' },
        { value: 'TRANSPORTE_AEROPUERTO', label: 'Aeropuerto' },
        { value: 'CITY_TOUR', label: 'City Tour' },
        { value: 'TOUR_GUATAPE', label: 'Guatapé' },
        { value: 'TOUR_PARAPENTE', label: 'Parapente' },
        { value: 'TOUR_ATV', label: 'ATV' },
        { value: 'TOUR_HACIENDA_NAPOLES', label: 'Hacienda Nápoles' },
        { value: 'TOUR_OCCIDENTE', label: 'Occidente' },
        { value: 'TOUR_COMPARTIDO', label: 'Tour Compartido' },
        { value: 'OTRO', label: 'Otro' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <div className="ml-0 lg:ml-0">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Reservas</h1>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">Gestión de Reservas y Estadísticas</p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                                <p className="text-xs text-gray-500">{session.user?.email}</p>
                            </div>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#D6A75D] flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                {session.user?.name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {kpis.map((kpi, index) => {
                        const Icon = kpi.icon;
                        const isActive = kpi.isTourCompartido ? tourCompartidoFilter : estadoFilter === kpi.estado;
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    if (kpi.isTourCompartido) {
                                        // Toggle Tour Compartido filter
                                        setTourCompartidoFilter(!tourCompartidoFilter);
                                        setEstadoFilter(''); // Clear estado filter
                                        setServiceTypeFilter(''); // Clear service type filter
                                    } else {
                                        // Toggle estado filter
                                        setEstadoFilter(estadoFilter === kpi.estado ? '' : (kpi.estado || ''));
                                        setTourCompartidoFilter(false); // Clear Tour Compartido filter
                                    }
                                }}
                                className={`bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border transition-all text-left w-full ${isActive
                                    ? 'border-[#D6A75D] shadow-lg ring-2 ring-[#D6A75D] ring-opacity-50'
                                    : 'border-gray-100 hover:shadow-md hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                                        <p className="text-2xl sm:text-3xl font-bold text-gray-900">{kpi.value}</p>
                                    </div>
                                    <div className={`${kpi.bgColor} ${kpi.textColor} p-2 sm:p-3 rounded-lg`}>
                                        <Icon size={20} className="sm:w-6 sm:h-6" />
                                    </div>
                                </div>
                                {isActive && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-[#D6A75D] font-medium">Filtro activo - Click para quitar</p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                        <FiFilter className="text-gray-400" size={18} />
                        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Filtros</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por código, cliente o servicio..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Estado Filter */}
                        <select
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        >
                            {estados.map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>

                        {/* Service Type Filter */}
                        <select
                            value={serviceTypeFilter}
                            onChange={(e) => setServiceTypeFilter(e.target.value)}
                            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        >
                            {serviceTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Tour Compartido Grouped View OR Regular Table */}
                {tourCompartidoFilter ? (
                    <TourCompartidoView reservas={filteredReservas} />
                ) : (
                    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                Reservas ({filteredReservas.length})
                            </h2>
                            {filteredReservas.length > 0 && (
                                <p className="text-xs sm:text-sm text-gray-500">
                                    Mostrando {startIndex + 1}-{Math.min(endIndex, filteredReservas.length)} de {filteredReservas.length}
                                </p>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Creada
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Código
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Cliente
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Servicio
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Fecha
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Estado
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Aliado
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Total
                                        </th>
                                        <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedReservas.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-gray-500 text-sm">
                                                No se encontraron reservas
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedReservas.map((reserva) => (
                                            <tr
                                                key={reserva.id}
                                                onClick={() => router.push(`/admin/dashboard/reservas/${reserva.id}`)}
                                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            >
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <p className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                            {new Date(reserva.createdAt).toLocaleDateString('es-CO', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                        <p className="text-xs text-gray-500 whitespace-nowrap">
                                                            {new Date(reserva.createdAt).toLocaleTimeString('es-CO', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <span className="font-mono text-xs sm:text-sm font-semibold text-[#D6A75D] whitespace-nowrap">
                                                        {reserva.codigo}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <p className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{reserva.nombreCliente}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{reserva.emailCliente}</p>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <span className="text-xs sm:text-sm text-gray-900">
                                                        {reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <div>
                                                        <p className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                            {(() => {
                                                                const dateStr = new Date(reserva.fecha).toISOString().split('T')[0];
                                                                const [year, month, day] = dateStr.split('-');
                                                                return `${day}/${month}/${year}`;
                                                            })()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 whitespace-nowrap">{reserva.hora}</p>
                                                    </div>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${getStateColor(reserva.estado)}`}>
                                                        {getStateLabel(reserva.estado)}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    {reserva.esReservaAliado && reserva.aliado ? (
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-medium text-blue-600 whitespace-nowrap">{reserva.aliado.nombre}</p>
                                                            <p className="text-xs text-gray-500">Reserva de aliado</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs sm:text-sm text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                    <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                        ${Number(reserva.precioTotal).toLocaleString('es-CO')}
                                                    </span>
                                                </td>
                                                <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/admin/dashboard/reservas/${reserva.id}`);
                                                        }}
                                                        className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                                                    >
                                                        <FiEye size={14} className="sm:w-4 sm:h-4" />
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {filteredReservas.length > 0 && (
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                                {/* Items per page selector */}
                                <div className="flex items-center gap-2">
                                    <label htmlFor="itemsPerPage" className="text-xs sm:text-sm text-gray-600">
                                        Mostrar:
                                    </label>
                                    <select
                                        id="itemsPerPage"
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">por página</span>
                                </div>

                                {/* Page navigation */}
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Ant
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {getPageNumbers().map((page, index) => (
                                            page === '...' ? (
                                                <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-500">
                                                    ...
                                                </span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page as number)}
                                                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${currentPage === page
                                                        ? 'bg-[#D6A75D] text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Sig
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
