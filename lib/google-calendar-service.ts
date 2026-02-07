import { google } from 'googleapis';
import { Reserva, Servicio, Conductor, Vehiculo, Aliado } from '@prisma/client';

// Tipo extendido para incluir relaciones
type ReservaConRelaciones = Reserva & {
    servicio: Servicio;
    conductor?: Conductor | null;
    vehiculo?: Vehiculo | null;
    aliado?: Aliado | null;
    asistentes?: Array<{
        nombre: string;
        tipoDocumento: string;
        numeroDocumento: string;
    }>;
};

/**
 * Google Calendar Service
 * Maneja la creación, actualización y eliminación de eventos en Google Calendar
 */

// Configuración de autenticación
function getCalendarClient() {
    const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
    const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

    if (!GOOGLE_CALENDAR_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
        throw new Error('Google Calendar credentials not configured. Please set GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY environment variables.');
    }

    // Crear cliente de autenticación JWT
    const auth = new google.auth.JWT({
        email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Reemplazar \n literales con saltos de línea reales
        scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    return {
        calendar: google.calendar({ version: 'v3', auth }),
        calendarId: GOOGLE_CALENDAR_ID,
    };
}

/**
 * Formatea la información de la reserva para el evento de calendario
 */
function formatEventDetails(reserva: ReservaConRelaciones): {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    reminders: { useDefault: boolean; overrides: Array<{ method: string; minutes: number }> };
} {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Título del evento
    const summary = `Reserva #${reserva.codigo} - ${reserva.nombreCliente}`;

    // Determinar origen y destino según el tipo de servicio
    let origen = '';
    let destino = '';
    let municipio = '';

    // Formatear el municipio
    if (reserva.municipio === 'OTRO' && reserva.otroMunicipio) {
        municipio = reserva.otroMunicipio;
    } else {
        municipio = reserva.municipio || '';
    }

    if (reserva.aeropuertoTipo === 'DESDE') {
        // Desde aeropuerto hacia ciudad
        origen = reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA'
            ? 'Aeropuerto José María Córdova'
            : 'Aeropuerto Olaya Herrera';
        destino = reserva.lugarRecogida || municipio;
    } else if (reserva.aeropuertoTipo === 'HACIA') {
        // Desde ciudad hacia aeropuerto
        origen = reserva.lugarRecogida || municipio;
        destino = reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA'
            ? 'Aeropuerto José María Córdova'
            : 'Aeropuerto Olaya Herrera';
    } else {
        // Para otros servicios (tours, etc.)
        origen = reserva.lugarRecogida || 'Por definir';
        destino = reserva.municipio === 'OTRO' && reserva.otroMunicipio
            ? reserva.otroMunicipio
            : reserva.municipio || '';
    }

    // Construir descripción detallada
    const descripcionParts = [
        `📋 INFORMACIÓN DE LA RESERVA`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `👤 Cliente: ${reserva.nombreCliente}`,
        `📱 WhatsApp: ${reserva.whatsappCliente}`,
        `📧 Email: ${reserva.emailCliente}`,
        ``,
        `🚗 DETALLES DEL SERVICIO`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📍 Origen: ${origen}`,
        `📍 Destino: ${destino}`,
        `🏙️ Municipio: ${municipio}`,
        `🎯 Servicio: ${typeof reserva.servicio.nombre === 'object' ? (reserva.servicio.nombre as any).es : reserva.servicio.nombre}`,
        `👥 Pasajeros: ${reserva.numeroPasajeros}`,
        `💰 Precio Total: $${Number(reserva.precioTotal).toLocaleString('es-CO')} COP`,
        ``,
    ];

    // Información de Pasajeros (Asistentes)
    if (reserva.asistentes && reserva.asistentes.length > 0) {
        descripcionParts.push(
            `👥 PASAJEROS REGISTRADOS`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``
        );
        reserva.asistentes.forEach((asistente, index) => {
            descripcionParts.push(
                `${index + 1}. ${asistente.nombre}`,
                `   ${asistente.tipoDocumento}: ${asistente.numeroDocumento}`,
                ``
            );
        });
    }

    // Información del vehículo
    if (reserva.vehiculo) {
        descripcionParts.push(`🚙 Vehículo: ${reserva.vehiculo.nombre}`);
    }

    // Información del conductor
    if (reserva.conductor) {
        descripcionParts.push(
            ``,
            `👨‍✈️ CONDUCTOR ASIGNADO`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `Nombre: ${reserva.conductor.nombre}`,
            `WhatsApp: ${reserva.conductor.whatsapp}`,
            `Placa: ${reserva.conductor.placa}`,
            ``
        );
    }

    // Información del aliado
    if (reserva.aliado) {
        descripcionParts.push(
            ``,
            `🏨 ALIADO`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            `${reserva.aliado.nombre} (${reserva.aliado.tipo})`,
            `Contacto: ${reserva.aliado.contacto}`,
            ``
        );
    }

    // Información adicional
    if (reserva.numeroVuelo) {
        descripcionParts.push(`✈️ Vuelo: ${reserva.numeroVuelo}`);
    }

    if (reserva.notas) {
        descripcionParts.push(
            ``,
            `📝 NOTAS DEL CLIENTE`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            ``,
            reserva.notas,
            ``
        );
    }

    // Estado
    descripcionParts.push(
        ``,
        `📊 ESTADO`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `Estado: ${reserva.estado.replace(/_/g, ' ')}`,
        ``
    );

    // Links importantes
    descripcionParts.push(
        ``,
        `🔗 LINKS`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📱 Tracking: ${APP_URL}/tracking/${reserva.codigo}`,
        `⚙️ Dashboard Admin: ${APP_URL}/admin/dashboard/reservas`,
        ``
    );

    const description = descripcionParts.join('\n');

    // Construir fecha y hora correctamente en zona horaria de Colombia
    const fechaReserva = new Date(reserva.fecha);
    const [horas, minutos] = reserva.hora.split(':').map(Number);

    // Obtener año, mes, día de la fecha de reserva
    const year = fechaReserva.getUTCFullYear();
    const month = fechaReserva.getUTCMonth();
    const day = fechaReserva.getUTCDate();

    // Crear fecha en formato ISO para Colombia (America/Bogota es UTC-5)
    // Construir la fecha y hora en formato ISO sin conversión de zona horaria
    const fechaInicio = new Date(year, month, day, horas, minutos, 0, 0);
    // El usuario quiere que sea a la misma hora (sin rango), así que fechaFin = fechaInicio
    const fechaFin = new Date(year, month, day, horas, minutos, 0, 0);

    // Formatear en ISO pero manteniendo la zona horaria de Colombia
    const formatDateForColombia = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    return {
        summary,
        description,
        start: {
            dateTime: formatDateForColombia(fechaInicio),
            timeZone: 'America/Bogota',
        },
        end: {
            dateTime: formatDateForColombia(fechaFin),
            timeZone: 'America/Bogota',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 24 * 60 }, // 24 horas antes
                { method: 'popup', minutes: 2 * 60 },  // 2 horas antes
            ],
        },
    };
}

/**
 * Crea un evento en Google Calendar para una reserva
 * @param reserva - Reserva con relaciones incluidas
 * @returns ID del evento creado o null si falla
 */
export async function createCalendarEvent(
    reserva: ReservaConRelaciones
): Promise<string | null> {
    try {
        const { calendar, calendarId } = getCalendarClient();
        const eventDetails = formatEventDetails(reserva);

        const response = await calendar.events.insert({
            calendarId,
            requestBody: eventDetails,
        });

        console.log('✅ [Google Calendar] Event created:', response.data.id);
        return response.data.id || null;
    } catch (error) {
        console.error('❌ [Google Calendar] Error creating event:', error);
        // No lanzar error - permitir que la reserva se cree aunque falle el calendario
        return null;
    }
}

/**
 * Actualiza un evento existente en Google Calendar
 * @param reserva - Reserva actualizada con relaciones incluidas
 * @returns true si se actualizó correctamente, false si falló
 */
export async function updateCalendarEvent(
    reserva: ReservaConRelaciones
): Promise<boolean> {
    try {
        if (!reserva.googleCalendarEventId) {
            console.warn('⚠️ [Google Calendar] No event ID found for reservation:', reserva.codigo);
            return false;
        }

        const { calendar, calendarId } = getCalendarClient();
        const eventDetails = formatEventDetails(reserva);

        await calendar.events.update({
            calendarId,
            eventId: reserva.googleCalendarEventId,
            requestBody: eventDetails,
        });

        console.log('✅ [Google Calendar] Event updated:', reserva.googleCalendarEventId);
        return true;
    } catch (error) {
        console.error('❌ [Google Calendar] Error updating event:', error);
        return false;
    }
}

/**
 * Elimina un evento de Google Calendar
 * @param eventId - ID del evento a eliminar
 * @returns true si se eliminó correctamente, false si falló
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
        const { calendar, calendarId } = getCalendarClient();

        await calendar.events.delete({
            calendarId,
            eventId,
        });

        console.log('✅ [Google Calendar] Event deleted:', eventId);
        return true;
    } catch (error) {
        console.error('❌ [Google Calendar] Error deleting event:', error);
        return false;
    }
}

// ============================================
// TOUR COMPARTIDO - CONSOLIDATED CALENDAR EVENTS
// ============================================

import { prisma } from '@/lib/prisma';

type ReservaConAsistentes = ReservaConRelaciones & {
    asistentes?: Array<{
        id: string;
        nombre: string;
        tipoDocumento: string;
        numeroDocumento: string;
    }>;
};

/**
 * Formatea la información consolidada de múltiples reservas de Tour Compartido
 * para un solo evento de calendario
 */
function formatTourCompartidoEventDetails(
    reservas: ReservaConAsistentes[],
    totalPasajeros: number
): {
    summary: string;
    description: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    reminders: { useDefault: boolean; overrides: Array<{ method: string; minutes: number }> };
} {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const primeraReserva = reservas[0];

    // Get service name
    const servicioNombre = typeof primeraReserva.servicio.nombre === 'object'
        ? (primeraReserva.servicio.nombre as any).es
        : primeraReserva.servicio.nombre;

    // Título consolidado del evento
    const summary = `🚌 ${servicioNombre} - ${totalPasajeros} personas (${reservas.length} reservas)`;

    // Construir descripción con todas las reservas
    const descripcionParts = [
        `🚌 TOUR COMPARTIDO CONSOLIDADO`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📅 Fecha: ${new Date(primeraReserva.fecha).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })}`,
        `🎯 Servicio: ${servicioNombre}`,
        `👥 CUPO TOTAL: ${totalPasajeros} personas`,
        `📋 Total Reservas: ${reservas.length}`,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `📋 DETALLE POR RESERVA`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``
    ];

    // Agregar detalle de cada reserva
    reservas.forEach((reserva, index) => {
        descripcionParts.push(
            ``,
            `🎫 RESERVA ${index + 1}: #${reserva.codigo}`,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `👤 Cliente: ${reserva.nombreCliente}`,
            `📱 WhatsApp: ${reserva.whatsappCliente}`,
            `📧 Email: ${reserva.emailCliente}`,
            `👥 Pasajeros: ${reserva.numeroPasajeros}`,
            `💰 Precio: $${Number(reserva.precioTotal).toLocaleString('es-CO')} COP`,
            `📊 Estado: ${reserva.estado.replace(/_/g, ' ')}`,
            `🔗 Tracking: ${APP_URL}/tracking/${reserva.codigo}`
        );

        // Agregar asistentes si existen
        if (reserva.asistentes && reserva.asistentes.length > 0) {
            descripcionParts.push(``, `   👥 Pasajeros:`);
            reserva.asistentes.forEach((asistente) => {
                descripcionParts.push(`   - ${asistente.nombre} (${asistente.tipoDocumento}: ${asistente.numeroDocumento})`);
            });
        }

        // Agregar aliado si existe
        if (reserva.aliado) {
            descripcionParts.push(`🏨 Aliado: ${reserva.aliado.nombre}`);
        }

        // Agregar notas si existen
        if (reserva.notas) {
            descripcionParts.push(`📝 Notas: ${reserva.notas}`);
        }

        descripcionParts.push(``);
    });

    // Links importantes
    descripcionParts.push(
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🔗 LINKS`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `⚙️ Dashboard Admin: ${APP_URL}/admin/dashboard`,
        ``
    );

    const description = descripcionParts.join('\n');

    // Usar la hora de la primera reserva o 8:00 AM por defecto
    const fechaReserva = new Date(primeraReserva.fecha);
    const [horas, minutos] = primeraReserva.hora.split(':').map(Number);

    const year = fechaReserva.getUTCFullYear();
    const month = fechaReserva.getUTCMonth();
    const day = fechaReserva.getUTCDate();

    const fechaInicio = new Date(year, month, day, horas, minutos, 0, 0);
    const fechaFin = new Date(year, month, day, horas, minutos, 0, 0);

    const formatDateForColombia = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return `${y}-${m}-${d}T${h}:${min}:${s}`;
    };

    return {
        summary,
        description,
        start: {
            dateTime: formatDateForColombia(fechaInicio),
            timeZone: 'America/Bogota',
        },
        end: {
            dateTime: formatDateForColombia(fechaFin),
            timeZone: 'America/Bogota',
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 24 * 60 },
                { method: 'popup', minutes: 2 * 60 },
            ],
        },
    };
}

/**
 * Crea o actualiza un evento consolidado de Tour Compartido en Google Calendar.
 * Si ya existe un evento para la misma fecha, lo actualiza agregando la nueva reserva.
 * Si no existe, crea un nuevo evento.
 * @param reserva - Nueva reserva de Tour Compartido con relaciones incluidas
 * @returns ID del evento creado/actualizado o null si falla
 */
export async function createOrUpdateTourCompartidoEvent(
    reserva: ReservaConRelaciones
): Promise<string | null> {
    try {
        console.log('🚌 [Tour Compartido Calendar] Processing reservation:', reserva.codigo);

        // 1. Buscar todas las reservas PAGADAS del mismo día y servicio
        // Excluir CONFIRMADA_PENDIENTE_PAGO - solo incluir reservas ya pagadas
        const fechaReserva = new Date(reserva.fecha);
        const startOfDay = new Date(fechaReserva.getFullYear(), fechaReserva.getMonth(), fechaReserva.getDate());
        const endOfDay = new Date(fechaReserva.getFullYear(), fechaReserva.getMonth(), fechaReserva.getDate() + 1);

        const reservasDelDia = await prisma.reserva.findMany({
            where: {
                servicioId: reserva.servicioId,
                fecha: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                servicio: { tipo: 'TOUR_COMPARTIDO' },
                // 🔥 Solo incluir reservas que ya han sido pagadas
                estado: {
                    not: 'CONFIRMADA_PENDIENTE_PAGO'
                }
            },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true,
                asistentes: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`🚌 [Tour Compartido Calendar] Found ${reservasDelDia.length} reservations for this date`);

        // 2. Calcular totales
        const totalPasajeros = reservasDelDia.reduce((sum, r) => sum + r.numeroPasajeros, 0);
        console.log(`🚌 [Tour Compartido Calendar] Total passengers: ${totalPasajeros}`);

        // 3. Buscar si ya existe un evento de calendario (usando el ID de cualquier reserva existente)
        const existingEventId = reservasDelDia.find(r => r.googleCalendarEventId)?.googleCalendarEventId;

        const { calendar, calendarId } = getCalendarClient();
        const eventDetails = formatTourCompartidoEventDetails(reservasDelDia as ReservaConAsistentes[], totalPasajeros);

        let eventId: string | null = null;

        if (existingEventId) {
            // 4a. Actualizar evento existente
            console.log(`🚌 [Tour Compartido Calendar] Updating existing event: ${existingEventId}`);
            try {
                await calendar.events.update({
                    calendarId,
                    eventId: existingEventId,
                    requestBody: eventDetails,
                });
                eventId = existingEventId;
                console.log('✅ [Tour Compartido Calendar] Event updated:', eventId);
            } catch (updateError) {
                console.error('⚠️ [Tour Compartido Calendar] Error updating, creating new:', updateError);
                // Si falla la actualización (evento eliminado), crear uno nuevo
                const response = await calendar.events.insert({
                    calendarId,
                    requestBody: eventDetails,
                });
                eventId = response.data.id || null;
                console.log('✅ [Tour Compartido Calendar] New event created after failed update:', eventId);
            }
        } else {
            // 4b. Crear nuevo evento consolidado
            console.log('🚌 [Tour Compartido Calendar] Creating new consolidated event');
            const response = await calendar.events.insert({
                calendarId,
                requestBody: eventDetails,
            });
            eventId = response.data.id || null;
            console.log('✅ [Tour Compartido Calendar] New event created:', eventId);
        }

        // 5. Actualizar todas las reservas del día con el mismo eventId
        if (eventId) {
            await prisma.reserva.updateMany({
                where: {
                    id: { in: reservasDelDia.map(r => r.id) }
                },
                data: { googleCalendarEventId: eventId }
            });
            console.log(`✅ [Tour Compartido Calendar] Updated ${reservasDelDia.length} reservations with eventId`);
        }

        return eventId;
    } catch (error) {
        console.error('❌ [Tour Compartido Calendar] Error:', error);
        // No lanzar error - permitir que la reserva se cree aunque falle el calendario
        return null;
    }
}
