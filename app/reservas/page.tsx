'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiClock, FiUsers, FiLogOut } from 'react-icons/fi';
import ReservationWizard from '@/components/reservas/ReservationWizard';
import Header from '@/components/landing/Header';
import Footer from '@/components/landing/Footer';
import AllyReservationsModal from '@/components/reservas/AllyReservationsModal';
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
}

export default function ReservasPage() {
    const { language } = useLanguage();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [wizardOpen, setWizardOpen] = useState(false);

    // Ally state
    const [aliado, setAliado] = useState<Aliado | null>(null);
    const [aliadoCode, setAliadoCode] = useState('');
    const [aliadoError, setAliadoError] = useState('');
    const [aliadoLoading, setAliadoLoading] = useState(false);
    const [showAliadoForm, setShowAliadoForm] = useState(false);
    const [showReservationsModal, setShowReservationsModal] = useState(false);

    // Custom pricing state
    const [preciosPersonalizados, setPreciosPersonalizados] = useState<any>(null);
    const [tarifasMunicipios, setTarifasMunicipios] = useState<any[]>([]);

    useEffect(() => {
        // Check if ally is already logged in
        const storedAliado = localStorage.getItem('aliado');
        if (storedAliado) {
            try {
                const parsedAliado = JSON.parse(storedAliado);
                setAliado(parsedAliado);
                fetchAliadoConfig(parsedAliado.id);
                fetchServices(parsedAliado.id);
            } catch (e) {
                localStorage.removeItem('aliado');
                fetchServices();
            }
        } else {
            fetchServices();
        }
    }, []);

    const fetchServices = async (aliadoId?: string) => {
        try {
            let url = '/api/servicios';

            // If aliado is logged in, fetch only their active services
            if (aliadoId) {
                url = `/api/aliados/${aliadoId}/servicios`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (aliadoId) {
                // Filter only active services and map to Service format
                const activeServices = (data.data || [])
                    .filter((sa: any) => sa.activo)
                    .map((sa: any) => {
                        console.log(`[Aliado] Service ${sa.servicio.nombre} vehicles:`, sa.servicio.vehiculosPermitidos);
                        return {
                            ...sa.servicio,
                            vehiculosPermitidos: sa.servicio.vehiculosPermitidos
                        };
                    });
                setServices(activeServices);
            } else {
                console.log('[Public] Services data:', data.data);
                if (data.data && data.data.length > 0) {
                    console.log('[Public] First service vehicles:', data.data[0].vehiculosPermitidos);
                }
                setServices(data.data || []);
            }
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAliadoConfig = async (aliadoId: string) => {
        try {
            // Fetch custom pricing
            const resServicios = await fetch(`/api/aliados/${aliadoId}/servicios`);
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

    const handleAliadoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAliadoLoading(true);
        setAliadoError('');

        try {
            const res = await fetch('/api/public/aliados/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo: aliadoCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || t('reservas.codigo_invalido', language));
            }

            localStorage.setItem('aliado', JSON.stringify(data.data));
            setAliado(data.data);
            setAliadoCode('');

            // Fetch aliado configuration and services
            await fetchAliadoConfig(data.data.id);
            await fetchServices(data.data.id);
        } catch (error: any) {
            setAliadoError(error.message);
        } finally {
            setAliadoLoading(false);
        }
    };

    const handleAliadoLogout = () => {
        localStorage.removeItem('aliado');
        setAliado(null);
        setPreciosPersonalizados(null);
        setTarifasMunicipios([]);
        fetchServices(); // Reload all services
    };

    const openWizard = (service: Service) => {
        setSelectedService(service);
        setWizardOpen(true);
    };

    return (
        <>
            <Header />
            <main className="min-h-screen pt-32 pb-16">
                <div className="container mx-auto px-4">
                    {/* Page Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            {t('reservas.titulo', language)}
                        </h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            {t('reservas.subtitulo', language)}
                        </p>
                    </div>

                    {/* Ally Access Section */}
                    {!aliado ? (
                        <div className="max-w-md mx-auto mb-12">
                            {/* Subtle toggle button */}
                            {!showAliadoForm && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowAliadoForm(true)}
                                        className="text-sm text-gray-500 hover:text-[#D6A75D] transition-colors underline decoration-dotted"
                                    >
                                        {t('header.soyAliado', language)}
                                    </button>
                                </div>
                            )}

                            {/* Form appears when toggled */}
                            {showAliadoForm && (
                                <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg">
                                            {t('reservas.aliado_pregunta', language)}
                                        </h3>
                                        <button
                                            onClick={() => {
                                                setShowAliadoForm(false);
                                                setAliadoCode('');
                                                setAliadoError('');
                                            }}
                                            className="text-gray-400 hover:text-gray-600 text-xl"
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        {t('reservas.aliado_instruccion', language)}
                                    </p>
                                    <form onSubmit={handleAliadoLogin} className="space-y-3">
                                        <input
                                            type="text"
                                            value={aliadoCode}
                                            onChange={(e) => setAliadoCode(e.target.value.toUpperCase())}
                                            placeholder={t('reservas.codigo_placeholder', language)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none text-center tracking-widest uppercase"
                                            maxLength={6}
                                            required
                                        />
                                        {aliadoError && (
                                            <p className="text-sm text-red-600">{aliadoError}</p>
                                        )}
                                        <button
                                            type="submit"
                                            disabled={aliadoLoading || aliadoCode.length < 3}
                                            className="w-full bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50"
                                        >
                                            {aliadoLoading ? t('landing.validando', language) : t('landing.acceder', language)}
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto mb-12 p-6 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">{t('reservas.conectado_como', language)}</p>
                                    <p className="font-bold text-lg">{aliado.nombre}</p>
                                    <p className="text-sm text-gray-500">{t('landing.aliado_codigo', language)}: {aliado.codigo}</p>
                                </div>
                                <button
                                    onClick={handleAliadoLogout}
                                    className="text-red-600 hover:text-red-700 flex items-center gap-2 text-sm"
                                >
                                    <FiLogOut /> {t('reservas.salir', language)}
                                </button>
                            </div>

                            {/* View Reservations Button */}
                            <button
                                onClick={() => window.open(`/reservas/mis-reservas?aliadoId=${aliado.id}`, '_blank')}
                                className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <FiClock />
                                {t('reservas.mis_reservas_ver', language)}
                            </button>
                        </div>
                    )}

                    {/* Services Catalog */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white rounded-xl h-96 animate-pulse shadow-sm"></div>
                            ))}
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

                                        <div className="flex items-center justify-between">
                                            {!aliado && (
                                                <div>
                                                    <p className="text-sm text-gray-500">{t('reservas.desde', language)}</p>
                                                    <p className="text-2xl font-bold text-[#D6A75D]">
                                                        ${Number(service.precioBase).toLocaleString('es-CO')}
                                                    </p>
                                                </div>
                                            )}
                                            <button className={`${aliado ? 'w-full' : ''} bg-gray-100 hover:bg-[#D6A75D] text-gray-800 hover:text-black font-bold py-2 px-4 rounded-lg transition-colors`}>
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

            {/* Reservation Wizard Modal */}
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
                    tarifasMunicipios={aliado ? tarifasMunicipios : selectedService.tarifasMunicipios}
                />
            )}

            {/* Ally Reservations Modal */}
            {aliado && (
                <AllyReservationsModal
                    isOpen={showReservationsModal}
                    onClose={() => setShowReservationsModal(false)}
                    aliadoId={aliado.id}
                />
            )}
        </>
    );
}
