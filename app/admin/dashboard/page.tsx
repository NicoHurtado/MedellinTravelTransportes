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

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [reservas, setReservas] = useState<any[]>([]);
    const [allReservas, setAllReservas] = useState<any[]>([]); // Store all reservations for KPI calculations
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    // Filters
    const [estadoFilter, setEstadoFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

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
        // Filter reservas when estadoFilter changes
        if (estadoFilter) {
            setReservas(allReservas.filter(r => r.estado === estadoFilter));
        } else {
            setReservas(allReservas);
        }
    }, [estadoFilter, allReservas]);

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
    }).sort((a, b) => {
        // Sort by creation date descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [estadoFilter, searchQuery]);

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

    const kpis = [
        {
            title: 'Pendiente Cotización',
            value: pendienteCotizacion,
            estado: 'PENDIENTE_COTIZACION',
            icon: FiClock,
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Confirmada - Pendiente Pago',
            value: confirmadaPendientePago,
            estado: 'CONFIRMADA_PENDIENTE_PAGO',
            icon: FiDollarSign,
            bgColor: 'bg-gray-50',
            textColor: 'text-gray-600'
        },
        {
            title: 'Hotel - Pendiente Asignación',
            value: confirmadaPendienteAsignacion,
            estado: 'CONFIRMADA_PENDIENTE_ASIGNACION',
            icon: FiCalendar,
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Pagada - Pendiente Asignación',
            value: pagadaPendienteAsignacion,
            estado: 'PAGADA_PENDIENTE_ASIGNACION',
            icon: FiCalendar,
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            title: 'Asignada - Pendiente Completar',
            value: asignadaPendienteCompletar,
            estado: 'ASIGNADA_PENDIENTE_COMPLETAR',
            icon: FiTrendingUp,
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            title: 'Completada',
            value: completadas,
            estado: 'COMPLETADA',
            icon: FiCheckCircle,
            bgColor: 'bg-green-50',
            textColor: 'text-green-700'
        },
        {
            title: 'Cancelada',
            value: canceladas,
            estado: 'CANCELADA',
            icon: FiClock,
            bgColor: 'bg-red-50',
            textColor: 'text-red-600'
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
                            <p className="text-sm text-gray-500 mt-1">Gestión de Reservas y Estadísticas</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
                                <p className="text-xs text-gray-500">{session.user?.email}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#D6A75D] flex items-center justify-center text-white font-bold">
                                {session.user?.name?.charAt(0) || 'A'}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-8 py-6 space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kpis.map((kpi, index) => {
                        const Icon = kpi.icon;
                        const isActive = estadoFilter === kpi.estado;
                        return (
                            <button
                                key={index}
                                onClick={() => setEstadoFilter(estadoFilter === kpi.estado ? '' : kpi.estado)}
                                className={`bg-white rounded-xl p-6 shadow-sm border transition-all text-left w-full ${isActive
                                    ? 'border-[#D6A75D] shadow-lg ring-2 ring-[#D6A75D] ring-opacity-50'
                                    : 'border-gray-100 hover:shadow-md hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                                        <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                                    </div>
                                    <div className={`${kpi.bgColor} ${kpi.textColor} p-3 rounded-lg`}>
                                        <Icon size={24} />
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
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                        <FiFilter className="text-gray-400" size={20} />
                        <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por código, cliente o servicio..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                            />
                        </div>

                        {/* Estado Filter */}
                        <select
                            value={estadoFilter}
                            onChange={(e) => setEstadoFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        >
                            {estados.map((estado) => (
                                <option key={estado.value} value={estado.value}>
                                    {estado.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Reservations Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Reservas ({filteredReservas.length})
                        </h2>
                        {filteredReservas.length > 0 && (
                            <p className="text-sm text-gray-500">
                                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredReservas.length)} de {filteredReservas.length} resultados
                            </p>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Creada
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Servicio
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Aliado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedReservas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(reserva.createdAt).toLocaleDateString('es-CO', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(reserva.createdAt).toLocaleTimeString('es-CO', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-semibold text-[#D6A75D]">
                                                    {reserva.codigo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{reserva.nombreCliente}</p>
                                                    <p className="text-sm text-gray-500">{reserva.emailCliente}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-900">
                                                    {reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm text-gray-900">
                                                        {new Date(reserva.fecha).toLocaleDateString('es-CO')}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{reserva.hora}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStateColor(reserva.estado)}`}>
                                                    {getStateLabel(reserva.estado)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {reserva.esReservaAliado && reserva.aliado ? (
                                                    <div>
                                                        <p className="text-sm font-medium text-blue-600">{reserva.aliado.nombre}</p>
                                                        <p className="text-xs text-gray-500">Reserva de aliado</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-gray-900">
                                                    ${Number(reserva.precioTotal).toLocaleString('es-CO')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/admin/dashboard/reservas/${reserva.id}`);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                                                >
                                                    <FiEye size={16} />
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
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            {/* Items per page selector */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="itemsPerPage" className="text-sm text-gray-600">
                                    Mostrar:
                                </label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                                <span className="text-sm text-gray-600">por página</span>
                            </div>

                            {/* Page navigation */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Anterior
                                </button>

                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => setCurrentPage(page as number)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === page
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
                                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
