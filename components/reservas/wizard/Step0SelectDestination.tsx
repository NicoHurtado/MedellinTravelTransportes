'use client';

import { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiChevronRight, FiSearch } from 'react-icons/fi';
import { useLanguage, t } from '@/lib/i18n';
import { getLocalizedText } from '@/types/multi-language';

interface ViajeMunicipal {
    id: string;
    nombre: { es: string; en: string };
    descripcion: { es: string; en: string };
    imagen: string;
    duracion: string | null;
    vehiculosPermitidos: {
        precio: number;
    }[];
}

interface Step0SelectDestinationProps {
    onSelectDestination: (serviceId: string) => void;
}

export default function Step0SelectDestination({ onSelectDestination }: Step0SelectDestinationProps) {
    const { language } = useLanguage();
    const [viajes, setViajes] = useState<ViajeMunicipal[]>([]);
    const [filteredViajes, setFilteredViajes] = useState<ViajeMunicipal[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchViajes();
    }, []);

    useEffect(() => {
        // Filter viajes based on search term
        if (searchTerm.trim() === '') {
            setFilteredViajes(viajes);
        } else {
            const filtered = viajes.filter((viaje) => {
                const nombre = getLocalizedText(viaje.nombre, language).toLowerCase();
                const descripcion = getLocalizedText(viaje.descripcion, language).toLowerCase();
                const search = searchTerm.toLowerCase();
                return nombre.includes(search) || descripcion.includes(search);
            });
            setFilteredViajes(filtered);
        }
    }, [searchTerm, viajes, language]);

    const fetchViajes = async () => {
        try {
            const res = await fetch('/api/servicios?tipo=TRANSPORTE_MUNICIPAL&activo=true');
            const data = await res.json();
            
            if (data.success) {
                setViajes(data.data);
                setFilteredViajes(data.data);
            }
        } catch (error) {
            console.error('Error fetching viajes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (serviceId: string) => {
        setSelectedId(serviceId);
        // Small delay for visual feedback
        setTimeout(() => {
            onSelectDestination(serviceId);
        }, 200);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        );
    }

    if (viajes.length === 0) {
        return (
            <div className="text-center py-12">
                <FiMapPin className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {language === 'es' ? 'No hay destinos disponibles' : 'No destinations available'}
                </h3>
                <p className="text-gray-600">
                    {language === 'es' 
                        ? 'Por favor intenta más tarde' 
                        : 'Please try again later'}
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {language === 'es' ? '¿A dónde quieres viajar?' : 'Where do you want to go?'}
                </h2>
                <p className="text-gray-600">
                    {language === 'es' 
                        ? 'Busca y selecciona tu destino para continuar con la reserva' 
                        : 'Search and select your destination to continue with the reservation'}
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={language === 'es' ? 'Buscar municipio...' : 'Search municipality...'}
                        className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#D6A75D] focus:border-[#D6A75D] outline-none transition-all"
                    />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    {language === 'es' 
                        ? `${filteredViajes.length} destino${filteredViajes.length !== 1 ? 's' : ''} disponible${filteredViajes.length !== 1 ? 's' : ''}`
                        : `${filteredViajes.length} destination${filteredViajes.length !== 1 ? 's' : ''} available`}
                </p>
            </div>

            {/* Lista de Destinos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-h-[600px] overflow-y-auto">
                {filteredViajes.length === 0 ? (
                    <div className="text-center py-12 px-4">
                        <FiMapPin className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-600">
                            {language === 'es' 
                                ? 'No se encontraron destinos con ese término de búsqueda' 
                                : 'No destinations found with that search term'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredViajes.map((viaje) => {
                            const isSelected = selectedId === viaje.id;
                            
                            return (
                                <button
                                    key={viaje.id}
                                    onClick={() => handleSelect(viaje.id)}
                                    className={`w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between group ${
                                        isSelected ? 'bg-[#D6A75D]/10 border-l-4 border-[#D6A75D]' : ''
                                    }`}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        {/* Icono */}
                                        <div className={`p-3 rounded-lg transition-colors ${
                                            isSelected ? 'bg-[#D6A75D] text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-[#D6A75D]/20 group-hover:text-[#D6A75D]'
                                        }`}>
                                            <FiMapPin size={24} />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className={`font-bold text-lg mb-1 ${
                                                isSelected ? 'text-[#D6A75D]' : 'text-gray-900'
                                            }`}>
                                                {getLocalizedText(viaje.nombre, language)}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-1">
                                                {getLocalizedText(viaje.descripcion, language)}
                                            </p>
                                            {viaje.duracion && (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                    <FiClock size={12} />
                                                    <span>{viaje.duracion}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow o Check */}
                                    <div className="ml-4">
                                        {isSelected ? (
                                            <div className="bg-[#D6A75D] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2">
                                                ✓ {language === 'es' ? 'Seleccionado' : 'Selected'}
                                            </div>
                                        ) : (
                                            <FiChevronRight 
                                                className="text-gray-400 group-hover:text-[#D6A75D] group-hover:translate-x-1 transition-all" 
                                                size={24} 
                                            />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

