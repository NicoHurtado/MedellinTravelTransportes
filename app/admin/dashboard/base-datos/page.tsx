'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { FiDatabase, FiSearch, FiX, FiFilter, FiChevronLeft, FiChevronRight, FiDownload, FiChevronDown, FiCheck } from 'react-icons/fi';
import { getLocalizedText } from '@/types/multi-language';
import { getStateLabel, getStateColor } from '@/lib/state-transitions';
import { exportarReservasPDF } from '@/lib/exportUtils';

type ViewMode = 'nueva' | 'antigua';

const ITEMS_PER_PAGE = 20;

export default function BaseDatosPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('nueva');
    const [reservas, setReservas] = useState<any[]>([]);
    const [bdAntigua, setBdAntigua] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);


    const handleExport = () => {
        exportarReservasPDF(filteredData, viewMode, {
            desde: fechaInicio,
            hasta: fechaFin,
            busqueda: searchQuery
        });
    };

    // Summation states
    const [showCommissionSum, setShowCommissionSum] = useState(false);
    const [showTotalSum, setShowTotalSum] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [servicioFilter, setServicioFilter] = useState('');
    const [canalFilter, setCanalFilter] = useState('');
    const [aliadoFilter, setAliadoFilter] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string[]>([]);
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const [aliados, setAliados] = useState<any[]>([]);

    useEffect(() => {
        const fetchAliados = async () => {
            try {
                const res = await fetch('/api/aliados');
                if (res.ok) {
                    const data = await res.json();
                    setAliados(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching aliados:', error);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                if (viewMode === 'nueva') {
                    const res = await fetch('/api/reservas');
                    if (res.ok) {
                        const data = await res.json();
                        setReservas(data.data || []);
                    }
                } else {
                    const res = await fetch('/api/bd-antigua');
                    if (res.ok) {
                        const data = await res.json();
                        setBdAntigua(data.data || []);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        fetchAliados();
    }, [viewMode]);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [searchQuery, fechaInicio, fechaFin, servicioFilter, canalFilter, aliadoFilter, estadoFilter]);

    // Filter data based on search and filters
    const filteredData = viewMode === 'nueva'
        ? reservas.filter(r => {
            const matchesSearch = searchQuery === '' ||
                Object.values(r).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                );

            const matchesFecha = (!fechaInicio || new Date(r.fecha) >= new Date(fechaInicio)) &&
                (!fechaFin || new Date(r.fecha) <= new Date(fechaFin));

            const servicioNombre = r.servicio?.nombre ? getLocalizedText(r.servicio.nombre, 'ES') : '';
            const matchesServicio = !servicioFilter || servicioNombre === servicioFilter;

            // Ally Filter Logic
            let matchesAliado = true;
            if (aliadoFilter) {
                if (aliadoFilter === 'independiente') {
                    matchesAliado = !r.esReservaAliado;
                } else {
                    matchesAliado = r.aliadoId === aliadoFilter;
                }
            }

            // Status Filter Logic (Multi-select)
            const matchesEstado = estadoFilter.length === 0 || estadoFilter.includes(r.estado);

            return matchesSearch && matchesFecha && matchesServicio && matchesAliado && matchesEstado;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : bdAntigua.filter(r => {
            const matchesSearch = searchQuery === '' ||
                Object.values(r).some(val =>
                    String(val).toLowerCase().includes(searchQuery.toLowerCase())
                );

            const matchesFecha = (!fechaInicio || (r.fecha && new Date(r.fecha) >= new Date(fechaInicio))) &&
                (!fechaFin || (r.fecha && new Date(r.fecha) <= new Date(fechaFin)));

            const matchesServicio = !servicioFilter || r.servicio === servicioFilter;
            const matchesCanal = !canalFilter || r.canal === canalFilter;

            return matchesSearch && matchesFecha && matchesServicio && matchesCanal;
        });

    // Pagination
    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    // Get unique services for filter
    const uniqueServicios = viewMode === 'nueva'
        ? Array.from(new Set(reservas.map(r => r.servicio?.nombre ? getLocalizedText(r.servicio.nombre, 'ES') : null).filter(Boolean)))
        : Array.from(new Set(bdAntigua.map(r => r.servicio).filter(Boolean)));

    // Get unique canales for BD Antigua
    const uniqueCanales = Array.from(new Set(bdAntigua.map(r => r.canal).filter(Boolean)));

    const clearFilters = () => {
        setSearchQuery('');
        setFechaInicio('');
        setFechaFin('');
        setServicioFilter('');
        setCanalFilter('');
        setAliadoFilter('');
        setEstadoFilter([]);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando base de datos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Base de Datos</h1>
                            <p className="text-sm text-gray-500 mt-1">Gestión unificada de registros</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-8 py-6 space-y-6">
                {/* View Mode Toggle */}
                <Card>
                    <div className="flex items-center gap-4">
                        <FiDatabase className="text-[#D6A75D]" size={24} />
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Vista de Base de Datos
                            </label>
                            <div className="flex items-center justify-between gap-4 no-print">
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setViewMode('nueva')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'nueva'
                                            ? 'bg-white text-[#D6A75D] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Registros Nuevos (Desde Hoy)
                                    </button>
                                    <button
                                        onClick={() => setViewMode('antigua')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'antigua'
                                            ? 'bg-white text-[#D6A75D] shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Base de Datos Antigua (Histórico)
                                    </button>
                                </div>

                                <button
                                    onClick={handleExport}
                                    className="flex items-center gap-2 px-4 py-2 bg-black text-white border border-gray-900 rounded-lg hover:bg-gray-800 transition-all shadow-sm"
                                >
                                    <FiDownload size={18} />
                                    <span className="font-medium">Descargar PDF</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Filters */}
                <Card>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FiFilter className="text-gray-600" />
                                <h3 className="font-semibold text-gray-900">Filtros</h3>
                            </div>
                            <button
                                onClick={clearFilters}
                                className="text-sm text-[#D6A75D] hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Search */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Búsqueda General
                                </label>
                                <div className="relative">
                                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Buscar en cualquier campo..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* Fecha Inicio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha Inicio
                                </label>
                                <input
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>

                            {/* Fecha Fin */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha Fin
                                </label>
                                <input
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>

                            {/* Servicio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Servicio
                                </label>
                                <select
                                    value={servicioFilter}
                                    onChange={(e) => setServicioFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                >
                                    <option value="">Todos los servicios</option>
                                    {uniqueServicios.map(servicio => (
                                        <option key={servicio as string} value={servicio as string}>{servicio}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Canal (only for BD Antigua) */}
                            {viewMode === 'antigua' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Canal
                                    </label>
                                    <select
                                        value={canalFilter}
                                        onChange={(e) => setCanalFilter(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    >
                                        <option value="">Todos los canales</option>
                                        {uniqueCanales.map(canal => (
                                            <option key={canal} value={canal}>{canal}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Aliado Filter (New) */}
                            {viewMode === 'nueva' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Aliado
                                    </label>
                                    <select
                                        value={aliadoFilter}
                                        onChange={(e) => setAliadoFilter(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    >
                                        <option value="">Todos los aliados</option>
                                        <option value="independiente">Independiente (Sin aliado)</option>
                                        {aliados.map(aliado => (
                                            <option key={aliado.id} value={aliado.id}>{aliado.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Status Filter (Multi-Select) */}
                            {viewMode === 'nueva' && (
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estado
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent bg-white text-left flex justify-between items-center"
                                    >
                                        <span className="truncate text-sm">
                                            {estadoFilter.length === 0
                                                ? 'Todos los estados'
                                                : `${estadoFilter.length} seleccionado${estadoFilter.length !== 1 ? 's' : ''}`}
                                        </span>
                                        <FiChevronDown className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isStatusDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setIsStatusDropdownOpen(false)}
                                            />
                                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto p-2">
                                                {[
                                                    { value: 'PENDIENTE_COTIZACION', label: 'Pendiente Cotización' },
                                                    { value: 'CONFIRMADA_PENDIENTE_PAGO', label: 'Confirmada (Pendiente Pago)' },
                                                    { value: 'PAGADA_PENDIENTE_ASIGNACION', label: 'Pagada (Pendiente Asignación)' },
                                                    { value: 'ASIGNADA_PENDIENTE_COMPLETAR', label: 'Asignada (En Progreso)' },
                                                    { value: 'COMPLETADA', label: 'Completada' },
                                                    { value: 'CANCELADA', label: 'Cancelada' }
                                                ].map((option) => (
                                                    <div
                                                        key={option.value}
                                                        onClick={() => {
                                                            setEstadoFilter(prev => {
                                                                if (prev.includes(option.value)) {
                                                                    return prev.filter(s => s !== option.value);
                                                                } else {
                                                                    return [...prev, option.value];
                                                                }
                                                            });
                                                        }}
                                                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${estadoFilter.includes(option.value) ? 'bg-[#D6A75D] border-[#D6A75D]' : 'border-gray-300'}`}>
                                                            {estadoFilter.includes(option.value) && <FiCheck className="text-white w-3 h-3" />}
                                                        </div>
                                                        <span className="text-sm text-gray-700">{option.label}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredData.length)} de {filteredData.length} registros
                            </span>
                            <span>
                                Página {currentPage} de {totalPages || 1}
                            </span>
                        </div>
                    </div>
                </Card>

                {/* Table - Full Width */}
                <div>
                    <Card>
                        <div className="overflow-x-auto">
                            {viewMode === 'nueva' ? (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creada</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aliado</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedData.map((reserva) => (
                                            <tr
                                                key={reserva.id}
                                                onClick={() => setSelectedRecord(reserva)}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {new Date(reserva.createdAt).toLocaleDateString('es-CO')}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-[#D6A75D]">{reserva.codigo}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{reserva.nombreCliente}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(reserva.fecha).toLocaleDateString('es-CO')}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStateColor(reserva.estado)}`}>
                                                        {getStateLabel(reserva.estado)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {reserva.esReservaAliado && reserva.aliado ? (
                                                        <span className="font-medium text-blue-600">{reserva.aliado.nombre}</span>
                                                    ) : (
                                                        <span className="text-gray-400">Independiente</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {Number(reserva.comisionAliado) > 0 ? (
                                                        <span className="font-medium text-green-600">
                                                            ${Number(reserva.comisionAliado).toLocaleString('es-CO')}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">No aplica</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                                    ${Number(reserva.precioTotal || 0).toLocaleString('es-CO')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-50 border-t border-gray-200 font-semibold">
                                        <tr>
                                            <td colSpan={7} className="px-4 py-3 text-right text-sm text-gray-600">Totales (Vista Actual):</td>
                                            <td className="px-4 py-3 text-sm">
                                                {showCommissionSum ? (
                                                    <span className="text-green-600">
                                                        ${filteredData.reduce((sum, r) => sum + (Number(r.comisionAliado) || 0), 0).toLocaleString('es-CO')}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowCommissionSum(true); }}
                                                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 no-print"
                                                    >
                                                        Sumar
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {showTotalSum ? (
                                                    <span className="text-gray-900">
                                                        ${filteredData.reduce((sum, r) => sum + (Number(r.precioTotal) || 0), 0).toLocaleString('es-CO')}
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setShowTotalSum(true); }}
                                                        className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 no-print"
                                                    >
                                                        Sumar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canal</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Idioma</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servicio</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cotización</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {paginatedData.map((record) => (
                                            <tr
                                                key={record.id}
                                                onClick={() => setSelectedRecord(record)}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-3 text-sm text-gray-900">{record.canal || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900">{record.nombre || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{record.idioma || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {record.fecha ? new Date(record.fecha).toLocaleDateString('es-CO') : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {record.hora ? new Date(record.hora).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{record.servicio || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{record.numero_contacto || '-'}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{record.cotizacion || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{record.comision || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {paginatedData.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    No se encontraron registros
                                </div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 no-print">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiChevronLeft />
                                    Anterior
                                </button>

                                <div className="flex items-center gap-2">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-1 text-sm font-medium rounded-lg ${currentPage === pageNum
                                                    ? 'bg-[#D6A75D] text-white'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Siguiente
                                    <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </Card>
                </div>
            </main>

            {/* Slide-in Detail Panel */}
            {selectedRecord && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity no-print"
                        onClick={() => setSelectedRecord(null)}
                    />

                    {/* Slide-in Panel from Right */}
                    <div className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-y-auto animate-slideInRight no-print">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Detalles del Registro</h3>
                                <button
                                    onClick={() => setSelectedRecord(null)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <FiX size={24} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {viewMode === 'nueva' ? (
                                    <>
                                        <DetailRow label="Código" value={selectedRecord.codigo} />
                                        <DetailRow label="Cliente" value={selectedRecord.nombreCliente} />
                                        <DetailRow label="Email" value={selectedRecord.emailCliente} />
                                        <DetailRow label="WhatsApp" value={selectedRecord.whatsappCliente} />
                                        <DetailRow label="Servicio" value={selectedRecord.servicio?.nombre ? getLocalizedText(selectedRecord.servicio.nombre, 'ES') : '-'} />
                                        <DetailRow label="Fecha" value={new Date(selectedRecord.fecha).toLocaleDateString('es-CO')} />
                                        <DetailRow label="Hora" value={selectedRecord.hora} />
                                        <div className="border-b border-gray-100 pb-3">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Estado</p>
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStateColor(selectedRecord.estado)}`}>
                                                {getStateLabel(selectedRecord.estado)}
                                            </span>
                                        </div>

                                        <div className="border-b border-gray-100 pb-3">
                                            <p className="text-xs font-medium text-gray-500 mb-1">
                                                {selectedRecord.esReservaAliado ? 'Aliado' : 'Canal'}
                                            </p>
                                            <p className={`text-sm ${selectedRecord.esReservaAliado ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
                                                {selectedRecord.esReservaAliado && selectedRecord.aliado
                                                    ? selectedRecord.aliado.nombre
                                                    : 'Independiente'}
                                            </p>
                                        </div>

                                        {selectedRecord.esReservaAliado && Number(selectedRecord.comisionAliado) > 0 && (
                                            <div className="border-b border-gray-100 pb-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Comisión</p>
                                                <p className="text-sm text-green-600 font-medium">
                                                    ${Number(selectedRecord.comisionAliado).toLocaleString('es-CO')}
                                                </p>
                                            </div>
                                        )}
                                        <DetailRow label="Método de Pago" value={selectedRecord.metodoPago} />
                                        <DetailRow label="Precio Total" value={`$${Number(selectedRecord.precioTotal || 0).toLocaleString('es-CO')}`} />
                                        <DetailRow label="Pasajeros" value={selectedRecord.numeroPasajeros} />
                                        <DetailRow label="Idioma" value={selectedRecord.idioma} />
                                        <DetailRow label="Municipio" value={selectedRecord.municipio} />
                                        {selectedRecord.origen && <DetailRow label="Origen" value={selectedRecord.origen} />}
                                        {selectedRecord.destino && <DetailRow label="Destino" value={selectedRecord.destino} />}
                                        {selectedRecord.lugarRecogida && <DetailRow label="Lugar de Recogida" value={selectedRecord.lugarRecogida} />}
                                        {selectedRecord.notasEspeciales && <DetailRow label="Notas" value={selectedRecord.notasEspeciales} />}
                                    </>
                                ) : (
                                    <>
                                        <DetailRow label="ID" value={selectedRecord.id} />
                                        <DetailRow label="Canal" value={selectedRecord.canal} />
                                        <DetailRow label="Nombre" value={selectedRecord.nombre} />
                                        <DetailRow label="Idioma" value={selectedRecord.idioma} />
                                        <DetailRow label="Fecha" value={selectedRecord.fecha ? new Date(selectedRecord.fecha).toLocaleDateString('es-CO') : '-'} />
                                        <DetailRow label="Hora" value={selectedRecord.hora ? new Date(selectedRecord.hora).toLocaleTimeString('es-CO') : '-'} />
                                        <DetailRow label="Servicio" value={selectedRecord.servicio} />
                                        <DetailRow label="Vehículo" value={selectedRecord.vehiculo} />
                                        <DetailRow label="Número de Vuelo" value={selectedRecord.numero_vuelo} />
                                        <DetailRow label="Contacto" value={selectedRecord.numero_contacto} />
                                        <DetailRow label="Cotización" value={selectedRecord.cotizacion} />
                                        <DetailRow label="Comisión" value={selectedRecord.comision} />
                                        <DetailRow label="Estado Servicio" value={selectedRecord.estado_servicio} />
                                        <DetailRow label="Estado Pago" value={selectedRecord.estado_pago} />
                                        <DetailRow label="Conductor" value={selectedRecord.conductor} />
                                        {selectedRecord.informacion_adicional && (
                                            <div className="pt-3 border-t border-gray-200">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Información Adicional</p>
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.informacion_adicional}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}



            <style jsx>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slideInRight {
                    animation: slideInRight 0.3s ease-out;
                }

            `}</style>
        </div>
    );
}



function DetailRow({ label, value }: { label: string; value: any }) {
    if (!value) return null;

    return (
        <div className="border-b border-gray-100 pb-3">
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-sm text-gray-900">{value}</p>
        </div>
    );
}
