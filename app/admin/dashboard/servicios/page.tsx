'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiSearch } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { getLocalizedText } from '@/types/multi-language';
import MunicipalServicesGroup from './MunicipalServicesGroup';

interface Servicio {
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen: string;
    activo: boolean;
    precioBase: number;
    esAeropuerto: boolean;
    destinoAutoFill: string | null;
    camposPersonalizados: any[];
    vehiculosPermitidos: {
        id: string;
        precio: number;
        vehiculo: {
            id: string;
            nombre: string;
        };
    }[];
    _count: {
        reservas: number;
    };
}

export default function ServiciosPage() {
    const router = useRouter();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tipoFilter, setTipoFilter] = useState('');
    const [activoFilter, setActivoFilter] = useState<string>('');

    useEffect(() => {
        const fetchServicios = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (tipoFilter) params.append('tipo', tipoFilter);
                if (activoFilter) params.append('activo', activoFilter);

                // Agregar limit alto para traer todos los servicios
                params.append('limit', '1000');
                const res = await fetch(`/api/admin/servicios?${params.toString()}`);
                const data = await res.json();

                if (data.success) {
                    setServicios(data.data);
                }
            } catch (error) {
                console.error('Error fetching services:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchServicios();
    }, [search, tipoFilter, activoFilter]);

    const handleToggleActive = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/servicios/${id}/toggle`, {
                method: 'PATCH',
            });

            const data = await res.json();

            if (data.success) {
                // Update local state
                setServicios(
                    servicios.map((s) =>
                        s.id === id ? { ...s, activo: data.data.activo } : s
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling service:', error);
            alert('Error al cambiar estado del servicio');
        }
    };

    const handleDelete = async (id: string, nombre: any) => {
        const nombreES = getLocalizedText(nombre, 'ES');
        if (!confirm(`¿Estás seguro de eliminar el servicio "${nombreES}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/servicios/${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setServicios(servicios.filter((s) => s.id !== id));
                alert('Servicio eliminado exitosamente');
            } else {
                alert(data.error || 'Error al eliminar servicio');
            }
        } catch (error) {
            console.error('Error deleting service:', error);
            alert('Error al eliminar servicio');
        }
    };

    const getTipoLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            TRANSPORTE_MUNICIPAL: 'Transporte Municipal',
            TRANSPORTE_AEROPUERTO: 'Aeropuerto',
            CITY_TOUR: 'City Tour',
            TOUR_GUATAPE: 'Guatapé',
            TOUR_PARAPENTE: 'Parapente',
            TOUR_ATV: 'ATV',
            TOUR_HACIENDA_NAPOLES: 'Hacienda Nápoles',
            TOUR_OCCIDENTE: 'Occidente',
            TOUR_COMPARTIDO: 'Tour Compartido',
            OTRO: 'Otro',
        };
        return labels[tipo] || tipo;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Servicios</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona los servicios disponibles para reserva
                    </p>
                </div>
                <Link
                    href="/admin/dashboard/servicios/crear"
                    className="flex items-center gap-2 px-6 py-3 bg-[#D6A75D] text-black font-bold rounded-lg hover:bg-[#C5964A] transition-colors"
                >
                    <FiPlus /> Crear Servicio
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar servicios..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                    >
                        <option value="">Todos los tipos</option>
                        <option value="TRANSPORTE_MUNICIPAL">Transporte Municipal</option>
                        <option value="TRANSPORTE_AEROPUERTO">Aeropuerto</option>
                        <option value="CITY_TOUR">City Tour</option>
                        <option value="TOUR_GUATAPE">Guatapé</option>
                        <option value="TOUR_PARAPENTE">Parapente</option>
                        <option value="TOUR_ATV">ATV</option>
                        <option value="TOUR_HACIENDA_NAPOLES">Hacienda Nápoles</option>
                        <option value="TOUR_OCCIDENTE">Occidente</option>
                        <option value="TOUR_COMPARTIDO">Tour Compartido</option>
                        <option value="OTRO">Otro</option>
                    </select>

                    {/* Active Filter */}
                    <select
                        value={activoFilter}
                        onChange={(e) => setActivoFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                    >
                        <option value="">Todos los estados</option>
                        <option value="true">Activos</option>
                        <option value="false">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Services List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
                </div>
            ) : servicios.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <p className="text-gray-500 text-lg">No se encontraron servicios</p>
                    <Link
                        href="/admin/dashboard/servicios/crear"
                        className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-[#D6A75D] text-black font-bold rounded-lg hover:bg-[#C5964A] transition-colors"
                    >
                        <FiPlus /> Crear Primer Servicio
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {/* Municipal Services Group */}
                    <MunicipalServicesGroup
                        servicios={servicios.filter(s => s.tipo === 'TRANSPORTE_MUNICIPAL')}
                        onToggle={handleToggleActive}
                        onDelete={handleDelete}
                        getTipoLabel={getTipoLabel}
                    />

                    {/* Other Services */}
                    {servicios
                        .filter(s => s.tipo !== 'TRANSPORTE_MUNICIPAL')
                        .map((servicio) => (
                            <div
                                key={servicio.id}
                                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Service Image */}
                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                        <Image
                                            src={servicio.imagen || '/placeholder.jpg'}
                                            alt={getLocalizedText(servicio.nombre, 'ES')}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>

                                    {/* Service Info */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {getLocalizedText(servicio.nombre, 'ES')}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-sm px-2 py-1 bg-gray-100 rounded">
                                                        {getTipoLabel(servicio.tipo)}
                                                    </span>
                                                    {servicio.esAeropuerto && (
                                                        <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                            ✈️ Aeropuerto
                                                        </span>
                                                    )}
                                                    {servicio.destinoAutoFill && (
                                                        <span className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                                            📍 Auto-fill: {servicio.destinoAutoFill}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-sm px-2 py-1 rounded ${servicio.activo
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                            }`}
                                                    >
                                                        {servicio.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(servicio.id)}
                                                    className={`p-2 rounded transition-colors ${servicio.activo
                                                        ? 'text-green-600 hover:bg-green-50'
                                                        : 'text-gray-400 hover:bg-gray-50'
                                                        }`}
                                                    title={servicio.activo ? 'Desactivar' : 'Activar'}
                                                >
                                                    {servicio.activo ? (
                                                        <FiToggleRight size={24} />
                                                    ) : (
                                                        <FiToggleLeft size={24} />
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/admin/dashboard/servicios/${servicio.id}/editar`}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <FiEdit2 size={20} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(servicio.id, servicio.nombre)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <FiTrash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mt-2 line-clamp-2">
                                            {getLocalizedText(servicio.descripcion, 'ES')}
                                        </p>

                                        {/* Stats */}
                                        <div className="flex items-center gap-6 mt-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Precio base:</span>{' '}
                                                <span className="font-semibold">
                                                    ${Number(servicio.precioBase).toLocaleString('es-CO')}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Vehículos:</span>{' '}
                                                <span className="font-semibold">
                                                    {servicio.vehiculosPermitidos.length}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Campos dinámicos:</span>{' '}
                                                <span className="font-semibold">
                                                    {Array.isArray(servicio.camposPersonalizados)
                                                        ? servicio.camposPersonalizados.length
                                                        : 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
}
