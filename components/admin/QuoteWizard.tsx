'use client';

import { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiCopy, FiCheck } from 'react-icons/fi';
import Step0ServiceInfo from '../reservas/wizard/Step0ServiceInfo';
import Step1TripDetails from '../reservas/wizard/Step1TripDetails';
import Step2ContactInfo from '../reservas/wizard/Step2ContactInfo';
import Step3Notes from '../reservas/wizard/Step3Notes';
import { ReservationFormData } from '@/types/reservation';
import { Idioma, Municipio, TipoDocumento, AeropuertoNombre, TrasladoTipo } from '@prisma/client';
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

interface QuoteWizardProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
}

export default function QuoteWizard({ service, isOpen, onClose }: QuoteWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [formData, setFormData] = useState<ReservationFormData>({
        idioma: Idioma.ES,
        fecha: null,
        hora: '',
        municipio: '',
        numeroPasajeros: 0,
        nombreCliente: '',
        whatsappCliente: '',
        emailCliente: '',
        asistentes: [{ nombre: '', tipoDocumento: TipoDocumento.CC, numeroDocumento: '', email: '', telefono: '' }],
        precioBase: 0,
        precioAdicionales: 0,
        recargoNocturno: 0,
        tarifaMunicipio: 0,
        descuentoAliado: 0,
        precioTotal: 0,
        datosDinamicos: {},
        aeropuertoNombre: AeropuertoNombre.JOSE_MARIA_CORDOVA,
        cantidadHoras: service.esPorHoras ? 4 : undefined,
    });
    const [precioPersonalizado, setPrecioPersonalizado] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [quoteLink, setQuoteLink] = useState<string>('');
    const [reservationCode, setReservationCode] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'interno' | 'tercero'>('tercero');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

    // Process service data
    const processedService = {
        ...service,
        nombre: getLocalizedText(service.nombre, 'ES'),
        descripcion: getLocalizedText(service.descripcion, 'ES'),
        incluye: getLocalizedArray(service.incluye, 'ES'),
    };

    if (!isOpen) return null;

    const showError = (message: string) => {
        setErrorMessage(message);
        setTimeout(() => setErrorMessage(''), 5000);
    };

    const validateStep = (step: number): boolean => {
        if (step === 0) return true;

        if (step === 1) {
            if (!formData.fecha) {
                showError('Por favor completa todos los campos obligatorios');
                return false;
            }
            if (formData.numeroPasajeros <= 0) {
                showError('Por favor ingresa el número de pasajeros');
                return false;
            }

            // En Tour Compartido, hora/lugar se autocompletan y no hay selección manual de vehículo/municipio.
            if (service.tipo === 'TOUR_COMPARTIDO') {
                return true;
            }

            if (!formData.hora || !formData.municipio) {
                showError('Por favor completa todos los campos obligatorios');
                return false;
            }
            if (formData.municipio === Municipio.OTRO && !formData.otroMunicipio) {
                showError('Por favor especifica el municipio');
                return false;
            }
            if (!formData.vehiculoId) {
                showError('Por favor selecciona un vehículo');
                return false;
            }
            if (service.esPorHoras && (!formData.cantidadHoras || formData.cantidadHoras < 4)) {
                showError('Por favor ingresa una cantidad válida de horas (mínimo 4)');
                return false;
            }
            if (service.esAeropuerto) {
                if (!formData.aeropuertoTipo) {
                    showError('Por favor selecciona la dirección del aeropuerto');
                    return false;
                }
                if (!formData.lugarRecogida) {
                    showError('Por favor ingresa el lugar de recogida/destino');
                    return false;
                }
                if (formData.aeropuertoTipo === 'DESDE' && (!formData.numeroVuelo || formData.numeroVuelo.trim() === '')) {
                    showError('Por favor ingresa el número de vuelo');
                    return false;
                }
            } else {
                if (!formData.lugarRecogida) {
                    showError('Por favor ingresa el lugar de recogida');
                    return false;
                }
            }
            return true;
        }

        if (step === 2) {
            if (!formData.nombreCliente || !formData.whatsappCliente || !formData.emailCliente) {
                showError('Por favor completa todos los campos obligatorios');
                return false;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.emailCliente)) {
                showError('Por favor ingresa un email válido');
                return false;
            }
            const whatsappClean = formData.whatsappCliente.replace(/\D/g, '');
            if (whatsappClean.length < 10) {
                showError('Por favor ingresa un número de WhatsApp válido (mínimo 10 dígitos)');
                return false;
            }
            return true;
        }

        if (step === 3) return true;

        if (step === 4) {
            const precio = Number(precioPersonalizado);
            if (!precioPersonalizado || precio <= 0) {
                showError('Por favor ingresa un precio válido mayor a 0');
                return false;
            }
            return true;
        }

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
        setQuoteLink('');
        setPrecioPersonalizado('');
        onClose();
    };

    const updateFormData = (updates: Partial<ReservationFormData>) => {
        setFormData(prev => ({ ...prev, ...updates }));

        // Track selected vehicle when vehiculoId changes
        if (updates.vehiculoId && service.vehiculosPermitidos) {
            // vehiculosPermitidos contains objects with nested vehiculo property
            const vehicleData = service.vehiculosPermitidos.find((v: any) => v.vehiculo?.id === updates.vehiculoId);
            if (vehicleData && vehicleData.vehiculo) {
                setSelectedVehicle(vehicleData.vehiculo);
            }
        }
    };

    const handleGenerateQuote = async () => {
        if (!validateStep(4)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/cotizaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    fecha: formData.fecha ? formData.fecha.toISOString().split('T')[0] : null,
                    servicioId: service.id,
                    precioPersonalizado: Number(precioPersonalizado),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al crear cotización');
            }

            // Usar el link de tracking directamente en lugar del de cotización
            const trackingLink = `${window.location.origin}/tracking/${data.data.codigo}`;
            setQuoteLink(trackingLink);
            setReservationCode(data.data.codigo);
            setCurrentStep(5);

        } catch (error: any) {
            showError(error.message || 'Error al crear la cotización');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(quoteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
                            <h3 className="font-bold text-red-800 mb-1">Campos Incompletos</h3>
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
                            {currentStep === 0 && 'Información del Servicio'}
                            {currentStep === 1 && 'Detalles del Viaje'}
                            {currentStep === 2 && 'Información de Contacto'}
                            {currentStep === 3 && 'Notas Adicionales'}
                            {currentStep === 4 && 'Precio Personalizado'}
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
                            preciosPersonalizados={null}
                            tarifasMunicipios={[]}
                            aliadoTipo={null}
                            aliadoNombre={null}
                        />
                    )}

                    {currentStep === 2 && (
                        <Step2ContactInfo
                            formData={formData}
                            updateFormData={updateFormData}
                            onNext={handleNext}
                            onBack={handleBack}
                            isAlly={true}
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
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Precio Personalizado</h2>
                                <p className="text-gray-600">
                                    Revisa los detalles de la reserva e ingresa el precio total
                                </p>
                            </div>

                            {/* Resumen de la Reserva */}
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-3">📋 Resumen de la Reserva</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Servicio */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Servicio</p>
                                        <p className="font-semibold text-gray-900">{processedService.nombre}</p>
                                    </div>

                                    {/* Fecha y Hora */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Fecha y Hora</p>
                                        <p className="font-semibold text-gray-900">
                                            {formData.fecha ? formData.fecha.toLocaleDateString('es-CO', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }) : 'No especificado'} - {formData.hora}
                                        </p>
                                    </div>

                                    {/* Pasajeros */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Pasajeros</p>
                                        <p className="font-semibold text-gray-900">{formData.numeroPasajeros} persona(s)</p>
                                    </div>

                                    {/* Vehículo */}
                                    {formData.vehiculoId && selectedVehicle && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Vehículo</p>
                                            <p className="font-semibold text-gray-900">
                                                {selectedVehicle.nombre}
                                            </p>
                                        </div>
                                    )}

                                    {/* Lugar de Recogida */}
                                    {formData.lugarRecogida && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Lugar de Recogida</p>
                                            <p className="font-semibold text-gray-900">{formData.lugarRecogida}</p>
                                        </div>
                                    )}

                                    {/* Municipio */}
                                    <div className="bg-white p-3 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Municipio</p>
                                        <p className="font-semibold text-gray-900">
                                            {formData.municipio === 'OTRO' && formData.otroMunicipio
                                                ? formData.otroMunicipio
                                                : formData.municipio.replace(/_/g, ' ')}
                                        </p>
                                    </div>

                                    {/* Horas (si aplica) */}
                                    {service.esPorHoras && formData.cantidadHoras && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Cantidad de Horas</p>
                                            <p className="font-semibold text-gray-900">{formData.cantidadHoras} hora(s)</p>
                                        </div>
                                    )}

                                    {/* Número de Vuelo (si aplica) */}
                                    {service.esAeropuerto && formData.numeroVuelo && (
                                        <div className="bg-white p-3 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Número de Vuelo</p>
                                            <p className="font-semibold text-gray-900">{formData.numeroVuelo}</p>
                                        </div>
                                    )}

                                    {/* Cliente */}
                                    <div className="bg-white p-3 rounded-lg md:col-span-2">
                                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                                        <p className="font-semibold text-gray-900">
                                            {formData.nombreCliente} - {formData.whatsappCliente}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Campo de Precio */}
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Precio Total (COP)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-bold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        value={precioPersonalizado}
                                        onChange={(e) => setPrecioPersonalizado(e.target.value)}
                                        placeholder="150000"
                                        min="0"
                                        step="1000"
                                        className="w-full pl-8 pr-4 py-4 text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Este será el precio final que verá el cliente
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiCheck className="text-green-600 text-4xl" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reserva Generada</h2>
                                <p className="text-gray-600">Código: <span className="font-mono font-bold text-[#D6A75D]">{reservationCode}</span></p>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('interno')}
                                    className={`flex-1 py-3 px-4 font-semibold transition-all ${activeTab === 'interno'
                                        ? 'border-b-2 border-[#D6A75D] text-[#D6A75D]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Uso Interno
                                </button>
                                <button
                                    onClick={() => setActiveTab('tercero')}
                                    className={`flex-1 py-3 px-4 font-semibold transition-all ${activeTab === 'tercero'
                                        ? 'border-b-2 border-[#D6A75D] text-[#D6A75D]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Para Tercero
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="mt-6">
                                {activeTab === 'interno' ? (
                                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center space-y-4">
                                        <div className="text-blue-600 text-5xl mb-2">✓</div>
                                        <h3 className="text-xl font-bold text-gray-900">Puedes cerrar este aviso</h3>
                                        <p className="text-gray-700">
                                            La reserva quedó guardada y la puedes ver en el panel de reservas
                                        </p>
                                        <button
                                            onClick={handleClose}
                                            className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                                        >
                                            Cerrar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 space-y-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                                            Link para Compartir
                                        </label>
                                        <p className="text-sm text-gray-600 mb-3">
                                            Comparte este link con tu cliente. Podrá ver todos los detalles de la reserva y realizar el pago.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={quoteLink}
                                                readOnly
                                                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-sm font-mono"
                                            />
                                            <button
                                                onClick={copyToClipboard}
                                                className="px-6 py-3 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold rounded-lg transition-all flex items-center gap-2"
                                            >
                                                {copied ? (
                                                    <>
                                                        <FiCheck size={20} />
                                                        Copiado
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiCopy size={20} />
                                                        Copiar
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <button
                                            onClick={handleClose}
                                            className="w-full mt-4 px-8 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-all"
                                        >
                                            Crear Nueva Cotización
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sticky Footer with Navigation Buttons */}
                {currentStep < 5 && (
                    <div className="border-t bg-white px-8 py-4 rounded-b-2xl flex-shrink-0">
                        {/* NO mostrar precio en Step 1 para cotizaciones */}
                        <div className="flex gap-4">
                            <button
                                onClick={currentStep === 0 ? handleClose : handleBack}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                onClick={currentStep === 4 ? handleGenerateQuote : handleNext}
                                disabled={currentStep === 4 && loading}
                                className="flex-1 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                            >
                                {currentStep === 4 ? (loading ? 'Generando...' : 'Generar') : 'Continuar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
