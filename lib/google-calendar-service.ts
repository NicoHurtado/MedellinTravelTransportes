import { google } from 'googleapis';
import { Reserva, Servicio, Conductor, Vehiculo, Aliado } from '@prisma/client';

// Tipo extendido para incluir relaciones
type ReservaConRelaciones = Reserva & {
    servicio: Servicio;
    conductor?: Conductor | null;
    vehiculo?: Vehiculo | null;
    aliado?: Aliado | null;
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
