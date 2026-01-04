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

    const fetchReservas = async () => {
        try {
            const res = await fetch('/api/reservas');
            const data = await res.json();
            const reservas = data.data || [];

            const calendarEvents: CalendarEvent[] = reservas.map((reserva: any) => {
                const colors = estadoColors[reserva.estado] || { bg: '#6B7280', border: '#4B5563' };

                return {
                    id: reserva.id,
                    title: `${reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'Servicio'} - ${reserva.nombreCliente}`,
                    start: reserva.fecha,
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                    extendedProps: {
                        codigo: reserva.codigo,
                        cliente: reserva.nombreCliente,
                        estado: reserva.estado,
                        hora: reserva.hora,
                        numeroVuelo: reserva.numeroVuelo,
                        esAeropuerto: reserva.servicio?.esAeropuerto
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
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Código</p>
                                        <p className="font-bold text-[#D6A75D] text-lg">
                                            {selectedEvent.extendedProps.codigo}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cliente</p>
                                        <p className="font-medium text-gray-900">{selectedEvent.extendedProps.cliente}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Servicio</p>
                                    <p className="font-medium text-gray-900 text-sm leading-snug">
                                        {selectedEvent.title.split(' - ')[0]}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fecha</p>
                                        <div className="flex items-center gap-2 text-gray-900 font-medium">
                                            <FiCalendar className="text-[#D6A75D]" />
                                            {new Date(selectedEvent.start).toLocaleDateString('es-CO')}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hora</p>
                                        <p className="font-medium text-gray-900">{selectedEvent.extendedProps.hora}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                                    <span
                                        className="inline-flex px-3 py-1 rounded-full text-xs font-semibold text-white items-center gap-2"
                                        style={{ backgroundColor: selectedEvent.backgroundColor }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                                        {selectedEvent.extendedProps.estado.replace(/_/g, ' ')}
                                    </span>
                                </div>

                                {selectedEvent.extendedProps.esAeropuerto && (
                                    <div className={`p-4 rounded-lg border-l-4 ${selectedEvent.extendedProps.numeroVuelo ? 'bg-blue-50 border-blue-500' : 'bg-yellow-50 border-yellow-400'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-xs font-bold uppercase tracking-wider ${selectedEvent.extendedProps.numeroVuelo ? 'text-blue-800' : 'text-yellow-800'}`}>
                                                    Vuelo
                                                </p>
                                                <p className={`font-mono text-lg font-bold mt-1 ${selectedEvent.extendedProps.numeroVuelo ? 'text-blue-900' : 'text-yellow-800 italic'}`}>
                                                    {selectedEvent.extendedProps.numeroVuelo || 'No especificado'}
                                                </p>
                                            </div>
                                            <div className="text-2xl">✈️</div>
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
