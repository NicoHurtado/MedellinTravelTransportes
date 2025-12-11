'use client';

import { useState, useEffect } from 'react';
import { ReservationFormData } from '@/types/reservation';
import { Municipio, Idioma, TipoServicio, AeropuertoTipo, AeropuertoNombre } from '@prisma/client';
import { calculateTotalPrice, isNightSurchargeApplicable, formatPrice, MUNICIPALITY_PRICES } from '@/lib/pricing';
import { FiAlertCircle, FiCheck, FiUsers, FiUser } from 'react-icons/fi';
import Image from 'next/image';
import DynamicFields from './DynamicFields';
import { DynamicFieldValues } from '@/types/dynamic-fields';
import { useLanguage, t } from '@/lib/i18n';
import { DateInput, TimeInput } from '@/components/ui';

interface Step1Props {
    service: any;
    formData: ReservationFormData;
    updateFormData: (updates: Partial<ReservationFormData>) => void;
    onNext: () => void;
    onBack: () => void;
    preciosPersonalizados?: any;
    tarifasMunicipios?: any[];
    aliadoTipo?: string | null;
    aliadoNombre?: string | null;
}

export default function Step1TripDetails({ service, formData, updateFormData, onNext, onBack, preciosPersonalizados, tarifasMunicipios, aliadoTipo, aliadoNombre }: Step1Props) {
    const { language } = useLanguage();
    const [showNightSurcharge, setShowNightSurcharge] = useState(false);
    const [dynamicPrice, setDynamicPrice] = useState(0);
    const [isLanguageOpen, setIsLanguageOpen] = useState(false);
    const [isMunicipalityOpen, setIsMunicipalityOpen] = useState(false);
    const [isAirportOpen, setIsAirportOpen] = useState(false);

    // 🔥 NEW: Use camposPersonalizados (JSONB) instead of configuracionFormulario
    const dynamicFields = service.camposPersonalizados || [];

    // 🏨 Check if this is a hotel reservation
    const isHotel = aliadoTipo === 'HOTEL';
    const hotelName = aliadoNombre || '';

    console.log('🔧 Dynamic Fields Debug:', {
        serviceId: service.id,
        serviceName: service.nombre,
        camposPersonalizados: service.camposPersonalizados,
        dynamicFields,
        dynamicFieldsLength: dynamicFields.length,
        hasCamposPersonalizados: !!service.camposPersonalizados
    });

    // Initialize datosDinamicos if not exists
    useEffect(() => {
        if (!formData.datosDinamicos && dynamicFields.length > 0) {
            const initialData: DynamicFieldValues = {};
            // Initialize with default values based on field type
            // The DynamicFieldRenderer will handle defaults
            updateFormData({ datosDinamicos: initialData });
        }
    }, [dynamicFields.length]);

    // 🏨 Auto-fill lugarRecogida for hotels
    useEffect(() => {
        if (isHotel && hotelName && formData.lugarRecogida !== hotelName) {
            updateFormData({ lugarRecogida: hotelName });
        }
    }, [isHotel, hotelName]);

    // Get available vehicles
    const availableVehicles = (() => {
        console.log('Debugging Vehicles:', {
            serviceId: service.id,
            hasCustomPricing: !!preciosPersonalizados,
            customPricingForService: preciosPersonalizados?.[service.id],
            customVehicles: preciosPersonalizados?.[service.id]?.preciosVehiculos,
            defaultVehicles: service.vehiculosPermitidos
        });

        // 1. Try custom pricing first
        if (preciosPersonalizados && preciosPersonalizados[service.id]?.preciosVehiculos?.length > 0) {
            return preciosPersonalizados[service.id].preciosVehiculos.map((pv: any) => ({
                ...pv.vehiculo,
                precio: pv.precio, // Custom price
                comision: pv.comision
            }));
        }
        // 2. Fallback to service allowed vehicles
        if (service.vehiculosPermitidos?.length > 0) {
            return service.vehiculosPermitidos.map((sv: any) => ({
                ...sv.vehiculo,
                precio: sv.precio // Default price
            }));
        }
        return [];
    })();

    // Show all available vehicles
    const validVehicles = availableVehicles;

    // Find recommended vehicle (smallest capacity that fits)
    const recommendedVehicle = formData.numeroPasajeros > 0
        ? availableVehicles
            .filter((v: any) => v.capacidadMaxima >= formData.numeroPasajeros)
            .sort((a: any, b: any) => a.capacidadMaxima - b.capacidadMaxima)[0]
        : null;

    // Auto-select recommended vehicle when passenger count changes
    // This ensures the smallest compatible vehicle is always selected
    useEffect(() => {
        if (recommendedVehicle && formData.numeroPasajeros > 0) {
            // Always update to recommended vehicle when passengers change
            updateFormData({ vehiculoId: recommendedVehicle.id });
        }
    }, [formData.numeroPasajeros, recommendedVehicle?.id]);




    // Calculate price whenever relevant fields change
    useEffect(() => {
        // Determine night surcharge configuration
        // Priority: hotel-specific config > service default
        let aplicaRecargo = service.aplicaRecargoNocturno;
        let montoRecargo = service.montoRecargoNocturno;
        let horaInicioRecargo = service.recargoNocturnoInicio;
        let horaFinRecargo = service.recargoNocturnoFin;

        // Check if hotel has override configuration
        const hotelConfig = preciosPersonalizados?.[service.id];

        console.log('🔍 Night Surcharge Debug:', {
            serviceId: service.id,
            serviceName: service.nombre,
            preciosPersonalizados,
            hotelConfig,
            sobrescribirRecargoNocturno: hotelConfig?.sobrescribirRecargoNocturno,
            aplicaRecargoNocturnoHotel: hotelConfig?.aplicaRecargoNocturno,
            aplicaRecargoNocturnoServicio: service.aplicaRecargoNocturno
        });

        if (hotelConfig?.sobrescribirRecargoNocturno) {
            console.log('✅ Using hotel override configuration');
            aplicaRecargo = hotelConfig.aplicaRecargoNocturno ?? false;
            montoRecargo = hotelConfig.montoRecargoNocturno;
            horaInicioRecargo = hotelConfig.recargoNocturnoInicio;
            horaFinRecargo = hotelConfig.recargoNocturnoFin;
        } else {
            console.log('⚠️ Using service default configuration');
        }

        const nightSurcharge = aplicaRecargo &&
            isNightSurchargeApplicable(formData.hora, horaInicioRecargo, horaFinRecargo)
            ? Number(montoRecargo || 0)
            : 0;

        console.log('💰 Final night surcharge:', nightSurcharge);
        setShowNightSurcharge(nightSurcharge > 0);

        // Calculate base price (custom or default)
        let basePrice = Number(service.precioBase);

        // Get vehicle price
        const selectedVehicle = availableVehicles.find((v: any) => v.id === formData.vehiculoId);
        const vehiclePrice = selectedVehicle ? Number(selectedVehicle.precio) : 0;

        // Apply custom vehicle price if available
        // Apply custom vehicle price if available
        // Logic removed: We rely on the selected vehicle's price (vehiclePrice) which comes from availableVehicles
        // availableVehicles already handles custom pricing in its definition above.

        // If a vehicle is selected, its price usually overrides the base service price
        if (vehiclePrice > 0) {
            basePrice = 0;
        }

        // Calculate municipality fee (custom or default)
        let municipalityFee = 0;

        if (tarifasMunicipios && tarifasMunicipios.length > 0) {
            const customTariff = tarifasMunicipios.find(t => t.municipio === formData.municipio);
            if (customTariff) {
                municipalityFee = Number(customTariff.valorExtra);
            }
        }

        // NO usar precioAdicionales aquí para evitar loop
        const pricing = calculateTotalPrice({
            basePrice: basePrice,
            vehiclePrice,
            municipality: formData.municipio as Municipio,
            nightSurcharge,
            additionals: 0, // Siempre 0 aquí, sumamos después
        });

        // Override municipality fee if we have a custom one (already calculated above, but ensuring it's in pricing)
        if (municipalityFee > 0) {
            pricing.municipalityFee = municipalityFee;
            // Recalculate total with custom municipality fee
            pricing.total = pricing.subtotal + pricing.municipalityFee + pricing.nightSurcharge - pricing.allyDiscount;
        }

        // Sumar precio dinámico al total
        const totalConDinamico = pricing.total + dynamicPrice;

        console.log('🔍 PRICING DEBUG:', {
            vehiclePrice,
            basePrice,
            'pricing.subtotal': pricing.subtotal,
            'pricing.total (sin dinámico)': pricing.total,
            dynamicPrice,
            totalConDinamico,
            'formData.numeroPasajeros': formData.numeroPasajeros
        });

        // Si es cotización manual (OTRO), no calcular precios
        if (formData.municipio === Municipio.OTRO) {
            updateFormData({
                precioBase: 0,
                recargoNocturno: 0,
                tarifaMunicipio: 0,
                precioAdicionales: dynamicPrice, // Solo el dinámico
                precioTotal: 0,
            });
            return;
        }

        updateFormData({
            precioBase: vehiclePrice > 0 ? vehiclePrice : Number(service.precioBase),
            recargoNocturno: nightSurcharge,
            tarifaMunicipio: pricing.municipalityFee,
            precioAdicionales: dynamicPrice, // Solo guardar el precio dinámico
            precioTotal: totalConDinamico,
        });
    }, [formData.hora, formData.municipio, dynamicPrice, formData.datosDinamicos, formData.vehiculoId, formData.numeroPasajeros, availableVehicles]); // Removido precioAdicionales de dependencias


    const isValid = () => {
        if (!formData.fecha || !formData.hora || !formData.municipio) {
            return false;
        }
        if (formData.municipio === Municipio.OTRO && !formData.otroMunicipio) {
            return false;
        }
        return formData.numeroPasajeros > 0;
    };

    const handleWhatsAppAssistance = () => {
        const message = encodeURIComponent(
            `Hola, necesito asistencia con el servicio: ${service.nombre}. Requiero múltiples recogidas o una petición personalizada.`
        );
        window.open(`https://wa.me/573175177409?text=${message}`, '_blank');
    };

    // Check if this is municipal transport
    const isTransporteMunicipal = service.tipo === 'TRANSPORTE_MUNICIPAL';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">{t('reservas.paso1_titulo', language)}</h2>
                <p className="text-gray-600">
                    {t('landing.paso2_titulo', language)}
                </p>
            </div>

            {/* 🚍 TRANSPORTE MUNICIPAL SECTION */}
            {isTransporteMunicipal && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                    <h3 className="font-bold text-lg text-green-900 flex items-center gap-2">
                        🚍 {language === 'es' ? 'Información del Viaje' : 'Trip Information'}
                    </h3>

                    {/* Destino (readonly - ya seleccionado) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'es' ? 'Destino' : 'Destination'}
                        </label>
                        <div className="px-4 py-3 bg-white border-2 border-green-300 rounded-lg font-semibold text-gray-900">
                            {service.destinoAutoFill || service.nombre}
                        </div>
                    </div>

                    {/* Dirección de Origen (texto libre) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {language === 'es' ? 'Dirección de Origen' : 'Origin Address'} *
                        </label>
                        <input
                            type="text"
                            value={formData.lugarRecogida || ''}
                            onChange={(e) => updateFormData({ lugarRecogida: e.target.value })}
                            placeholder={language === 'es' ? 'Ej: Calle 10 # 20-30, El Poblado' : 'Ex: Street 10 # 20-30, El Poblado'}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {language === 'es' 
                                ? 'Ingresa la dirección completa desde donde te recogeremos' 
                                : 'Enter the complete address where we will pick you up'}
                        </p>
                    </div>
                </div>
            )}

            {/* 🔥 AIRPORT SECTION - MOVED TO TOP */}
            {service.esAeropuerto && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                    <h3 className="font-bold text-lg text-blue-900 flex items-center gap-2">
                        ✈️ {t('reservas.paso1_aeropuerto_seccion', language)}
                    </h3>

                    {/* Direction Selection - Buttons */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            {t('reservas.paso1_aeropuerto_direccion', language)} *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => updateFormData({ aeropuertoTipo: AeropuertoTipo.DESDE })}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${formData.aeropuertoTipo === AeropuertoTipo.DESDE
                                    ? 'border-[#D6A75D] bg-[#D6A75D]/10 ring-2 ring-[#D6A75D]/50'
                                    : 'border-gray-300 hover:border-[#D6A75D]/50 bg-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.aeropuertoTipo === AeropuertoTipo.DESDE
                                        ? 'border-[#D6A75D] bg-[#D6A75D]'
                                        : 'border-gray-300'
                                        }`}>
                                        {formData.aeropuertoTipo === AeropuertoTipo.DESDE && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {t('reservas.paso1_aeropuerto_desde', language)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {language === 'es' ? 'Llegada de vuelo' : 'Flight arrival'}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => updateFormData({ aeropuertoTipo: AeropuertoTipo.HACIA })}
                                className={`p-4 rounded-lg border-2 transition-all text-left ${formData.aeropuertoTipo === AeropuertoTipo.HACIA
                                    ? 'border-[#D6A75D] bg-[#D6A75D]/10 ring-2 ring-[#D6A75D]/50'
                                    : 'border-gray-300 hover:border-[#D6A75D]/50 bg-white'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.aeropuertoTipo === AeropuertoTipo.HACIA
                                        ? 'border-[#D6A75D] bg-[#D6A75D]'
                                        : 'border-gray-300'
                                        }`}>
                                        {formData.aeropuertoTipo === AeropuertoTipo.HACIA && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            {t('reservas.paso1_aeropuerto_hacia', language)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {language === 'es' ? 'Salida de vuelo' : 'Flight departure'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Airport Selection */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('reservas.paso1_aeropuerto_seleccionar', language)} *
                        </label>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsAirportOpen(!isAirportOpen)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none bg-white text-left flex justify-between items-center"
                            >
                                <span className="text-gray-900">
                                    {t(`aeropuerto.${formData.aeropuertoNombre || AeropuertoNombre.JOSE_MARIA_CORDOVA}`, language)}
                                </span>
                                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isAirportOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isAirportOpen && (
                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateFormData({ aeropuertoNombre: AeropuertoNombre.JOSE_MARIA_CORDOVA });
                                            setIsAirportOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${formData.aeropuertoNombre === AeropuertoNombre.JOSE_MARIA_CORDOVA || !formData.aeropuertoNombre ? 'bg-gray-50 text-[#D6A75D] font-medium' : 'text-gray-700'}`}
                                    >
                                        {t('aeropuerto.JOSE_MARIA_CORDOVA', language)}
                                        {(formData.aeropuertoNombre === AeropuertoNombre.JOSE_MARIA_CORDOVA || !formData.aeropuertoNombre) && <FiCheck />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            updateFormData({ aeropuertoNombre: AeropuertoNombre.OLAYA_HERRERA });
                                            setIsAirportOpen(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${formData.aeropuertoNombre === AeropuertoNombre.OLAYA_HERRERA ? 'bg-gray-50 text-[#D6A75D] font-medium' : 'text-gray-700'}`}
                                    >
                                        {t('aeropuerto.OLAYA_HERRERA', language)}
                                        {formData.aeropuertoNombre === AeropuertoNombre.OLAYA_HERRERA && <FiCheck />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Origin/Destination - Auto-filled based on direction */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Origin */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('reservas.paso1_origen', language)} *
                            </label>
                            {formData.aeropuertoTipo === AeropuertoTipo.DESDE ? (
                                <input
                                    type="text"
                                    value={t(`aeropuerto.${formData.aeropuertoNombre || AeropuertoNombre.JOSE_MARIA_CORDOVA}`, language)}
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                                />
                            ) : isHotel ? (
                                <input
                                    type="text"
                                    value={hotelName}
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={formData.lugarRecogida || ''}
                                    onChange={(e) => updateFormData({ lugarRecogida: e.target.value })}
                                    placeholder={language === 'es' ? 'Ej: Hotel Dann Carlton, Parque Lleras' : 'E.g.: Dann Carlton Hotel, Lleras Park'}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                />
                            )}
                        </div>

                        {/* Destination */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                {t('reservas.paso1_destino', language)} *
                            </label>
                            {formData.aeropuertoTipo === AeropuertoTipo.HACIA ? (
                                <input
                                    type="text"
                                    value={t(`aeropuerto.${formData.aeropuertoNombre || AeropuertoNombre.JOSE_MARIA_CORDOVA}`, language)}
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                                />
                            ) : isHotel ? (
                                <input
                                    type="text"
                                    value={hotelName}
                                    readOnly
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={formData.lugarRecogida || ''}
                                    onChange={(e) => updateFormData({ lugarRecogida: e.target.value })}
                                    placeholder={language === 'es' ? 'Ej: Hotel Dann Carlton, Parque Lleras' : 'E.g.: Dann Carlton Hotel, Lleras Park'}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                />
                            )}
                        </div>
                    </div>

                    {/* Flight Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('reservas.paso1_numero_vuelo', language)}
                        </label>
                        <input
                            type="text"
                            value={formData.numeroVuelo || ''}
                            onChange={(e) => updateFormData({ numeroVuelo: e.target.value })}
                            placeholder="Ej: AV123"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Origen fijo para hoteles en servicios NO aeropuerto */}
                {!service.esAeropuerto && !isTransporteMunicipal && isHotel && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reservas.paso1_origen', language)} *
                        </label>
                        <input
                            type="text"
                            value={hotelName}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                        />
                    </div>
                )}

                {/* Destino (Auto-fill or Select) - Only show if NOT airport service AND NOT municipal transport */}
                {service.destinoAutoFill && !service.esAeropuerto && !isTransporteMunicipal ? (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {language === 'es' ? 'Destino' : 'Destination'}
                        </label>
                        <input
                            type="text"
                            value={service.destinoAutoFill}
                            readOnly
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed outline-none"
                        />
                    </div>
                ) : null}

                {/* Lugar de Recogida - Only show if NOT airport service AND NOT hotel AND NOT municipal transport */}
                {!service.esAeropuerto && !isHotel && !isTransporteMunicipal && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reservas.paso1_lugar_recogida', language)} *
                        </label>
                        <input
                            type="text"
                            value={formData.lugarRecogida || ''}
                            onChange={(e) => updateFormData({ lugarRecogida: e.target.value })}
                            placeholder="Ej: Hotel Dann Carlton, Parque Lleras, etc."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        />
                    </div>
                )}

                {/* Municipio */}
                <div className="md:col-span-2 relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {language === 'es' ? 'Municipio donde estás ubicado' : 'Municipality where you are located'} *
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsMunicipalityOpen(!isMunicipalityOpen)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none bg-white text-left flex justify-between items-center"
                        >
                            <span className={formData.municipio ? 'text-gray-900' : 'text-gray-500'}>
                                {formData.municipio ? (() => {
                                    const names: Record<string, string> = {
                                        [Municipio.MEDELLIN]: 'Medellín',
                                        [Municipio.POBLADO]: 'El Poblado',
                                        [Municipio.LAURELES]: 'Laureles',
                                        [Municipio.SABANETA]: 'Sabaneta',
                                        [Municipio.BELLO]: 'Bello',
                                        [Municipio.ITAGUI]: 'Itagüí',
                                        [Municipio.ENVIGADO]: 'Envigado',
                                        [Municipio.OTRO]: 'Otro'
                                    };
                                    return names[formData.municipio] || formData.municipio;
                                })() : 'Seleccionar...'}
                            </span>
                            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isMunicipalityOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isMunicipalityOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                {[
                                    Municipio.MEDELLIN,
                                    Municipio.ENVIGADO,
                                    Municipio.SABANETA,
                                    Municipio.ITAGUI,
                                    Municipio.BELLO,
                                    Municipio.OTRO
                                ].map((m) => {
                                    const names: Record<string, string> = {
                                        [Municipio.MEDELLIN]: 'Medellín',
                                        [Municipio.POBLADO]: 'El Poblado',
                                        [Municipio.LAURELES]: 'Laureles',
                                        [Municipio.SABANETA]: 'Sabaneta',
                                        [Municipio.BELLO]: 'Bello',
                                        [Municipio.ITAGUI]: 'Itagüí',
                                        [Municipio.ENVIGADO]: 'Envigado',
                                        [Municipio.OTRO]: 'Otro'
                                    };

                                    const isSelected = formData.municipio === m;

                                    return (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => {
                                                updateFormData({ municipio: m as Municipio });
                                                setIsMunicipalityOpen(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${isSelected ? 'bg-gray-50 text-[#D6A75D] font-medium' : 'text-gray-700'}`}
                                        >
                                            <span>
                                                {names[m]}
                                                {m === Municipio.OTRO && ` (${t('reservas.paso1_requiere_cotizacion', language)})`}
                                            </span>
                                            {isSelected && <FiCheck />}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Other Municipality */}
                {formData.municipio === Municipio.OTRO && (
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('reservas.paso1_municipio', language)} (Especificar) *
                        </label>
                        <input
                            type="text"
                            value={formData.otroMunicipio || ''}
                            onChange={(e) => updateFormData({ otroMunicipio: e.target.value })}
                            placeholder="Ej: Rionegro, Guatapé, etc."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        />
                    </div>
                )}
                {/* Language */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reservas.paso1_idioma', language)} *
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none bg-white text-left flex justify-between items-center"
                        >
                            <span className="text-gray-900">
                                {formData.idioma === Idioma.ES ? 'Español' : 'English'}
                            </span>
                            <svg className={`w-4 h-4 text-gray-500 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isLanguageOpen && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => { updateFormData({ idioma: Idioma.ES }); setIsLanguageOpen(false); }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${formData.idioma === Idioma.ES ? 'bg-gray-50 text-[#D6A75D] font-medium' : 'text-gray-700'}`}
                                >
                                    Español
                                    {formData.idioma === Idioma.ES && <FiCheck />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { updateFormData({ idioma: Idioma.EN }); setIsLanguageOpen(false); }}
                                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between ${formData.idioma === Idioma.EN ? 'bg-gray-50 text-[#D6A75D] font-medium' : 'text-gray-700'}`}
                                >
                                    English
                                    {formData.idioma === Idioma.EN && <FiCheck />}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('tracking.fecha', language)} *
                    </label>
                    <DateInput
                        value={formData.fecha ? formData.fecha.toISOString().split('T')[0] : ''}
                        onChange={(value) => {
                            if (value) {
                                const [year, month, day] = value.split('-').map(Number);
                                updateFormData({ fecha: new Date(Date.UTC(year, month - 1, day, 12, 0, 0)) });
                            } else {
                                updateFormData({ fecha: null });
                            }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        required
                    />
                </div>

                {/* Time */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('tracking.hora', language)} *
                    </label>
                    <TimeInput
                        value={formData.hora}
                        onChange={(value) => updateFormData({ hora: value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        required
                    />
                    {showNightSurcharge && (
                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <FiAlertCircle /> +{formatPrice(formData.recargoNocturno)} {t('reservas.paso4_recargo', language)}
                        </p>
                    )}
                </div>



                {/* Passengers */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reservas.paso1_pasajeros', language)} *
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="15"
                        value={formData.numeroPasajeros === 0 ? '' : formData.numeroPasajeros}
                        onChange={(e) => {
                            const val = e.target.value;
                            updateFormData({ numeroPasajeros: val === '' ? 0 : parseInt(val) });
                        }}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                    />
                </div>

                {/* Vehicle Selection */}
                <div className="md:col-span-2 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        {t('reservas.paso1_vehiculo', language)} *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {availableVehicles.map((vehiculo: any) => {
                            const isSelected = formData.vehiculoId === vehiculo.id;
                            const isRecommended = recommendedVehicle?.id === vehiculo.id;
                            const isCapacityCompatible = vehiculo.capacidadMaxima >= formData.numeroPasajeros;

                            return (
                                <div
                                    key={vehiculo.id}
                                    onClick={() => updateFormData({ vehiculoId: vehiculo.id })}
                                    className={`relative border rounded-xl p-4 cursor-pointer transition-all ${isSelected
                                        ? 'border-[#D6A75D] bg-[#D6A75D]/5 ring-1 ring-[#D6A75D]'
                                        : 'border-gray-200 hover:border-[#D6A75D]/50 hover:shadow-md'
                                        } ${!isCapacityCompatible && formData.numeroPasajeros > 0 ? 'opacity-60' : ''}`}
                                >
                                    {isRecommended && (
                                        <div className="absolute -top-3 left-4 bg-[#D6A75D] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
                                            {t('reservas.recomendado', language)}
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            {vehiculo.imagen ? (
                                                <Image
                                                    src={vehiculo.imagen}
                                                    alt={vehiculo.nombre}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <FiUser size={24} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{vehiculo.nombre}</h4>
                                                {isSelected && <FiCheck className="text-[#D6A75D] flex-shrink-0" />}
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                <FiUsers size={12} />
                                                <span className={!isCapacityCompatible && formData.numeroPasajeros > 0 ? 'text-red-500 font-medium' : ''}>
                                                    {vehiculo.capacidadMinima}-{vehiculo.capacidadMaxima} {t('comunes.personas', language)}
                                                </span>
                                            </div>
                                            <p className="text-[#D6A75D] font-bold mt-2">
                                                ${Number(vehiculo.precio).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {availableVehicles.length === 0 && (
                        <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg flex items-center gap-2">
                            <FiAlertCircle /> {t('reservas.no_vehiculos', language)}
                        </p>
                    )}
                </div>
            </div>

            {/* 🔥 NEW: Dynamic Fields with updated interface */}
            {dynamicFields.length > 0 && (
                <DynamicFields
                    fields={dynamicFields}
                    values={formData.datosDinamicos || {}}
                    onChange={(values) => updateFormData({ datosDinamicos: values })}
                    onPriceChange={setDynamicPrice}
                    language={formData.idioma}
                />
            )}

            {/* Price Calculator Removed - Moved to Footer */}

            {formData.municipio === Municipio.OTRO && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>{t('reservas.paso1_requiere_cotizacion', language)}</strong><br />
                        {language === 'es' ? `Te contactaremos pronto con el precio para ${formData.otroMunicipio}` : `We will contact you soon with the price for ${formData.otroMunicipio}`}
                    </p>
                </div>
            )}

            {/* WhatsApp Assistance */}
            <button
                type="button"
                onClick={handleWhatsAppAssistance}
                className="text-sm text-gray-600 hover:text-[#D6A75D] underline"
            >
                {t('reservas.paso1_asistencia', language)}
            </button>
        </div>
    );
}
