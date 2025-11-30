'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiX } from 'react-icons/fi';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';

interface Reserva {
    id: string;
    codigo: string;
    createdAt: string;
    fecha: string;
    hora: string;
    nombreCliente: string;
    emailCliente: string;
    whatsappCliente: string;
    estado: string;
    precioTotal: number;
    comisionAliado: number;
    numeroPasajeros: number;
    municipio: string;
    otroMunicipio?: string;
    lugarRecogida?: string;
    servicio: {
        nombre: any;
    };
    vehiculo?: {
        nombre: string;
    };
    conductor?: {
        nombre: string;
    };
    asistentes?: any[];
}

function MisReservasContent() {
    const searchParams = useSearchParams();
    const aliadoId = searchParams?.get('aliadoId');

    const [reservas, setReservas] = useState<Reserva[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Filters
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        if (aliadoId) {
            fetchReservas();
        }
    }, [aliadoId]);

    const fetchReservas = async () => {
        try {
            const res = await fetch(`/api/aliados/${aliadoId}/reservas`);
            const data = await res.json();
            setReservas(data.data || []);
        } catch (error) {
            console.error('Error loading reservations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: string) => {
        const colors: any = {
            PENDIENTE_COTIZACION: 'bg-yellow-100 text-yellow-800',
            CONFIRMADA_PENDIENTE_PAGO: 'bg-gray-100 text-gray-800',
            PAGADA_PENDIENTE_ASIGNACION: 'bg-blue-100 text-blue-800',
            CONFIRMADA_PENDIENTE_ASIGNACION: 'bg-green-100 text-green-800',
            ASIGNADA_PENDIENTE_COMPLETAR: 'bg-green-100 text-green-800',
            COMPLETADA: 'bg-green-200 text-green-900',
            CANCELADA: 'bg-red-100 text-red-800',
        };
        return colors[estado] || 'bg-gray-100 text-gray-800';
    };

    const getEstadoLabel = (estado: string) => {
        const labels: any = {
            PENDIENTE_COTIZACION: 'Pendiente Cotización',
            CONFIRMADA_PENDIENTE_PAGO: 'Confirmada',
            PAGADA_PENDIENTE_ASIGNACION: 'Pagada',
            CONFIRMADA_PENDIENTE_ASIGNACION: 'Confirmada',
            ASIGNADA_PENDIENTE_COMPLETAR: 'Asignada',
            COMPLETADA: 'Completada',
            CANCELADA: 'Cancelada',
        };
        return labels[estado] || estado;
    };

    const viewDetails = (reserva: Reserva) => {
        setSelectedReserva(reserva);
        setShowDetailsModal(true);
    };

    // Filter reservations by date range
    const filteredReservas = reservas.filter((reserva) => {
        const createdAt = new Date(reserva.createdAt);

        if (fechaDesde) {
            const desde = new Date(fechaDesde);
            desde.setHours(0, 0, 0, 0);
            if (createdAt < desde) return false;
        }

        if (fechaHasta) {
            const hasta = new Date(fechaHasta);
            hasta.setHours(23, 59, 59, 999);
            if (createdAt > hasta) return false;
        }

        return true;
    });

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [fechaDesde, fechaHasta]);

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

    if (!aliadoId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-gray-600">No se especificó un aliado</p>
            </div>
        );
    }

    return (
        <>
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="bg-white rounded-2xl shadow-sm p-8">
                        <h1 className="text-3xl font-bold mb-6">Mis Reservas</h1>

                        {/* Date Filters */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaDesde}
                                        onChange={(e) => setFechaDesde(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={fechaHasta}
                                        onChange={(e) => setFechaHasta(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        setFechaDesde('');
                                        setFechaHasta('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                            {(fechaDesde || fechaHasta) && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Mostrando {filteredReservas.length} reservas filtradas
                                </p>
                            )}
                        </div>

                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                            </div>
                        ) : filteredReservas.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No hay reservas</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b-2 border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Creada</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Servicio</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Comisión</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {paginatedReservas.map((reserva) => (
                                                <tr
                                                    key={reserva.id}
                                                    onClick={() => viewDetails(reserva)}
                                                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                >
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                        {new Date(reserva.createdAt).toLocaleDateString('es-CO', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric'
                                                        })}
                                                        <br />
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(reserva.createdAt).toLocaleTimeString('es-CO', {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-mono font-semibold text-[#D6A75D]">
                                                            {reserva.codigo}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(reserva.fecha).toLocaleDateString('es-CO', {
                                                            day: '2-digit',
                                                            month: 'short'
                                                        })}
                                                        <br />
                                                        <span className="text-xs text-gray-500">{reserva.hora}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {typeof reserva.servicio.nombre === 'string'
                                                            ? reserva.servicio.nombre
                                                            : reserva.servicio.nombre?.es || 'N/A'}
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-900">
                                                        {reserva.nombreCliente}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(reserva.estado)}`}>
                                                            {getEstadoLabel(reserva.estado)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                        ${Number(reserva.comisionAliado).toLocaleString('es-CO')}
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                        ${Number(reserva.precioTotal).toLocaleString('es-CO')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {filteredReservas.length > itemsPerPage && (
                                    <div className="mt-6 flex items-center justify-between border-t pt-4">
                                        <p className="text-sm text-gray-600">
                                            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredReservas.length)} de {filteredReservas.length} reservas
                                        </p>

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
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Footer />

            {/* Details Modal */}
            {showDetailsModal && selectedReserva && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Detalles de Reserva</h2>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Código de Reserva</p>
                                    <p className="text-2xl font-mono font-bold text-[#D6A75D]">
                                        {selectedReserva.codigo}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Estado</p>
                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getEstadoColor(selectedReserva.estado)}`}>
                                        {getEstadoLabel(selectedReserva.estado)}
                                    </span>
                                </div>
                            </div>

                            {/* Service Details */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4">Servicio</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Servicio</p>
                                        <p className="font-semibold">
                                            {typeof selectedReserva.servicio.nombre === 'string'
                                                ? selectedReserva.servicio.nombre
                                                : selectedReserva.servicio.nombre?.es || 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Fecha y Hora</p>
                                        <p className="font-semibold">
                                            {new Date(selectedReserva.fecha).toLocaleDateString('es-CO')} - {selectedReserva.hora}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Pasajeros</p>
                                        <p className="font-semibold">{selectedReserva.numeroPasajeros}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Municipio</p>
                                        <p className="font-semibold">
                                            {selectedReserva.municipio === 'OTRO' && selectedReserva.otroMunicipio
                                                ? selectedReserva.otroMunicipio
                                                : selectedReserva.municipio}
                                        </p>
                                    </div>
                                    {selectedReserva.lugarRecogida && (
                                        <div className="col-span-2">
                                            <p className="text-sm text-gray-500">Lugar de Recogida</p>
                                            <p className="font-semibold">{selectedReserva.lugarRecogida}</p>
                                        </div>
                                    )}
                                    {selectedReserva.vehiculo && (
                                        <div>
                                            <p className="text-sm text-gray-500">Vehículo</p>
                                            <p className="font-semibold">{selectedReserva.vehiculo.nombre}</p>
                                        </div>
                                    )}
                                    {selectedReserva.conductor && (
                                        <div>
                                            <p className="text-sm text-gray-500">Conductor</p>
                                            <p className="font-semibold">{selectedReserva.conductor.nombre}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Info */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4">Cliente</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Nombre</p>
                                        <p className="font-semibold">{selectedReserva.nombreCliente}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-semibold">{selectedReserva.emailCliente}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">WhatsApp</p>
                                        <p className="font-semibold">{selectedReserva.whatsappCliente}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-bold mb-4">Precios</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total de Reserva</span>
                                        <span className="font-bold text-lg">
                                            ${Number(selectedReserva.precioTotal).toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span className="font-semibold">Tu Comisión</span>
                                        <span className="font-bold text-xl">
                                            ${Number(selectedReserva.comisionAliado).toLocaleString('es-CO')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendees if any */}
                            {selectedReserva.asistentes && selectedReserva.asistentes.length > 0 && (
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-bold mb-4">Asistentes</h3>
                                    <div className="space-y-2">
                                        {selectedReserva.asistentes.map((asistente: any, index: number) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="font-medium">{asistente.nombre}</span>
                                                <span className="text-sm text-gray-600">
                                                    {asistente.tipoDocumento}: {asistente.numeroDocumento}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="w-full bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default function MisReservasPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        }>
            <MisReservasContent />
        </Suspense>
    );
}
