'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiX } from 'react-icons/fi';
import Step0ServiceInfo from './wizard/Step0ServiceInfo';
import Step1TripDetails from './wizard/Step1TripDetails';
import Step2ContactInfo from './wizard/Step2ContactInfo';
import Step3Notes from './wizard/Step3Notes';
import Step4Summary from './wizard/Step4Summary';
import Step5Confirmation from './wizard/Step5Confirmation';
import StepWhatsAppContact from './wizard/StepWhatsAppContact';
import { ReservationFormData } from '@/types/reservation';
import { Idioma, Municipio, TipoDocumento } from '@prisma/client';
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
    preciosPersonalizados?: any;
    tarifasMunicipios?: any[];
    metodoPago?: 'BOLD' | 'EFECTIVO';
}

export default function ReservationWizard({ service, isOpen, onClose, aliadoId, preciosPersonalizados, tarifasMunicipios, metodoPago = 'BOLD' }: ReservationWizardProps) {
    const { language } = useLanguage();
    const [currentStep, setCurrentStep] = useState(0);
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

    const validateStep = (step: number): boolean => {
        // Skip validation for hourly services on step 1 as they go to WhatsApp
        if (service.esPorHoras && step === 1) return true;

        if (step === 1) {
            // ... existing step 1 validation
        }
        // ... existing step 2 validation
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 5) {
                setCurrentStep(currentStep + 1);
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
            const res = await fetch('/api/reservas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    servicioId: service.id,
                    aliadoId: aliadoId || null,
                    esReservaAliado: !!aliadoId,
                    metodoPago: metodoPago,
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
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-2 shadow-md"
                >
                    <FiX size={24} />
                </button>

                {/* Progress indicator - Hide for hourly services if on step 1 */}
                {!service.esPorHoras && currentStep < 5 && (
                    <div className="bg-white border-b px-8 py-4 rounded-t-2xl flex-shrink-0">
                        {/* ... existing progress bar code ... */}
                        <div className="flex items-center justify-center mb-3">
                            {[0, 1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex items-center">
                                    <div className={`relative w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${step <= currentStep ? 'bg-[#D6A75D] text-black shadow-md scale-110' : 'bg-gray-200 text-gray-500'
                                        }`}>
                                        {step + 1}
                                    </div>
                                    {step < 4 && (
                                        <div className={`h-1 w-8 md:w-16 mx-1 md:mx-2 rounded-full transition-all ${step < currentStep ? 'bg-[#D6A75D]' : 'bg-gray-200'
                                            }`} />
                                    )}
                                </div>
                            ))}
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

                    {/* Hourly Service Flow: Step 1 is WhatsApp Contact */}
                    {currentStep === 1 && service.esPorHoras ? (
                        <StepWhatsAppContact
                            serviceName={processedService.nombre}
                            onBack={handleBack}
                        />
                    ) : (
                        <>
                            {currentStep === 1 && (
                                <Step1TripDetails
                                    service={{ ...service, nombre: processedService.nombre }}
                                    formData={formData}
                                    updateFormData={updateFormData}
                                    onNext={handleNext}
                                    onBack={handleBack}
                                    preciosPersonalizados={preciosPersonalizados}
                                    tarifasMunicipios={tarifasMunicipios}
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
                        </>
                    )}
                </div>

                {/* Sticky Footer with Navigation Buttons - Hide for hourly services on Step 1 */}
                {currentStep < 5 && !(service.esPorHoras && currentStep === 1) && (
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
