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
import { Idioma, Municipio, TipoDocumento, AeropuertoNombre, TrasladoTipo } from '@prisma/client';
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
        asistentes: [{ nombre: '', tipoDocumento: TipoDocumento.PASAPORTE, numeroDocumento: '', email: '', telefono: '' }],
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
    const [cartItemCount, setCartItemCount] = useState(0);
    const router = useRouter();

    // Update language in form data when context changes
    useEffect(() => {
        setFormData(prev => ({ ...prev, idioma: language.toUpperCase() === 'EN' ? Idioma.EN : Idioma.ES }));
    }, [language]);

    // Check cart item count on mount and when modal opens
    useEffect(() => {
        const updateCartCount = () => {
            try {
                const cart = localStorage.getItem('medellin-travel-cart');
                if (cart) {
                    const cartItems = JSON.parse(cart);
                    setCartItemCount(Array.isArray(cartItems) ? cartItems.length : 0);
                } else {
                    setCartItemCount(0);
                }
            } catch (error) {
                console.error('Error loading cart count:', error);
                setCartItemCount(0);
            }
        };

        if (isOpen) {
            updateCartCount();
        }

        // Listen for cart updates
        const handleCartUpdate = () => {
            updateCartCount();
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, [isOpen]);

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
            // Required: fecha, hora, municipio (except for TOUR_COMPARTIDO), numeroPasajeros, vehiculoId
            // For TOUR_COMPARTIDO, municipio is null and not required
            if (!formData.fecha || !formData.hora || (service.tipo !== 'TOUR_COMPARTIDO' && !formData.municipio)) {
                showError(language === 'es' ? 'Por favor completa todos los campos obligatorios' : 'Please complete all required fields');
                return false;
            }

            // If municipio is OTRO, otroMunicipio is required
            if (formData.municipio === Municipio.OTRO && !formData.otroMunicipio) {
                showError(language === 'es' ? 'Por favor especifica el municipio' : 'Please specify the municipality');
                return false;
            }

            // Special validation for SHARED TOURS
            if (service.tipo === 'TOUR_COMPARTIDO') {
                if (!formData.fecha) {
                    showError(language === 'es' ? 'Por favor selecciona una fecha' : 'Please select a date');
                    return false;
                }
                if (formData.numeroPasajeros <= 0) {
                    showError(language === 'es' ? 'Por favor ingresa el número de pasajeros' : 'Please enter the number of passengers');
                    return false;
                }

                // Participant details will be validated in Step 2 (Contact Info)
                // If shared tour, we don't need vehicle or other checks
                return true;
            }

            // Number of passengers must be greater than 0
            if (formData.numeroPasajeros <= 0) {
                showError(language === 'es' ? 'Por favor ingresa el número de pasajeros' : 'Please enter the number of passengers');
                return false;
            }

            // Vehicle must be selected (ONLY if not Shared Tour)
            if (!formData.vehiculoId && service.tipo !== 'TOUR_COMPARTIDO') {
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

            // Check if this is a traslado or municipal transport service
            const isTraslado = service.tipo === 'TRANSPORTE_MUNICIPAL' || (service.nombre && (
                typeof service.nombre === 'string'
                    ? service.nombre.toLowerCase().includes('traslado')
                    : (typeof service.nombre === 'object' && service.nombre
                        ? ((service.nombre as any).ES || (service.nombre as any).es || '')?.toLowerCase().includes('traslado')
                        : false)
            ));

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
                // Número de vuelo es OBLIGATORIO solo cuando viaja DESDE el aeropuerto (llegada)
                // Es OPCIONAL cuando viaja HACIA el aeropuerto (salida)
                if (formData.aeropuertoTipo === 'DESDE' && (!formData.numeroVuelo || formData.numeroVuelo.trim() === '')) {
                    showError(language === 'es' ? 'Por favor ingresa el número de vuelo' : 'Please enter the flight number');
                    return false;
                }
            } else if (isTraslado) {
                // For traslado services, validate direction and locations
                if (!formData.trasladoTipo) {
                    showError(language === 'es' ? 'Por favor selecciona la dirección del traslado' : 'Please select transfer direction');
                    return false;
                }
                if (!formData.lugarRecogida) {
                    showError(language === 'es' ? 'Por favor ingresa el lugar de origen' : 'Please enter origin location');
                    return false;
                }
                // For DESDE_MUNICIPIO, destination is required
                if (formData.trasladoTipo === TrasladoTipo.DESDE_MUNICIPIO && (!formData.trasladoDestino || formData.trasladoDestino.trim() === '')) {
                    showError(language === 'es' ? 'Por favor ingresa el lugar de destino' : 'Please enter destination location');
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

            // Validate document for contact person (required)
            if (!formData.numeroDocumentoCliente || formData.numeroDocumentoCliente.trim().length < 4) {
                showError(language === 'es' ? 'Por favor ingresa tu número de documento' : 'Please enter your document number');
                return false;
            }

            // Para servicios de aeropuerto O para aliados, solo el representante es obligatorio
            if (service.esAeropuerto || !!aliadoId) {
                return true;
            }

            // Para otros servicios, todos los pasajeros son obligatorios
            const requiredPassengers = formData.numeroPasajeros || 1;
            if (formData.asistentes.length < requiredPassengers) {
                showError(language === 'es'
                    ? `Por favor completa los datos de los ${requiredPassengers} pasajeros`
                    : `Please complete details for all ${requiredPassengers} passengers`);
                return false;
            }

            // Validate each required passenger
            for (let i = 0; i < requiredPassengers; i++) {
                const asistente = formData.asistentes[i];
                if (!asistente || !asistente.nombre || asistente.nombre.trim().length < 2 ||
                    !asistente.numeroDocumento || asistente.numeroDocumento.trim().length < 4) {
                    showError(language === 'es'
                        ? `Por favor completa los datos del pasajero ${i + 1}`
                        : `Please complete details for passenger ${i + 1}`);
                    return false;
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
                    fecha: formData.fecha ? formData.fecha.toISOString().split('T')[0] : null, // Convert to YYYY-MM-DD
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

            // Redirigir a la página de tracking
            setReservationCode(data.data.codigo);
            router.push(`/tracking/${data.data.codigo}`);
        } catch (error: any) {
            showError(error.message || (language === 'es' ? 'Error al crear la reserva' : 'Error creating reservation'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        try {
            // Crear item del carrito con toda la información del formulario
            const cartItem = {
                id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                servicioId: service.id,
                servicioNombre: processedService.nombre,
                servicioImagen: service.imagen,
                ...formData,
                fecha: formData.fecha ? formData.fecha.toISOString().split('T')[0] : null,
                aliadoId: aliadoId || null,
                esReservaAliado: !!aliadoId,
                metodoPago: service.esPorHoras ? 'EFECTIVO' : metodoPago,
            };

            // Obtener carrito actual del localStorage
            const existingCart = localStorage.getItem('medellin-travel-cart');
            const cart = existingCart ? JSON.parse(existingCart) : [];

            // Agregar nuevo item
            cart.push(cartItem);

            // Guardar en localStorage
            localStorage.setItem('medellin-travel-cart', JSON.stringify(cart));

            // Disparar evento para actualizar el contador del carrito
            window.dispatchEvent(new Event('cartUpdated'));

            // Mostrar mensaje de éxito
            alert(language === 'es'
                ? '✅ Servicio agregado al carrito. Puedes continuar eligiendo más servicios o proceder al pago desde el carrito.'
                : '✅ Service added to cart. You can continue choosing more services or proceed to payment from the cart.');

            // Cerrar el modal
            handleClose();
        } catch (error) {
            console.error('Error adding to cart:', error);
            showError(language === 'es' ? 'Error al agregar al carrito' : 'Error adding to cart');
        }
    };

    const handleProceedToPayment = async () => {
        setLoading(true);
        try {
            // Crear item del servicio actual
            const currentItem = {
                id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                servicioId: service.id,
                servicioNombre: processedService.nombre,
                servicioImagen: service.imagen,
                ...formData,
                fecha: formData.fecha ? formData.fecha.toISOString().split('T')[0] : null,
                aliadoId: aliadoId || null,
                esReservaAliado: !!aliadoId,
                metodoPago: service.esPorHoras ? 'EFECTIVO' : metodoPago,
            };

            // Obtener items del carrito
            const existingCart = localStorage.getItem('medellin-travel-cart');
            const cartItems = existingCart ? JSON.parse(existingCart) : [];

            // Combinar carrito existente + servicio actual
            const allItems = [...cartItems, currentItem];

            // Crear el pedido con todos los servicios
            const response = await fetch('/api/pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartItems: allItems,
                    idioma: formData.idioma || 'ES',
                    metodoPago: metodoPago,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear el pedido');
            }

            const { data: pedido } = await response.json();

            // Limpiar el carrito
            localStorage.removeItem('medellin-travel-cart');
            window.dispatchEvent(new Event('cartUpdated'));

            // Redirigir a la página de tracking del pedido
            router.push(`/tracking/${pedido.codigo}`);
        } catch (error: any) {
            showError(error.message || (language === 'es' ? 'Error al procesar el pedido' : 'Error processing order'));
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
                            esAeropuerto={service.esAeropuerto}
                            isAlly={!!aliadoId}
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

                        {/* Step 4: Dynamic buttons based on cart state */}
                        {currentStep === 4 ? (
                            <div className="space-y-2">
                                {/* Primary button - Changes based on cart state */}
                                {cartItemCount > 0 ? (
                                    // HAY items en el carrito: "Proceder al Pago"
                                    <button
                                        onClick={handleProceedToPayment}
                                        disabled={loading}
                                        className="w-full bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {loading
                                            ? t('comunes.cargando', language)
                                            : (language === 'es' ? `Proceder al Pago (${cartItemCount + 1} servicios)` : `Proceed to Payment (${cartItemCount + 1} services)`)}
                                    </button>
                                ) : (
                                    // NO HAY items en el carrito: "Confirmar Reserva"
                                    <button
                                        onClick={handleConfirmReservation}
                                        disabled={loading}
                                        className="w-full bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {loading ? t('comunes.cargando', language) : t('reservas.paso4_confirmar', language)}
                                    </button>
                                )}



                                {/* Secondary button - Agregar al Carrito (always shown if allowed) */}
                                {!service.esPorHoras && (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={loading}
                                        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border-2 border-gray-300 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        {language === 'es' ? 'Agregar al Carrito y Seguir Eligiendo' : 'Add to Cart and Continue Shopping'}
                                    </button>
                                )}

                                {/* Back button */}
                                <button
                                    onClick={handleBack}
                                    className="w-full px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {t('reservas.paso0_volver', language)}
                                </button>
                            </div>
                        ) : (
                            /* Other steps: Normal navigation */
                            <div className="flex gap-4">
                                <button
                                    onClick={currentStep === 0 ? handleClose : handleBack}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {t('reservas.paso0_volver', language)}
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-3 px-6 rounded-lg transition-all"
                                >
                                    {t('reservas.paso0_continuar', language)}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
