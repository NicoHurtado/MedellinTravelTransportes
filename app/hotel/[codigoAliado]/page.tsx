'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiUsers, FiAlertCircle, FiMapPin, FiChevronRight } from 'react-icons/fi';
import ReservationWizard from '@/components/reservas/ReservationWizard';
import TransporteMunicipalModal from '@/components/reservas/TransporteMunicipalModal';
import AllyHeader from '@/components/landing/AllyHeader';
import AllyFooter from '@/components/landing/AllyFooter';
import { CartIcon } from '@/components/carrito/CartIcon';
import { CartModal } from '@/components/carrito/CartModal';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useLanguage, t } from '@/lib/i18n';
import { getLocalizedText, getLocalizedArray } from '@/types/multi-language';
import { sortServicesByPriority } from '@/lib/service-order';

interface Service {
    id: string;
    nombre: string;
    tipo: string;
    descripcion: string;
    imagen: string;
    duracion: string | null;
    incluye: string[];
    precioBase: number;
    aplicaRecargoNocturno: boolean;
    recargoNocturnoInicio: string | null;
    recargoNocturnoFin: string | null;
    montoRecargoNocturno: number | null;
    esAeropuerto: boolean;
    esPorHoras: boolean;
    destinoAutoFill: string | null;
    camposPersonalizados: any[];
    adicionales: any[];
    vehiculosPermitidos?: any[];
    tarifasMunicipios?: any[];
}

interface Aliado {
    id: string;
    nombre: string;
    codigo: string;
    tipo: string;
}

export default function HotelPublicPage() {
    const { codigoAliado } = useParams();
    const router = useRouter();
    const { language } = useLanguage();

    const [aliado, setAliado] = useState<Aliado | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [municipalModalOpen, setMunicipalModalOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Custom pricing state
    const [preciosPersonalizados, setPreciosPersonalizados] = useState<any>(null);
    const [tarifasMunicipios, setTarifasMunicipios] = useState<any[]>([]);

    const validateAliado = useCallback(async (codigo: string) => {
        try {
            // 1. Validate Ally
            const res = await fetch('/api/public/aliados/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Código de aliado inválido');
            }

            const aliadoData = data.data;

            // Validate that this is a HOTEL or AGENCIA
            if (aliadoData.tipo !== 'HOTEL' && aliadoData.tipo !== 'AGENCIA') {
                throw new Error('Este enlace solo está disponible para hoteles y agencias');
            }

            setAliado(aliadoData);

            // 2. Load Configuration & Services
            await Promise.all([
                fetchAliadoConfig(aliadoData.id),
                fetchServices(aliadoData.id)
            ]);

        } catch (err: any) {
            console.error('Error validating aliado:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (codigoAliado) {
            validateAliado(codigoAliado as string);
        }
    }, [codigoAliado, validateAliado]);

    const fetchAliadoConfig = async (aliadoId: string) => {
        try {
            // Fetch custom pricing
            const resServicios = await fetch(`/api/aliados/${aliadoId}/servicios`, { cache: 'no-store' });
            const dataServicios = await resServicios.json();

            console.log('📡 API Response from /api/aliados/servicios:', dataServicios);

            // Build pricing map with vehicle prices and night surcharge config
            const pricingMap: any = {};
            (dataServicios.data || []).forEach((sa: any) => {
                console.log(`🔧 Processing service ${sa.servicioId}:`, {
                    sobrescribirRecargoNocturno: sa.sobrescribirRecargoNocturno,
                    aplicaRecargoNocturno: sa.aplicaRecargoNocturno
                });

                pricingMap[sa.servicioId] = {
                    preciosVehiculos: sa.preciosVehiculos || [],
                    // Night surcharge override configuration
                    sobrescribirRecargoNocturno: sa.sobrescribirRecargoNocturno,
                    aplicaRecargoNocturno: sa.aplicaRecargoNocturno,
                    recargoNocturnoInicio: sa.recargoNocturnoInicio,
                    recargoNocturnoFin: sa.recargoNocturnoFin,
                    montoRecargoNocturno: sa.montoRecargoNocturno
                };
            });

            console.log('🗺️ Final pricing map:', pricingMap);
            setPreciosPersonalizados(pricingMap);

            // Fetch municipality surcharges
            const resTarifas = await fetch(`/api/aliados/${aliadoId}/tarifas-municipios`);
            const dataTarifas = await resTarifas.json();
            setTarifasMunicipios(dataTarifas.data || []);
        } catch (error) {
            console.error('Error loading aliado config:', error);
        }
    };

    const fetchServices = async (aliadoId: string) => {
        try {
            const res = await fetch(`/api/aliados/${aliadoId}/servicios`, { cache: 'no-store' });
            const data = await res.json();

            if (!data.success) {
                console.error('API Error:', data.error);
                return;
            }

            // Filter only active services and map to Service format
            const activeServices = (data.data || [])
                .filter((sa: any) => sa.activo)
                .map((sa: any) => ({
                    ...sa.servicio,
                    vehiculosPermitidos: sa.servicio.vehiculosPermitidos
                }));

            // Sort services using custom priority order
            const sortedServices = sortServicesByPriority(activeServices) as Service[];
            setServices(sortedServices);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const openWizard = (service: Service) => {
        setSelectedService(service);
        setWizardOpen(true);
    };

    const handleSelectMunicipalService = async (serviceId: string) => {
        try {
            const res = await fetch(`/api/servicios/${serviceId}`);
            const data = await res.json();

            if (data.success) {
                openWizard(data.data);
            }
        } catch (error) {
            console.error('Error loading service:', error);
        }
    };

    // Separate municipal and regular services
    const serviciosMunicipales = services.filter(s => s.tipo === 'TRANSPORTE_MUNICIPAL');
    const serviciosRegulares = services.filter(s => s.tipo !== 'TRANSPORTE_MUNICIPAL');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Enlace no válido</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#D6A75D] text-black font-bold py-3 px-6 rounded-lg hover:bg-[#C5964A] transition-colors w-full"
                    >
                        Ir al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <AllyHeader allyName={aliado?.nombre || ''} allyType={aliado?.tipo}>
                <LanguageSwitcher />
                <CartIcon onClick={() => setIsCartOpen(true)} />
            </AllyHeader>
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    {/* Hotel Header */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm mb-12 text-center border-b-4 border-[#D6A75D]">
                        <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">{t('hotel.servicios_transporte', language)}</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            {aliado?.nombre}
                        </h1>
                        <p className="text-gray-600">
                            {t('hotel.servicios_exclusivos', language)}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {t('hotel.pago_efectivo', language)}
                        </div>
                    </div>

                    {/* Services Catalog */}
                    {services.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">{t('hotel.no_servicios', language)}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Servicios Prioritarios (Priority 1-8) */}
                            {serviciosRegulares
                                .map((service) => (
                                    <div
                                        key={service.id}
                                        className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                        onClick={() => openWizard(service)}
                                    >
                                        <div className="relative h-56 overflow-hidden">
                                            <Image
                                                src={service.imagen || '/medellin.jpg'}
                                                alt={getLocalizedText(service.nombre, language)}
                                                fill
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        </div>

                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-3 group-hover:text-[#D6A75D] transition-colors">
                                                {getLocalizedText(service.nombre, language)}
                                            </h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                {getLocalizedText(service.descripcion, language)}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                                {service.duracion && (
                                                    <div className="flex items-center gap-1">
                                                        <FiClock className="text-[#D6A75D]" />
                                                        <span>{service.duracion}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <FiUsers className="text-[#D6A75D]" />
                                                    <span>{t('landing.privado', language)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end">
                                                <button className="bg-gray-100 hover:bg-[#D6A75D] text-gray-800 hover:text-black font-bold py-2 px-4 rounded-lg transition-colors">
                                                    {t('header.reservar', language)}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Tarjeta Transporte Municipal - DESPUÉS DE SERVICIOS PRIORITARIOS */}
                            {serviciosMunicipales.length > 0 && (
                                <div
                                    className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                                    onClick={() => setMunicipalModalOpen(true)}
                                >
                                    <div className="relative h-56 overflow-hidden">
                                        <Image
                                            src="/antioquia.jpg"
                                            alt={t('header.transporteMunicipal', language)}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold mb-3 group-hover:text-[#D6A75D] transition-colors">
                                            {t('header.transporteMunicipal', language)}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {`${serviciosMunicipales.length} ${t('hotel.destinos_disponibles', language)}`}
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <FiMapPin className="text-[#D6A75D]" />
                                                <span>{t('hotel.multiples_destinos', language)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FiUsers className="text-[#D6A75D]" />
                                                <span>{t('landing.privado', language)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end">
                                            <button className="bg-gray-100 hover:bg-[#D6A75D] text-gray-800 hover:text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2">
                                                {t('hotel.ver_destinos', language)}
                                                <FiChevronRight />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <AllyFooter />

            {/* Cart Modal */}
            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
            />

            {/* Modal Transporte Municipal */}
            <TransporteMunicipalModal
                isOpen={municipalModalOpen}
                onClose={() => setMunicipalModalOpen(false)}
                onSelectService={handleSelectMunicipalService}
                serviciosMunicipales={serviciosMunicipales}
            />

            {/* Reservation Wizard Modal - CASH PAYMENT */}
            {selectedService && (
                <ReservationWizard
                    service={selectedService}
                    isOpen={wizardOpen}
                    onClose={() => {
                        setWizardOpen(false);
                        setSelectedService(null);
                    }}
                    aliadoId={aliado?.id || null}
                    aliadoTipo={aliado?.tipo || null}
                    aliadoNombre={aliado?.nombre || null}
                    preciosPersonalizados={preciosPersonalizados}
                    tarifasMunicipios={tarifasMunicipios}
                />
            )}
        </>
    );
}
