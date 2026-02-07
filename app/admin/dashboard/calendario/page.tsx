'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import { FiArrowLeft, FiCalendar, FiX } from 'react-icons/fi';
import { getLocalizedText } from '@/types/multi-language';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: {
        codigo: string;
        cliente: string;
        estado: string;
        hora: string;
        numeroVuelo?: string;
        esAeropuerto?: boolean;
        servicio: string;
        whatsappCliente: string;
        lugarRecogida: string;
        lugarDestino: string;

        estadoPago: string;
        asistentes: Array<{
            nombre: string;
            tipoDocumento: string;
            numeroDocumento: string;
        }>;
    };
}

const estadoColors: Record<string, { bg: string; border: string }> = {
    'PENDIENTE_COTIZACION': { bg: '#E69F00', border: '#D55E00' }, // Orange
    'CONFIRMADA_PENDIENTE_PAGO': { bg: '#9CA3AF', border: '#6B7280' },
    'PAGADA_PENDIENTE_ASIGNACION': { bg: '#3B82F6', border: '#2563EB' },
    'ASIGNADA_PENDIENTE_COMPLETAR': { bg: '#166534', border: '#14532D' },
    'COMPLETADA': { bg: '#009E73', border: '#0072B2' }, // Teal
    'CANCELADA': { bg: '#333333', border: '#000000' } // Dark Gray/Black
};

export default function CalendarioPage() {
    const router = useRouter();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    useEffect(() => {
        fetchReservas();
    }, []);

    // Auto-refresh when page becomes visible (e.g., when navigating back from detail view)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchReservas();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Auto-refresh every 30 seconds to show new reservations
    useEffect(() => {
        const interval = setInterval(() => {
            // Only refresh if page is visible
            if (document.visibilityState === 'visible') {
                fetchReservas();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

    const fetchReservas = async () => {
        try {
            const res = await fetch('/api/reservas');
            const data = await res.json();
            const reservas = data.data || [];

            const calendarEvents: CalendarEvent[] = reservas.map((reserva: any) => {
                const colors = estadoColors[reserva.estado] || { bg: '#6B7280', border: '#4B5563' };

                // Determine pickup and destination based on service type
                let lugarRecogida = 'No especificado';
                let lugarDestino = 'No especificado';

                if (reserva.servicio?.esAeropuerto) {
                    // Airport service
                    if (reserva.aeropuertoTipo === 'DESDE') {
                        // From airport to location
                        lugarRecogida = reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA'
                            ? 'Aeropuerto JMC'
                            : 'Aeropuerto Olaya Herrera';
                        lugarDestino = reserva.lugarRecogida || 'No especificado';
                    } else {
                        // From location to airport
                        lugarRecogida = reserva.lugarRecogida || 'No especificado';
                        lugarDestino = reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA'
                            ? 'Aeropuerto JMC'
                            : 'Aeropuerto Olaya Herrera';
                    }
                } else if (reserva.trasladoTipo) {
                    // Traslado service
                    if (reserva.trasladoTipo === 'DESDE_UBICACION') {
                        lugarRecogida = reserva.lugarRecogida || 'No especificado';
                        lugarDestino = reserva.trasladoDestino || reserva.municipio || 'No especificado';
                    } else {
                        lugarRecogida = reserva.municipio || 'No especificado';
                        lugarDestino = reserva.trasladoDestino || 'No especificado';
                    }
                } else {
                    // Regular service
                    lugarRecogida = reserva.lugarRecogida || 'No especificado';
                    lugarDestino = reserva.servicio?.destinoAutoFill
                        ? (typeof reserva.servicio.destinoAutoFill === 'string'
                            ? reserva.servicio.destinoAutoFill
                            : getLocalizedText(reserva.servicio.destinoAutoFill, 'ES'))
                        : 'No especificado';
                }

                return {
                    id: reserva.id,
                    title: `${reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'Servicio'} - ${reserva.nombreCliente}`,
                    start: reserva.fecha.split('T')[0], // Extract only YYYY-MM-DD to avoid timezone issues
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    extendedProps: {
                        codigo: reserva.codigo,
                        cliente: reserva.nombreCliente,
                        estado: reserva.estado,
                        hora: reserva.hora,
                        numeroVuelo: reserva.numeroVuelo,
                        esAeropuerto: reserva.servicio?.esAeropuerto,
                        servicio: reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'Servicio',
                        whatsappCliente: reserva.whatsappCliente || 'No especificado',
                        lugarRecogida,
                        lugarDestino,


                        estadoPago: reserva.estadoPago || 'PENDIENTE',
                        asistentes: reserva.asistentes || []
                    }
                };
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error fetching reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEventClick = (info: any) => {
        const event = info.event;
        setSelectedEvent({
            id: event.id,
            title: event.title,
            start: event.startStr,
            backgroundColor: event.backgroundColor,
            borderColor: event.borderColor,
            extendedProps: event.extendedProps
        });
    };

    const handleDateClick = (info: any) => {
        console.log('Date clicked:', info.dateStr);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Calendario de Reservas</h1>
                            <p className="text-sm text-gray-500 mt-1">Vista mensual de todas las reservas</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Calendar - Takes 3 columns */}
                    <div className="lg:col-span-3">
                        <Card>
                            <FullCalendar
                                plugins={[dayGridPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="es"
                                events={events}
                                eventOrder={(a: any, b: any) => {
                                    return (a.extendedProps.hora || '').localeCompare(b.extendedProps.hora || '');
                                }}
                                eventClick={handleEventClick}
                                dateClick={handleDateClick}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,dayGridWeek'
                                }}
                                buttonText={{
                                    today: 'Hoy',
                                    month: 'Mes',
                                    week: 'Semana',
                                    day: 'Día'
                                }}
                                height="auto"
                                eventDisplay="block"
                                displayEventTime={false}
                                eventClassNames="cursor-pointer hover:opacity-80 transition-opacity"
                            />
                        </Card>
                    </div>

                    {/* Sidebar - Takes 1 column */}
                    <div className="space-y-6">
                        {/* Legend */}
                        <Card>
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiCalendar />
                                Leyenda de Estados
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#E69F00' }} />
                                    <span className="text-sm text-gray-700">Pendiente Cotización</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9CA3AF' }} />
                                    <span className="text-sm text-gray-700">Confirmada - Pendiente Pago</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3B82F6' }} />
                                    <span className="text-sm text-gray-700">Pagada - Pendiente Asignación</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#166534' }} />
                                    <span className="text-sm text-gray-700">Asignada - Pendiente Completar</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#009E73' }} />
                                    <span className="text-sm text-gray-700">Completada</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: '#333333' }} />
                                    <span className="text-sm text-gray-700">Cancelada</span>
                                </div>
                            </div>
                        </Card>


                    </div>
                </div >
            </main >

            {/* Modal de Detalles de Reserva */}
            {selectedEvent && (
                <>
                    <div
                        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
                        onClick={() => setSelectedEvent(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all animate-in fade-in zoom-in-95 duration-200">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Detalles de la Reserva</h3>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-700"
                                >
                                    <FiX size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-3">
                                {/* Servicio */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Servicio</p>
                                    <p className="font-semibold text-gray-900">
                                        {selectedEvent.extendedProps.servicio}
                                    </p>
                                </div>

                                {/* Hora */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hora</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.extendedProps.hora}</p>
                                </div>

                                {/* Nombre Cliente */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Nombre Cliente</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.extendedProps.cliente}</p>
                                </div>

                                {/* Número Contacto */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Número Contacto</p>
                                    <p className="font-medium text-gray-900">{selectedEvent.extendedProps.whatsappCliente}</p>
                                </div>

                                {/* Lugar de Recogida */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lugar de Recogida</p>
                                    <p className="font-medium text-gray-900 text-sm">{selectedEvent.extendedProps.lugarRecogida}</p>
                                </div>

                                {/* Lugar Destino */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Lugar Destino</p>
                                    <p className="font-medium text-gray-900 text-sm">{selectedEvent.extendedProps.lugarDestino}</p>
                                </div>

                                {/* Estado Pago */}
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado Pago</p>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${selectedEvent.extendedProps.estadoPago === 'APROBADO'
                                        ? 'bg-green-100 text-green-800'
                                        : selectedEvent.extendedProps.estadoPago === 'RECHAZADO'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {selectedEvent.extendedProps.estadoPago}
                                    </span>
                                </div>

                                {/* Asistentes */}
                                {selectedEvent.extendedProps.asistentes && selectedEvent.extendedProps.asistentes.length > 0 && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                                            Pasajeros Registrados ({selectedEvent.extendedProps.asistentes.length})
                                        </p>
                                        <div className="bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto space-y-2">
                                            {selectedEvent.extendedProps.asistentes.map((asistente, index) => (
                                                <div key={index} className="text-sm border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                                                    <p className="font-semibold text-gray-900">{asistente.nombre}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {asistente.tipoDocumento}: {asistente.numeroDocumento}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex justify-end gap-3">
                                <Button
                                    onClick={() => setSelectedEvent(null)}
                                    variant="outline"
                                    className="border-gray-300 text-gray-700 hover:bg-white"
                                >
                                    Cerrar
                                </Button>
                                <Button
                                    onClick={() => router.push(`/admin/dashboard/reservas/${selectedEvent.id}`)}
                                    className="bg-[#D6A75D] hover:bg-[#c2954f] text-white shadow-lg shadow-orange-500/20"
                                >
                                    Ver Detalles Completos
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div >
    );
}
