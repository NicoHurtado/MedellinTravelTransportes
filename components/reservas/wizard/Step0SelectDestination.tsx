'use client';

import { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiChevronRight } from 'react-icons/fi';
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
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        fetchViajes();
    }, []);

    const fetchViajes = async () => {
        try {
            const res = await fetch('/api/servicios?tipo=TRANSPORTE_MUNICIPAL&activo=true');
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
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {language === 'es' ? '¿A dónde quieres viajar?' : 'Where do you want to go?'}
                </h2>
                <p className="text-gray-600">
                    {language === 'es' 
                        ? 'Selecciona tu destino para continuar con la reserva' 
                        : 'Select your destination to continue with the reservation'}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {viajes.map((viaje) => {
                    const isSelected = selectedId === viaje.id;

                    return (
                        <button
                            key={viaje.id}
                            onClick={() => handleSelect(viaje.id)}
                            className={`group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 ${
                                isSelected ? 'ring-4 ring-[#D6A75D]' : ''
                            }`}
                        >
                            {/* Imagen */}
                            <div className="relative h-48 overflow-hidden">
                                {viaje.imagen ? (
                                    <img
                                        src={viaje.imagen}
                                        alt={getLocalizedText(viaje.nombre, language)}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                        <FiMapPin className="text-gray-400" size={48} />
                                    </div>
                                )}
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                
                                {/* Nombre del destino */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-xl font-bold text-white">
                                        {getLocalizedText(viaje.nombre, language)}
                                    </h3>
                                </div>
                            </div>

                            {/* Contenido */}
                            <div className="p-4">
                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {getLocalizedText(viaje.descripcion, language)}
                                </p>

                                {/* Info */}
                                <div className="flex items-center justify-between mb-3">
                                    {viaje.duracion && (
                                        <div className="flex items-center gap-1 text-sm text-gray-500">
                                            <FiClock size={16} />
                                            <span>{viaje.duracion}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Botón */}
                                <div className="flex items-center justify-center gap-2 text-[#D6A75D] font-semibold group-hover:gap-3 transition-all">
                                    <span>{language === 'es' ? 'Seleccionar' : 'Select'}</span>
                                    <FiChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>

                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-3 right-3 bg-[#D6A75D] text-black px-3 py-1 rounded-full text-sm font-bold">
                                    ✓ {language === 'es' ? 'Seleccionado' : 'Selected'}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

