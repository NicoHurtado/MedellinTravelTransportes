'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    FiLoader,
    FiChevronDown,
    FiChevronUp,
    FiMapPin,
    FiPlus,
    FiClock,
    FiSearch,
    FiFilter,
    FiEye,
    FiCopy,
    FiCheck,
    FiExternalLink
} from 'react-icons/fi';
import QuoteWizard from '@/components/admin/QuoteWizard';
import { getLocalizedText } from '@/types/multi-language';
import { getStateLabel, getStateColor } from '@/lib/state-transitions';

export default function CotizacionesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Tab state
    const [activeTab, setActiveTab] = useState<'crear' | 'historial'>('crear');

    // Create tab state
    const [services, setServices] = useState<any[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [municipalExpanded, setMunicipalExpanded] = useState(false);

    // History tab state
    const [cotizaciones, setCotizaciones] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [estadoFilter, setEstadoFilter] = useState('');
    const [metodoPagoFilter, setMetodoPagoFilter] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchServices();
        }
    }, [status]);

    useEffect(() => {
        if (status === 'authenticated' && activeTab === 'historial') {
            fetchCotizaciones();
        }
    }, [status, activeTab]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, estadoFilter, metodoPagoFilter]);

    const fetchServices = async () => {
        setLoadingServices(true);
        try {
            const res = await fetch('/api/servicios');
            if (res.ok) {
                const data = await res.json();
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
        } finally {
            setLoadingServices(false);
        }
    };

    const fetchCotizaciones = async () => {
        setLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/cotizaciones');
            if (res.ok) {
                const data = await res.json();
                setCotizaciones(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching cotizaciones:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSelectService = (service: any) => {
        setSelectedService(service);
        setWizardOpen(true);
    };

    const handleWizardClose = () => {
        setWizardOpen(false);
        setSelectedService(null);
        // Refresh history if on that tab
        if (activeTab === 'historial') {
            fetchCotizaciones();
        }
    };

    const copyTrackingLink = (codigo: string) => {
        const link = `${window.location.origin}/tracking/${codigo}`;
        navigator.clipboard.writeText(link);
        setCopiedCode(codigo);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Filter cotizaciones
    const filteredCotizaciones = cotizaciones.filter((cot) => {
        // Text search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesCode = cot.codigo.toLowerCase().includes(q);
            const matchesName = cot.nombreCliente.toLowerCase().includes(q);
            const matchesEmail = cot.emailCliente?.toLowerCase().includes(q);
            const matchesService = cot.servicio?.nombre ? getLocalizedText(cot.servicio.nombre, 'ES').toLowerCase().includes(q) : false;
            if (!matchesCode && !matchesName && !matchesEmail && !matchesService) return false;
        }
        // Estado filter
        if (estadoFilter && cot.estado !== estadoFilter) return false;
        // Metodo pago filter
        if (metodoPagoFilter && cot.metodoPago !== metodoPagoFilter) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredCotizaciones.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCotizaciones = filteredCotizaciones.slice(startIndex, startIndex + itemsPerPage);

    if (status === 'loading' || loadingServices) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <FiLoader className="animate-spin text-4xl text-[#D6A75D]" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    // Separar servicios municipales de otros servicios
    const municipalServices = services.filter(s => s.tipo === 'TRANSPORTE_MUNICIPAL');
    const otherServices = services.filter(s => s.tipo !== 'TRANSPORTE_MUNICIPAL');

    const estados = [
        { value: '', label: 'Todos los estados' },
        { value: 'CONFIRMADA_PENDIENTE_PAGO', label: 'Pendiente Pago' },
        { value: 'CONFIRMADA_PENDIENTE_ASIGNACION', label: 'Pendiente Asignación' },
        { value: 'PAGADA_PENDIENTE_ASIGNACION', label: 'Pagada' },
        { value: 'ASIGNADA_PENDIENTE_COMPLETAR', label: 'Asignada' },
        { value: 'COMPLETADA', label: 'Completada' },
        { value: 'CANCELADA', label: 'Cancelada' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Cotizaciones</h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Crea y gestiona cotizaciones con precios personalizados
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('crear')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                                activeTab === 'crear'
                                    ? 'border-[#D6A75D] text-[#D6A75D]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FiPlus size={16} />
                            Crear Cotización
                        </button>
                        <button
                            onClick={() => setActiveTab('historial')}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 ${
                                activeTab === 'historial'
                                    ? 'border-[#D6A75D] text-[#D6A75D]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <FiClock size={16} />
                            Historial
                            {cotizaciones.length > 0 && (
                                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                                    {cotizaciones.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
                {/* ========== TAB: CREAR ========== */}
                {activeTab === 'crear' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Selecciona un Servicio
                        </h2>

                        <div className="space-y-4">
                            {/* Otros Servicios (Tours, Aeropuerto, etc.) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {otherServices.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => handleSelectService(service)}
                                        className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-[#D6A75D] hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-[#D6A75D] transition-all">
                                                {service.imagen && (
                                                    <img
                                                        src={service.imagen}
                                                        alt={getLocalizedText(service.nombre, 'ES')}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-[#D6A75D] transition-colors truncate">
                                                    {getLocalizedText(service.nombre, 'ES')}
                                                </h3>
                                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                                    {getLocalizedText(service.descripcion, 'ES')}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Servicios Municipales Agrupados */}
                            {municipalServices.length > 0 && (
                                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                    {/* Header del grupo */}
                                    <button
                                        onClick={() => setMunicipalExpanded(!municipalExpanded)}
                                        className="w-full p-4 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center group-hover:ring-2 group-hover:ring-blue-400 transition-all">
                                                <FiMapPin className="text-blue-700 text-2xl" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    Transporte Municipal
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {municipalServices.length} municipios disponibles
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-gray-600 group-hover:text-blue-700 transition-colors">
                                            {municipalExpanded ? (
                                                <FiChevronUp size={24} />
                                            ) : (
                                                <FiChevronDown size={24} />
                                            )}
                                        </div>
                                    </button>

                                    {/* Lista de municipios (expandible) */}
                                    {municipalExpanded && (
                                        <div className="p-4 bg-gray-50 border-t-2 border-gray-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {municipalServices.map((service) => (
                                                    <button
                                                        key={service.id}
                                                        onClick={() => handleSelectService(service)}
                                                        className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                                                                {service.imagen && (
                                                                    <img
                                                                        src={service.imagen}
                                                                        alt={getLocalizedText(service.nombre, 'ES')}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm truncate">
                                                                    {getLocalizedText(service.nombre, 'ES')}
                                                                </h4>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========== TAB: HISTORIAL ========== */}
                {activeTab === 'historial' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
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
                                        placeholder="Buscar por código, cliente, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                    />
                                </div>

                                {/* Estado Filter */}
                                <select
                                    value={estadoFilter}
                                    onChange={(e) => setEstadoFilter(e.target.value)}
                                    className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                >
                                    {estados.map((estado) => (
                                        <option key={estado.value} value={estado.value}>
                                            {estado.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Método de Pago Filter */}
                                <select
                                    value={metodoPagoFilter}
                                    onChange={(e) => setMetodoPagoFilter(e.target.value)}
                                    className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                >
                                    <option value="">Todos los métodos</option>
                                    <option value="BOLD">Bold (en línea)</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                    Cotizaciones ({filteredCotizaciones.length})
                                </h2>
                                {filteredCotizaciones.length > 0 && (
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCotizaciones.length)} de {filteredCotizaciones.length}
                                    </p>
                                )}
                            </div>

                            {loadingHistory ? (
                                <div className="py-12 text-center">
                                    <FiLoader className="animate-spin text-3xl text-[#D6A75D] mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">Cargando historial...</p>
                                </div>
                            ) : (
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
                                                    Fecha Servicio
                                                </th>
                                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                    Método Pago
                                                </th>
                                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                                                    Estado
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
                                            {paginatedCotizaciones.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">
                                                        {cotizaciones.length === 0
                                                            ? 'No hay cotizaciones creadas aún'
                                                            : 'No se encontraron cotizaciones con estos filtros'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginatedCotizaciones.map((cot) => (
                                                    <tr
                                                        key={cot.id}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div>
                                                                <p className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                                    {new Date(cot.createdAt).toLocaleDateString('es-CO', {
                                                                        day: '2-digit',
                                                                        month: '2-digit',
                                                                        year: 'numeric'
                                                                    })}
                                                                </p>
                                                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                                                    {new Date(cot.createdAt).toLocaleTimeString('es-CO', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className="font-mono text-xs sm:text-sm font-semibold text-[#D6A75D] whitespace-nowrap">
                                                                {cot.codigo}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div>
                                                                <p className="text-xs sm:text-sm font-medium text-gray-900 whitespace-nowrap">{cot.nombreCliente}</p>
                                                                <p className="text-xs text-gray-500 truncate max-w-[150px]">{cot.emailCliente}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className="text-xs sm:text-sm text-gray-900">
                                                                {cot.servicio?.nombre ? getLocalizedText(cot.servicio.nombre, 'ES') : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div>
                                                                <p className="text-xs sm:text-sm text-gray-900 whitespace-nowrap">
                                                                    {(() => {
                                                                        const dateStr = new Date(cot.fecha).toISOString().split('T')[0];
                                                                        const [year, month, day] = dateStr.split('-');
                                                                        return `${day}/${month}/${year}`;
                                                                    })()}
                                                                </p>
                                                                <p className="text-xs text-gray-500 whitespace-nowrap">{cot.hora}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${
                                                                cot.metodoPago === 'EFECTIVO'
                                                                    ? 'bg-emerald-100 text-emerald-700'
                                                                    : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {cot.metodoPago === 'EFECTIVO' ? '💵 Efectivo' : '💳 Bold'}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium ${getStateColor(cot.estado)}`}>
                                                                {getStateLabel(cot.estado)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <span className="text-xs sm:text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                                ${Number(cot.precioTotal).toLocaleString('es-CO')}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button
                                                                    onClick={() => router.push(`/admin/dashboard/reservas/${cot.id}`)}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Ver detalle"
                                                                >
                                                                    <FiEye size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => copyTrackingLink(cot.codigo)}
                                                                    className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Copiar link de tracking"
                                                                >
                                                                    {copiedCode === cot.codigo ? (
                                                                        <FiCheck size={16} className="text-green-600" />
                                                                    ) : (
                                                                        <FiCopy size={16} />
                                                                    )}
                                                                </button>
                                                                <a
                                                                    href={`/tracking/${cot.codigo}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 text-gray-500 hover:text-[#D6A75D] hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="Abrir tracking"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <FiExternalLink size={16} />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredCotizaciones.length > itemsPerPage && (
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex items-center justify-between">
                                    <p className="text-xs sm:text-sm text-gray-600">
                                        Página {currentPage} de {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Anterior
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Quote Wizard Modal */}
            {selectedService && (
                <QuoteWizard
                    service={selectedService}
                    isOpen={wizardOpen}
                    onClose={handleWizardClose}
                />
            )}
        </div>
    );
}
