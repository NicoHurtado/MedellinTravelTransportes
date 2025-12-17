'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX, FiAlertCircle } from 'react-icons/fi';
import Step0ServiceInfo from './wizard/Step0ServiceInfo';
import Step1TripDetails from './wizard/Step1TripDetails';
import Step2ContactInfo from './wizard/Step2ContactInfo';
import Step3Notes from './wizard/Step3Notes';
import Step4Summary from './wizard/Step4Summary';
import Step5Confirmation from './wizard/Step5Confirmation';
import { ReservationFormData } from '@/types/reservation';
import { Idioma, Municipio, TipoDocumento, AeropuertoNombre } from '@prisma/client';
import { getLocalizedText, getLocalizedArray } from '@/types/multi-language';
import { useLanguage, t } from '@/lib/i18n';
import { formatPrice } from '@/lib/pricing';

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

interface ReservationWizardProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
    aliadoId?: string | null;
    aliadoTipo?: string | null;
    aliadoNombre?: string | null;
    preciosPersonalizados?: any;
    tarifasMunicipios?: any[];
    metodoPago?: 'BOLD' | 'EFECTIVO';
}

export default function ReservationWizard({ service, isOpen, onClose, aliadoId, aliadoTipo, aliadoNombre, preciosPersonalizados, tarifasMunicipios, metodoPago = 'BOLD' }: ReservationWizardProps) {
    const { language } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [formData, setFormData] = useState<ReservationFormData>({
        idioma: language.toUpperCase() === 'EN' ? Idioma.EN : Idioma.ES,
        fecha: null,
        hora: '',
        municipio: '',
        numeroPasajeros: 0,
        nombreCliente: '',
        whatsappCliente: '',
        emailCliente: '',
        asistentes: [{ nombre: '', tipoDocumento: TipoDocumento.CC, numeroDocumento: '' }],
        precioBase: Number(service.precioBase),
        precioAdicionales: 0,
        recargoNocturno: 0,
        tarifaMunicipio: 0,
        descuentoAliado: 0,
        precioTotal: Number(service.precioBase),
        datosDinamicos: {},
        aeropuertoNombre: AeropuertoNombre.JOSE_MARIA_CORDOVA, // Default airport
        cantidadHoras: service.esPorHoras ? 4 : undefined, // Default 4 hours for hourly services
    });
    const [reservationCode, setReservationCode] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Update language in form data when context changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, idioma: language.toUpperCase() === 'EN' ? Idioma.EN : Idioma.ES }));
    }, [language]);

    // Process service data to get localized text
    const processedService = {
        ...service,
        nombre: getLocalizedText(service.nombre, language),
        descripcion: getLocalizedText(service.descripcion, language),
        incluye: getLocalizedArray(service.incluye, language),
    };

    if (!isOpen) return null;

    // Helper function to show error
    const showError = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 5000); // Auto-hide after 5 seconds
    };

    const validateStep = (step: number): boolean => {
        // Step 0: Service Info - Always valid (just informational)
        if (step === 0) return true;

        // Step 1: Trip Details
        if (step === 1) {
            // Required: fecha, hora, municipio, numeroPasajeros, vehiculoId
            if (!formData.fecha || !formData.hora || !formData.municipio) {
                showError(language === 'es' ? 'Por favor completa todos los campos obligatorios' : 'Please complete all required fields');
                return false;
            }

            // If municipio is OTRO, otroMunicipio is required
            if (formData.municipio === Municipio.OTRO && !formData.otroMunicipio) {
                showError(language === 'es' ? 'Por favor especifica el municipio' : 'Please specify the municipality');
                return false;
            }

            // Number of passengers must be greater than 0
            if (formData.numeroPasajeros <= 0) {
                showError(language === 'es' ? 'Por favor ingresa el número de pasajeros' : 'Please enter the number of passengers');
                return false;
            }

            // Vehicle must be selected
            if (!formData.vehiculoId) {
                showError(language === 'es' ? 'Por favor selecciona un vehículo' : 'Please select a vehicle');
                return false;
            }

            // For hourly services, validate hours
            if (service.esPorHoras) {
                if (!formData.cantidadHoras || formData.cantidadHoras < 4) {
                    showError(language === 'es' ? 'Por favor ingresa una cantidad válida de horas (mínimo 4)' : 'Please enter a valid number of hours (minimum 4)');
                    return false;
                }
            }

            // For airport services, additional validations
            if (service.esAeropuerto) {
                if (!formData.aeropuertoTipo) {
                    showError(language === 'es' ? 'Por favor selecciona la dirección del aeropuerto' : 'Please select airport direction');
                    return false;
                }
                if (!formData.lugarRecogida) {
                    showError(language === 'es' ? 'Por favor ingresa el lugar de recogida/destino' : 'Please enter pickup/destination location');
                    return false;
                }
                // Número de vuelo es opcional para hoteles, pero requerido para otros aliados
                const isHotel = aliadoTipo === 'HOTEL';
                if (!isHotel && (!formData.numeroVuelo || formData.numeroVuelo.trim() === '')) {
                    showError(language === 'es' ? 'Por favor ingresa el número de vuelo' : 'Please enter the flight number');
                    return false;
                }
            } else {
                // For non-airport services, lugarRecogida is required
                if (!formData.lugarRecogida) {
                    showError(language === 'es' ? 'Por favor ingresa el lugar de recogida' : 'Please enter pickup location');
                    return false;
                }
            }

            return true;
        }

        // Step 2: Contact Info
        if (step === 2) {
            // Required: nombreCliente, whatsappCliente, emailCliente
            if (!formData.nombreCliente || !formData.whatsappCliente || !formData.emailCliente) {
                showError(language === 'es' ? 'Por favor completa todos los campos obligatorios' : 'Please complete all required fields');
                return false;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.emailCliente)) {
                showError(language === 'es' ? 'Por favor ingresa un email válido' : 'Please enter a valid email');
                return false;
            }

            // Validate WhatsApp (should be numbers only, at least 10 digits)
            const whatsappClean = formData.whatsappCliente.replace(/\D/g, '');
            if (whatsappClean.length < 10) {
                showError(language === 'es' ? 'Por favor ingresa un número de WhatsApp válido (mínimo 10 dígitos)' : 'Please enter a valid WhatsApp number (minimum 10 digits)');
                return false;
            }

            // Validate asistentes if any
            if (formData.asistentes && formData.asistentes.length > 0) {
                for (const asistente of formData.asistentes) {
                    if (asistente.nombre || asistente.numeroDocumento) {
                        // If any field is filled, all fields must be filled
                        if (!asistente.nombre || !asistente.numeroDocumento) {
                            showError(language === 'es' ? 'Por favor completa la información de todos los asistentes o elimínalos' : 'Please complete all assistant information or remove them');
                            return false;
                        }
                    }
                }
            }

            return true;
        }

        // Step 3: Notes - Always valid (optional)
        if (step === 3) return true;

        // Step 4: Summary - Always valid (just confirmation)
        if (step === 4) return true;

        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 5) {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                setMaxStepReached(prev => Math.max(prev, nextStep));
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleClose = () => {
        setCurrentStep(0);
        onClose();
    };

    const updateFormData = (updates: Partial<ReservationFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleConfirmReservation = async () => {
        setLoading(true);
        try {
            // For hourly services, force cash payment
            const paymentMethod = service.esPorHoras ? 'EFECTIVO' : metodoPago;
            
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    servicioId: service.id,
                    aliadoId: aliadoId || null,
                    esReservaAliado: !!aliadoId,
                    metodoPago: paymentMethod,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear reserva');
            }

            setReservationCode(data.data.codigo);
            // Redirect directly to tracking page
            router.push(`/tracking/${data.data.codigo}`);
        } catch (error: any) {
            showError(error.message || (language === 'es' ? 'Error al crear la reserva' : 'Error creating reservation'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            {/* Error Notification */}
            {errorMessage && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[60] animate-in slide-in-from-top duration-300">
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4 flex items-start gap-3 max-w-md">
                        <div className="flex-shrink-0">
                            <FiAlertCircle className="text-red-500 text-2xl" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-red-800 mb-1">
                                {language === 'es' ? 'Campos Incompletos' : 'Incomplete Fields'}
                            </h3>
                            <p className="text-red-700 text-sm">{errorMessage}</p>
                        </div>
                        <button
                            onClick={() => setErrorMessage('')}
                            className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-2 shadow-md"
                >
                    <FiX size={24} />
                </button>

                {/* Progress indicator */}
                {currentStep < 5 && (
                    <div className="bg-white border-b px-8 py-4 rounded-t-2xl flex-shrink-0">
                        {/* ... existing progress bar code ... */}
                        <div className="flex items-center justify-center mb-3">
                            {[0, 1, 2, 3, 4].map((step) => {
                                const isClickable = step <= maxStepReached;
                                return (
                                    <div key={step} className="flex items-center">
                                        <div
                                            onClick={() => isClickable && setCurrentStep(step)}
                                            className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${step <= currentStep
                                                    ? 'bg-[#D6A75D] text-black shadow-md scale-110'
                                                    : 'bg-gray-200 text-gray-500'
                                                } ${isClickable ? 'cursor-pointer hover:bg-[#C5964A] hover:text-black' : 'cursor-not-allowed'}`}
                                        >
                                            {step + 1}
                                        </div>
                                        {step < 4 && (
                                            <div className={`h-1 w-8 md:w-16 mx-1 md:mx-2 rounded-full transition-all ${step < currentStep ? 'bg-[#D6A75D]' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <p className="text-sm text-gray-600 text-center font-medium">
                            {currentStep === 0 && t('reservas.paso0_titulo', language)}
                            {currentStep === 1 && t('reservas.paso1_titulo', language)}
                            {currentStep === 2 && t('reservas.paso2_titulo', language)}
                            {currentStep === 3 && t('reservas.paso3_titulo', language)}
                            {currentStep === 4 && t('reservas.paso4_titulo', language)}
                        </p>
                    </div>
                )}

                {/* Step content - scrollable */}
                <div className="flex-1 overflow-y-auto p-8">
                    {currentStep === 0 && (
                        <Step0ServiceInfo
                            service={processedService}
                            onNext={handleNext}
                            onBack={handleClose}
                        />
                    )}

                    {currentStep === 1 && (
                        <Step1TripDetails
                            service={{ ...service, nombre: processedService.nombre }}
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={handleNext}
                            onBack={handleBack}
                            preciosPersonalizados={preciosPersonalizados}
                            tarifasMunicipios={tarifasMunicipios}
                            aliadoTipo={aliadoTipo}
                            aliadoNombre={aliadoNombre}
                        />
                    )}
                    {currentStep === 2 && (
                        <Step2ContactInfo
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {currentStep === 3 && (
                        <Step3Notes
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {currentStep === 4 && (
                        <Step4Summary
                            service={processedService}
                            formData={formData}
                            onConfirm={handleConfirmReservation}
                            onBack={handleBack}
                            loading={loading}
                        />
                    )}
                    {currentStep === 5 && (
                        <Step5Confirmation
                            reservationCode={reservationCode}
                            isAlly={!!aliadoId}
                            onClose={handleClose}
                        />
                    )}
                </div>

                {/* Sticky Footer with Navigation Buttons */}
                {currentStep < 5 && (
                    <div className="border-t bg-white px-8 py-4 rounded-b-2xl flex-shrink-0 flex flex-col gap-3">
                        {/* Price Indicator (Only Step 1) */}
                        {currentStep === 1 && formData.municipio !== Municipio.OTRO && (
                            <div className="flex justify-between items-center px-1">
                                <span className="text-sm text-gray-500 font-medium">
                                    {t('reservas.paso1_cotizacion', language)}
                                </span>
                                <span className="text-lg font-bold text-[#D6A75D]">
                                    {formData.numeroPasajeros > 0 ? formatPrice(formData.precioTotal) : formatPrice(0)}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={currentStep === 0 ? handleClose : handleBack}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {t('reservas.paso0_volver', language)}
                            </button>
                            <button
                                onClick={currentStep === 4 ? handleConfirmReservation : handleNext}
                                disabled={currentStep === 4 && loading}
                                className="flex-1 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                            >
                                {currentStep === 4 ? (loading ? t('comunes.cargando', language) : t('reservas.paso4_confirmar', language)) : t('reservas.paso0_continuar', language)}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
