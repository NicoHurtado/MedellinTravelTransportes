'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight, FiMapPin } from 'react-icons/fi';
import Link from 'next/link';
import { getLocalizedText } from '@/types/multi-language';

interface ViajeMunicipal {
    id: string;
    nombre: { es: string; en: string };
    descripcion: { es: string; en: string };
    activo: boolean;
    imagen: string;
    vehiculosPermitidos: {
        id: string;
        precio: number;
        vehiculo: {
            id: string;
            nombre: string;
        };
    }[];
    tarifasPorMunicipio: any;
    _count: {
        reservas: number;
    };
}

export default function TransporteMunicipalPage() {
    const router = useRouter();
    const [viajes, setViajes] = useState<ViajeMunicipal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchViajes();
    }, []);

    const fetchViajes = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/servicios?tipo=TRANSPORTE_MUNICIPAL');
            const data = await res.json();

            if (data.success) {
                setViajes(data.data);
            }
        } catch (error) {
            console.error('Error fetching viajes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/servicios/${id}/toggle`, {
                method: 'PATCH',
            });

            const data = await res.json();

            if (data.success) {
                setViajes(
                    viajes.map((v) =>
                        v.id === id ? { ...v, activo: data.data.activo } : v
                    )
                );
            }
        } catch (error) {
            console.error('Error toggling viaje:', error);
            alert('Error al cambiar estado del viaje');
        }
    };

    const handleDelete = async (id: string, nombre: any) => {
        const nombreES = getLocalizedText(nombre, 'ES');
        if (!confirm(`¿Estás seguro de eliminar el viaje a "${nombreES}"?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/servicios/${id}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                setViajes(viajes.filter((v) => v.id !== id));
                alert('Viaje eliminado exitosamente');
            } else {
                alert(data.error || 'Error al eliminar viaje');
            }
        } catch (error) {
            console.error('Error deleting viaje:', error);
            alert('Error al eliminar viaje');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Transporte Municipal</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona los destinos disponibles para transporte municipal
                    </p>
                </div>
                <Link
                    href="/admin/dashboard/servicios/transporte-municipal/crear"
                    className="flex items-center gap-2 px-6 py-3 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold rounded-lg transition-colors"
                >
                    <FiPlus size={20} />
                    Crear Nuevo Viaje
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Viajes Activos</p>
                            <p className="text-3xl font-bold text-green-600">
                                {viajes.filter((v) => v.activo).length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <FiToggleRight className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Viajes */}
            {viajes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                    <FiMapPin className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        No hay viajes municipales creados
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Crea tu primer viaje municipal para empezar a recibir reservas
                    </p>
                    <Link
                        href="/admin/dashboard/servicios/transporte-municipal/crear"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold rounded-lg transition-colors"
                    >
                        <FiPlus size={20} />
                        Crear Primer Viaje
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {viajes.map((viaje) => (
                        <div
                            key={viaje.id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            {/* Imagen */}
                            <div className="relative h-48 bg-gray-200">
                                {viaje.imagen ? (
                                    <img
                                        src={viaje.imagen}
                                        alt={getLocalizedText(viaje.nombre, 'ES')}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <FiMapPin className="text-gray-400" size={48} />
                                    </div>
                                )}
                                {/* Badge Activo/Inactivo */}
                                <div className="absolute top-3 right-3">
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            viaje.activo
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-500 text-white'
                                        }`}
                                    >
                                        {viaje.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {getLocalizedText(viaje.nombre, 'ES')}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                    {getLocalizedText(viaje.descripcion, 'ES')}
                                </p>

                                {/* Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Vehículos:</span>
                                        <span className="font-medium">
                                            {viaje.vehiculosPermitidos.length}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Reservas:</span>
                                        <span className="font-medium">{viaje._count.reservas}</span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/dashboard/servicios/${viaje.id}/editar`}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                    >
                                        <FiEdit2 size={16} />
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleToggleActive(viaje.id)}
                                        className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                                            viaje.activo
                                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                                : 'bg-green-600 hover:bg-green-700 text-white'
                                        }`}
                                        title={viaje.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {viaje.activo ? (
                                            <FiToggleLeft size={20} />
                                        ) : (
                                            <FiToggleRight size={20} />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(viaje.id, viaje.nombre)}
                                        className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                        title="Eliminar"
                                    >
                                        <FiTrash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

