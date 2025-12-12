'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiStar, FiPhone, FiMail, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { TIMELINE_STATES, getStateOrder, canCancelReservation } from '@/lib/timeline-states';
import { EstadoReserva } from '@prisma/client';
import { BoldButton } from '@/components/bold/BoldButton';
import { formatReservationDate } from '@/lib/date-utils';

const DICTIONARY = {
    ES: {
        progreso: 'Progreso',
        codigoReserva: 'Código de Reserva',
        estadoActual: 'Estado Actual',
        detallesServicio: 'Detalles del Servicio',
        servicio: 'Servicio',
        fechaHora: 'Fecha y Hora',
        pasajeros: 'Pasajeros',
        lugarRecogida: 'Lugar de recogida',
        destino: 'Destino',
        municipio: 'Municipio',
        vehiculo: 'Vehículo',
        duracion: 'Duración',
        informacionContacto: 'Información de Contacto',
        nombre: 'Nombre',
        email: 'Email',
        asistentes: 'Asistentes',
        tipoDoc: 'Tipo Doc',
        numeroDoc: 'Número Doc',
        asignacion: 'Asignación',
        conductor: 'Conductor',
        disponibleCoordinar: 'Disponible para coordinar',
        capacidad: 'Capacidad',
        serviciosAdicionales: 'Servicios Adicionales',
        cantidad: 'Cantidad',
        resumenPrecio: 'Resumen de Precio',
        precioBase: 'Precio Base',
        recargoNocturno: 'Recargo Nocturno',
        tarifaMunicipio: 'Tarifa Municipio',
        descuentoAliado: 'Descuento Aliado',
        total: 'TOTAL',
        cotizacionProceso: 'Cotización en Proceso',
        cotizacionMensaje: 'Estamos calculando el mejor precio para tu destino personalizado. Te enviaremos la cotización a tu WhatsApp e Email muy pronto.',
        pagoSeguro: 'Realizar Pago Seguro',
        pagoMensaje: 'Completa tu pago a través de Bold, una plataforma verificada y segura, en segundos.',
        experiencia: '¿Cómo fue tu experiencia?',
        opinionAyuda: 'Tu opinión nos ayuda a mejorar',
        placeholderComentario: 'Cuéntanos más sobre tu experiencia (opcional)',
        enviarCalificacion: 'Enviar Calificación',
        enviando: 'Enviando...',
        graciasCalificacion: '¡Gracias por tu calificación!',
        cancelarReserva: 'Cancelar Reserva',
        cancelando: 'Cancelando...',
        cancelarMensaje: 'Puedes cancelar hasta 24 horas antes del servicio',
        reservaNoEncontrada: 'Reserva no encontrada',
        volverInicio: 'Volver al inicio',
        cargando: 'Cargando...',
        origen: 'Origen',
        personas: 'persona(s)',
        noEspecificado: 'No especificado',
        tuHotel: 'Tu Hotel/Residencia',
        aeropuertoJMC: 'Aeropuerto JMC',
        aeropuertoOH: 'Aeropuerto Olaya Herrera'
    },
    EN: {
        progreso: 'Progress',
        codigoReserva: 'Reservation Code',
        estadoActual: 'Current Status',
        detallesServicio: 'Service Details',
        servicio: 'Service',
        fechaHora: 'Date and Time',
        pasajeros: 'Passengers',
        lugarRecogida: 'Pickup Location',
        destino: 'Destination',
        municipio: 'Municipality',
        vehiculo: 'Vehicle',
        duracion: 'Duration',
        informacionContacto: 'Contact Information',
        nombre: 'Name',
        email: 'Email',
        asistentes: 'Attendees',
        tipoDoc: 'Doc Type',
        numeroDoc: 'Doc Number',
        asignacion: 'Assignment',
        conductor: 'Driver',
        disponibleCoordinar: 'Available to coordinate',
        capacidad: 'Capacity',
        serviciosAdicionales: 'Additional Services',
        cantidad: 'Quantity',
        resumenPrecio: 'Price Summary',
        precioBase: 'Base Price',
        recargoNocturno: 'Night Surcharge',
        tarifaMunicipio: 'Municipality Fee',
        descuentoAliado: 'Ally Discount',
        total: 'TOTAL',
        cotizacionProceso: 'Quote in Process',
        cotizacionMensaje: 'We are calculating the best price for your custom destination. We will send the quote to your WhatsApp and Email very soon.',
        pagoSeguro: 'Make Secure Payment',
        pagoMensaje: 'Complete your payment through Bold, a verified and secure platform, in seconds.',
        experiencia: 'How was your experience?',
        opinionAyuda: 'Your opinion helps us improve',
        placeholderComentario: 'Tell us more about your experience (optional)',
        enviarCalificacion: 'Send Rating',
        enviando: 'Sending...',
        graciasCalificacion: 'Thank you for your rating!',
        cancelarReserva: 'Cancel Reservation',
        cancelando: 'Cancelling...',
        cancelarMensaje: 'You can cancel up to 24 hours before the service',
        reservaNoEncontrada: 'Reservation not found',
        volverInicio: 'Back to home',
        cargando: 'Loading...',
        origen: 'Origin',
        personas: 'person(s)',
        noEspecificado: 'Not specified',
        tuHotel: 'Your Hotel/Residence',
        aeropuertoJMC: 'JMC Airport',
        aeropuertoOH: 'Olaya Herrera Airport'
    }
};

export default function TrackingPage({ params }: { params: { codigo: string } }) {
    const searchParams = useSearchParams();
    const isHotelView = searchParams?.get('hotel') === 'true';

    const [reserva, setReserva] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [boldConfig, setBoldConfig] = useState<any>(null);

    // Rating state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submittingRating, setSubmittingRating] = useState(false);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    // Cancellation state
    const [cancelling, setCancelling] = useState(false);

    // Fetch Bold config
    useEffect(() => {
        async function fetchBoldConfig() {
            try {
                const res = await fetch('/api/bold/config');
                if (res.ok) {
                    const data = await res.json();
                    setBoldConfig(data);
                }
            } catch (error) {
                console.error('Error fetching Bold config:', error);
            }
        }
        fetchBoldConfig();
    }, []);

    useEffect(() => {
        async function fetchReserva() {
            try {
                const res = await fetch(`/api/reservas/${params.codigo}`);
                if (res.ok) {
                    const data = await res.json();
                    setReserva(data);
                }
            } catch (error) {
                console.error('Error fetching reserva:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchReserva();
    }, [params.codigo]);

    const handleSubmitRating = async () => {
        if (rating === 0) {
            alert('Por favor selecciona una calificación');
            return;
        }

        setSubmittingRating(true);
        try {
            const res = await fetch('/api/calificaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reservaId: reserva.id,
                    servicioId: reserva.servicioId,
                    estrellas: rating,
                    comentario: comment,
                    nombreCliente: reserva.nombreCliente,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al enviar calificación');
            }

            setRatingSubmitted(true);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSubmittingRating(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!confirm('¿Estás seguro que deseas cancelar esta reserva?')) {
            return;
        }

        setCancelling(true);
        try {
            const res = await fetch(`/api/reservas/${params.codigo}/cancelar`, {
                method: 'POST',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cancelar reserva');
            }

            const data = await res.json();
            setReserva(data.data);
            alert('Reserva cancelada exitosamente');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FiLoader className="animate-spin text-4xl text-[#D6A75D] mx-auto mb-4" />
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    if (!reserva) {
        // Default to ES for error screen if we don't know the language
        const t = DICTIONARY.ES;
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8">
                    <h1 className="text-3xl font-bold mb-4">{t.reservaNoEncontrada}</h1>
                    <p className="text-gray-600 mb-6">El código {params.codigo} no existe</p>
                    <a href="/" className="text-[#D6A75D] hover:underline">{t.volverInicio}</a>
                </div>
            </div>
        );
    }

    // Determine language and get dictionary
    const lang = (reserva.idioma === 'EN' ? 'EN' : 'ES') as keyof typeof DICTIONARY;
    const t = DICTIONARY[lang];

    // Detect payment method
    const metodoPago = reserva.metodoPago || 'BOLD';
    const isEfectivo = metodoPago === 'EFECTIVO';

    const isHotelAlly = reserva.esReservaAliado && reserva.aliado?.tipo === 'HOTEL';

    let currentState = TIMELINE_STATES[reserva.estado as EstadoReserva];
    // Custom override for Cash Payments
    if (isEfectivo && reserva.estado === EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION) {
        currentState = {
            ...currentState,
            label: lang === 'ES' ? 'Confirmada' : 'Confirmed',
            description: lang === 'ES' ? 'Reserva confirmada. El pago se realizará en efectivo al recibir el servicio.' : 'Reservation confirmed. Payment will be made in cash upon receiving the service.'
        };
    }

    const currentOrder = getStateOrder(reserva.estado);
    const mostrarBotonPago = metodoPago === 'BOLD' &&
        reserva.estado === 'CONFIRMADA_PENDIENTE_PAGO';
    const puedeCalificar = reserva.estado === 'COMPLETADA' && !reserva.calificacion && !ratingSubmitted;
    const puedeCancelar = canCancelReservation(new Date(reserva.fecha), reserva.estado);

    const Icon = currentState.icon;

    // Define timeline steps based on payment method
    const timelineSteps = isEfectivo ? [
        // Cash payment: CONFIRMADA → ASIGNADA → COMPLETADA
        EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION,
        EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR,
        EstadoReserva.COMPLETADA,
    ] : [
        // Bold payment: Normal flow
        EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
        EstadoReserva.PAGADA_PENDIENTE_ASIGNACION,
        EstadoReserva.ASIGNADA_PENDIENTE_COMPLETAR,
        EstadoReserva.COMPLETADA,
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-black text-white py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <h1 className="text-2xl md:text-3xl font-bold">Transportes Medellín Travel</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Timeline (Sidebar on desktop, top on mobile) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
                            <h3 className="font-bold text-lg mb-6">{t.progreso}</h3>
                            <div className="space-y-4">
                                {timelineSteps.map((estado, index) => {
                                    const stateConfig = TIMELINE_STATES[estado];

                                    // Custom label for Cash Payment in timeline
                                    let label = stateConfig.label;
                                    if (isEfectivo && estado === EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION) {
                                        label = lang === 'ES' ? 'Confirmada' : 'Confirmed';
                                    }

                                    const StateIcon = stateConfig.icon;
                                    const isActive = getStateOrder(estado) <= currentOrder;
                                    const isCurrent = estado === reserva.estado;

                                    return (
                                        <div key={estado} className="flex items-start gap-3">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isActive ? stateConfig.bgColor : 'bg-gray-100'
                                                }`}>
                                                <StateIcon className={`${isActive ? stateConfig.color : 'text-gray-400'}`} size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${isCurrent ? 'text-black' : 'text-gray-600'}`}>
                                                    {label}
                                                </p>
                                                {index < timelineSteps.length - 1 && (
                                                    <div className={`w-0.5 h-6 ml-4 mt-1 ${isActive ? 'bg-[#D6A75D]' : 'bg-gray-200'
                                                        }`} />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Código y Estado */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">{t.codigoReserva}</p>
                                    <p className="text-3xl font-bold text-[#D6A75D] tracking-wider">{reserva.codigo}</p>
                                </div>
                                <div className="text-left md:text-right">
                                    <p className="text-sm text-gray-600 mb-2">{t.estadoActual}</p>
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${currentState.bgColor} ${currentState.color}`}>
                                        <Icon size={20} />
                                        <span>{currentState.label}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{currentState.description}</p>
                                    {/* Cash Payment Badge */}
                                    {isEfectivo && (
                                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            {lang === 'ES' ? 'Pago en Efectivo' : 'Cash Payment'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Detalles del Servicio */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-2xl">🚐</span> {t.detallesServicio}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">{t.servicio}</p>
                                    <p className="font-semibold">
                                        {(() => {
                                            const nombre = reserva.servicio?.nombre;
                                            if (!nombre) return 'N/A';
                                            if (typeof nombre === 'string') return nombre;
                                            // Handle JSON object for localization
                                            return nombre[lang.toLowerCase()] || nombre['es'] || nombre['en'] || 'Servicio';
                                        })()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t.fechaHora}</p>
                                    <p className="font-semibold">
                                        {formatReservationDate(reserva.fecha, lang === 'EN' ? 'en-US' : 'es-CO', 'long')} - {reserva.hora}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t.pasajeros}</p>
                                    <p className="font-semibold">{reserva.numeroPasajeros} {t.personas}</p>
                                </div>
                                {/* Origen / Lugar de Recogida */}
                                <div>
                                    <p className="text-sm text-gray-600">
                                        {reserva.aeropuertoTipo === 'DESDE' ? t.origen : t.lugarRecogida}
                                    </p>
                                    <p className="font-semibold">
                                        {reserva.aeropuertoTipo === 'DESDE'
                                            ? (reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' ? t.aeropuertoJMC : t.aeropuertoOH)
                                            : (reserva.lugarRecogida || t.noEspecificado)}
                                    </p>
                                </div>

                                {/* Destino */}
                                <div>
                                    <p className="text-sm text-gray-600">{t.destino}</p>
                                    <p className="font-semibold">
                                        {reserva.aeropuertoTipo === 'HACIA'
                                            ? (reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' ? t.aeropuertoJMC : t.aeropuertoOH)
                                            : (reserva.aeropuertoTipo === 'DESDE'
                                                ? (reserva.lugarRecogida || t.tuHotel)
                                                : (reserva.servicio?.destinoAutoFill ||
                                                    (typeof reserva.servicio?.nombre === 'string'
                                                        ? reserva.servicio?.nombre
                                                        : (reserva.servicio?.nombre?.[lang.toLowerCase()] || reserva.servicio?.nombre?.['es']))
                                                    || t.noEspecificado)
                                            )
                                        }
                                    </p>
                                </div>

                                {/* Municipio */}
                                <div>
                                    <p className="text-sm text-gray-600">{t.municipio}</p>
                                    <p className="font-semibold">
                                        {reserva.municipio === 'OTRO' && reserva.otroMunicipio
                                            ? reserva.otroMunicipio
                                            : reserva.municipio.replace(/_/g, ' ')}
                                    </p>
                                </div>
                                {reserva.vehiculo && (
                                    <div>
                                        <p className="text-sm text-gray-600">{t.vehiculo}</p>
                                        <p className="font-semibold">{reserva.vehiculo.nombre}</p>
                                    </div>
                                )}
                                {/* Número de Vuelo - Solo para servicios de aeropuerto */}
                                {reserva.servicio?.esAeropuerto && (
                                    <div className={`md:col-span-2 p-4 rounded-lg border ${reserva.numeroVuelo ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={`text-sm font-bold ${reserva.numeroVuelo ? 'text-blue-800' : 'text-gray-600'}`}>
                                            ✈️ {lang === 'ES' ? 'Número de Vuelo' : 'Flight Number'}
                                        </p>
                                        <p className={`text-lg font-bold ${reserva.numeroVuelo ? 'text-blue-900' : 'text-gray-500 italic'}`}>
                                            {reserva.numeroVuelo || (lang === 'ES' ? 'No especificado' : 'Not specified')}
                                        </p>
                                    </div>
                                )}
                                {reserva.servicio?.duracion && (
                                    <div>
                                        <p className="text-sm text-gray-600">{t.duracion}</p>
                                        <p className="font-semibold">{reserva.servicio.duracion}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Información del Cliente */}
                        <div className="bg-white rounded-xl shadow-md p-6">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-2xl">👤</span> {t.informacionContacto}
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">{t.nombre}</p>
                                    <p className="font-semibold">{reserva.nombreCliente}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">WhatsApp</p>
                                    <a
                                        href={`https://wa.me/${reserva.whatsappCliente.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-semibold flex items-center gap-2"
                                    >
                                        <FiPhone size={16} /> {reserva.whatsappCliente}
                                    </a>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{t.email}</p>
                                    <a
                                        href={`mailto:${reserva.emailCliente}`}
                                        className="text-blue-600 hover:underline font-semibold flex items-center gap-2"
                                    >
                                        <FiMail size={16} /> {reserva.emailCliente}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Asistentes */}
                        {reserva.asistentes && reserva.asistentes.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">👥</span> {t.asistentes}
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="text-left p-3 font-semibold">{t.nombre}</th>
                                                <th className="text-left p-3 font-semibold">{t.tipoDoc}</th>
                                                <th className="text-left p-3 font-semibold">{t.numeroDoc}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reserva.asistentes.map((asistente: any, index: number) => (
                                                <tr key={index} className="border-t">
                                                    <td className="p-3">{asistente.nombre}</td>
                                                    <td className="p-3">{asistente.tipoDocumento}</td>
                                                    <td className="p-3">{asistente.numeroDocumento}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Conductor y Vehículo */}
                        {reserva.conductor && (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                                    <span className="text-2xl">🚗</span> {t.asignacion}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-sm text-blue-700 font-semibold mb-2">{t.conductor}</p>
                                        <p className="font-bold text-lg">{reserva.conductor.nombre}</p>

                                        <p className="text-sm text-blue-600 mt-1">{t.disponibleCoordinar}</p>
                                    </div>
                                    {reserva.vehiculo && (
                                        <div>
                                            <p className="text-sm text-blue-700 font-semibold mb-2">{t.vehiculo}</p>
                                            <p className="font-bold text-lg">{reserva.vehiculo.nombre}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {t.capacidad}: {reserva.vehiculo.capacidadMinima}-{reserva.vehiculo.capacidadMaxima} {t.pasajeros.toLowerCase()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Servicios Adicionales */}
                        {reserva.adicionalesSeleccionados && reserva.adicionalesSeleccionados.length > 0 && (
                            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
                                    <span className="text-2xl">✨</span> {t.serviciosAdicionales}
                                </h3>
                                <div className="space-y-2">
                                    {reserva.adicionalesSeleccionados.map((item: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-green-600 font-bold">✓</span>
                                                <div>
                                                    <p className="font-semibold">{item.adicional.nombre}</p>
                                                    {item.cantidad > 1 && (
                                                        <p className="text-sm text-gray-600">{t.cantidad}: {item.cantidad}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-purple-700 font-bold">
                                                ${Number(item.precioUnitario * item.cantidad).toLocaleString('es-CO')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumen de Precio */}
                        {/* Resumen de Precio (Ocultar si está pendiente de cotización) */}
                        {reserva.estado !== 'PENDIENTE_COTIZACION' ? (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <span className="text-2xl">💰</span> {t.resumenPrecio}
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">{t.precioBase}</span>
                                        <span className="font-semibold">${Number(reserva.precioBase).toLocaleString('es-CO')}</span>
                                    </div>
                                    {Number(reserva.precioAdicionales) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t.serviciosAdicionales}</span>
                                            <span className="font-semibold">${Number(reserva.precioAdicionales).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    {Number(reserva.recargoNocturno) > 0 && (
                                        <div className="flex justify-between text-gray-600">
                                            <span>{t.recargoNocturno}</span>
                                            <span className="font-semibold">${Number(reserva.recargoNocturno).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    {Number(reserva.tarifaMunicipio) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">{t.tarifaMunicipio}</span>
                                            <span className="font-semibold">${Number(reserva.tarifaMunicipio).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    {Number(reserva.descuentoAliado) > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>{t.descuentoAliado}</span>
                                            <span className="font-semibold">-${Number(reserva.descuentoAliado).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    <div className="border-t-2 border-gray-200 pt-3 mt-3">
                                        <div className="flex justify-between text-2xl font-bold">
                                            <span>{t.total}</span>
                                            <span className="text-[#D6A75D]">${Number(reserva.precioTotal).toLocaleString('es-CO')} COP</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 text-center">
                                <h3 className="text-xl font-bold text-yellow-800 mb-2">⏳ {t.cotizacionProceso}</h3>
                                <p className="text-yellow-900">
                                    {t.cotizacionMensaje}
                                </p>
                            </div>
                        )}

                        {/* Botón de Pago Bold */}
                        {mostrarBotonPago && boldConfig && reserva.hashPago && (
                            <div className="bg-white rounded-xl shadow-md p-6">
                                <h3 className="text-xl font-bold mb-2">💳 {t.pagoSeguro}</h3>
                                <p className="text-gray-700 mb-6">
                                    {t.pagoMensaje}
                                </p>
                                <BoldButton
                                    orderId={reserva.codigo}
                                    amount={Math.round(Number(reserva.precioTotal)).toString()}
                                    currency="COP"
                                    apiKey={boldConfig.publicKey}
                                    integritySignature={reserva.hashPago}
                                    redirectionUrl={boldConfig.redirectUrl}
                                    description={`Reserva ${reserva.codigo}`}
                                    customerData={reserva.emailCliente ? {
                                        email: reserva.emailCliente,
                                        fullName: reserva.nombreCliente,
                                        phone: reserva.whatsappCliente,
                                        dialCode: '+57'
                                    } : undefined}
                                />
                            </div>
                        )}

                        {/* Calificación */}
                        {puedeCalificar && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-2 text-green-900">⭐ {t.experiencia}</h3>
                                <p className="text-gray-700 mb-4">{t.opinionAyuda}</p>

                                <div className="flex gap-2 mb-4">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <FiStar
                                                size={32}
                                                className={`${star <= (hoverRating || rating)
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-gray-300'
                                                    }`}
                                            />
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={t.placeholderComentario}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none mb-4"
                                    rows={3}
                                    maxLength={500}
                                />

                                <button
                                    onClick={handleSubmitRating}
                                    disabled={submittingRating || rating === 0}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submittingRating ? (
                                        <>
                                            <FiLoader className="animate-spin" /> {t.enviando}
                                        </>
                                    ) : (
                                        t.enviarCalificacion
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Rating Submitted */}
                        {ratingSubmitted && (
                            <div className="bg-green-100 border-2 border-green-300 rounded-xl p-6 text-center">
                                <FiCheckCircle className="text-green-600 text-5xl mx-auto mb-3" />
                                <h3 className="text-xl font-bold text-green-900 mb-2">{t.graciasCalificacion}</h3>
                                <p className="text-green-700">{t.opinionAyuda}</p>
                            </div>
                        )}

                        {/* Botón Cancelar */}
                        {puedeCancelar && (
                            <div className="text-center">
                                <button
                                    onClick={handleCancelReservation}
                                    disabled={cancelling}
                                    className="px-6 py-2 text-red-600 hover:text-red-700 font-medium hover:underline disabled:opacity-50"
                                >
                                    {cancelling ? t.cancelando : t.cancelarReserva}
                                </button>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t.cancelarMensaje}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}