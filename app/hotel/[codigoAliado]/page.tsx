'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FiClock, FiUsers, FiAlertCircle } from 'react-icons/fi';
import ReservationWizard from '@/components/reservas/ReservationWizard';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import { useLanguage, t } from '@/lib/i18n';
import { getLocalizedText, getLocalizedArray } from '@/types/multi-language';

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

    // Custom pricing state
    const [preciosPersonalizados, setPreciosPersonalizados] = useState<any>(null);
    const [tarifasMunicipios, setTarifasMunicipios] = useState<any[]>([]);

    useEffect(() => {
        if (codigoAliado) {
            validateAliado(codigoAliado as string);
        }
    }, [codigoAliado]);

    const validateAliado = async (codigo: string) => {
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

            // Validate that this is a HOTEL
            if (aliadoData.tipo !== 'HOTEL') {
                throw new Error('Este enlace solo está disponible para hoteles');
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
    };

    const fetchAliadoConfig = async (aliadoId: string) => {
        try {
            // Fetch custom pricing
            const resServicios = await fetch(`/api/aliados/${aliadoId}/servicios`, { cache: 'no-store' });
            const dataServicios = await resServicios.json();

            // Build pricing map
            const pricingMap: any = {};
            (dataServicios.data || []).forEach((sa: any) => {
                pricingMap[sa.servicioId] = {
                    preciosVehiculos: sa.preciosVehiculos || []
                };
            });
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
            setServices(activeServices);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const openWizard = (service: Service) => {
        setSelectedService(service);
        setWizardOpen(true);
    };

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
            <Header />
            <main className="min-h-screen pt-24 pb-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    {/* Hotel Header */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm mb-12 text-center border-b-4 border-[#D6A75D]">
                        <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">Servicios de Transporte</p>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                            {aliado?.nombre}
                        </h1>
                        <p className="text-gray-600">
                            Servicios exclusivos para nuestros huéspedes
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Pago en efectivo al recibir el servicio
                        </div>
                    </div>

                    {/* Services Catalog */}
                    {services.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No hay servicios disponibles en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((service) => (
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
                        </div>
                    )}
                </div>
            </main>
            <Footer />

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
                    preciosPersonalizados={preciosPersonalizados}
                    tarifasMunicipios={tarifasMunicipios}
                    metodoPago="EFECTIVO"
                />
            )}
        </>
    );
}
