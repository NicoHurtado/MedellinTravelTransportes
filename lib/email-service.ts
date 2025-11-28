import { transporter } from './email';
import { getEmailLayout, formatPrice, formatDate } from './email-templates';
import { Reserva, Servicio, Conductor, Vehiculo } from '@prisma/client';

type ReservaWithRelations = Reserva & {
  servicio: Servicio;
  conductor?: Conductor | null;
  vehiculo?: Vehiculo | null;
};

// Helper to get localized text from JSON
const getLocalizedName = (json: any, lang: 'ES' | 'EN') => {
  try {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return obj[lang === 'ES' ? 'es' : 'en'] || obj['es'] || '';
  } catch (e) {
    return '';
  }
};

// ============================================
// TRIGGER 1: Reserva Confirmada
// ============================================
export async function sendReservaConfirmadaEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);
  const { origen, destino } = getOriginDestination(reserva, language);

  const content = language === 'ES' ? `
    <h1>¡Reserva Confirmada! 🎉</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Tu reserva ha sido confirmada exitosamente. A continuación encontrarás los detalles:</p>
    
    <div class="info-box">
      <h2>Código de Reserva</h2>
      <p style="font-size: 24px; font-weight: bold; color: #D6A75D; margin: 0;">${reserva.codigo}</p>
    </div>
    
    <h2>Detalles del Servicio</h2>
    <div style="margin: 16px 0;">
      <p><strong>Servicio:</strong> ${serviceName}</p>
      <p><strong>Fecha:</strong> ${formatDate(reserva.fecha, language)}</p>
      <p><strong>Hora:</strong> ${reserva.hora}</p>
      <p><strong>Origen:</strong> ${origen}</p>
      <p><strong>Destino:</strong> ${destino}</p>
      <p><strong>Municipio:</strong> ${reserva.municipio}</p>
      <p><strong>Pasajeros:</strong> ${reserva.numeroPasajeros} personas</p>
      ${reserva.vehiculo ? `<p><strong>Vehículo:</strong> ${reserva.vehiculo.nombre}</p>` : ''}
    </div>

    ${reserva.notas ? `
    <div class="info-box" style="background-color: #f9fafb; border-left-color: #9ca3af;">
      <h3 style="margin-top: 0; font-size: 16px;">Notas Adicionales</h3>
      <p style="margin-bottom: 0;">${reserva.notas}</p>
    </div>
    ` : ''}
    
    <h2>Total a Pagar</h2>
    <p class="price">${formatPrice(Number(reserva.precioTotal))}</p>
    
    ${!reserva.esReservaAliado ? `
      <p style="margin-top: 24px;">
        <a href="${trackingUrl}" class="button">Realizar Pago</a>
      </p>
      <p style="color: #666; font-size: 14px;">Debes completar el pago para confirmar tu reserva.</p>
    ` : `
      <div class="info-box">
        <p><strong>Nota:</strong> El pago se realizará en efectivo al momento del servicio.</p>
      </div>
    `}
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Ver Estado de Mi Reserva</a>
    </p>
    
    <p>¡Gracias por confiar en nosotros!</p>
  ` : `
    <h1>Booking Confirmed! 🎉</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Your booking has been confirmed successfully. Here are the details:</p>
    
    <div class="info-box">
      <h2>Booking Code</h2>
      <p style="font-size: 24px; font-weight: bold; color: #D6A75D; margin: 0;">${reserva.codigo}</p>
    </div>
    
    <h2>Service Details</h2>
    <div style="margin: 16px 0;">
      <p><strong>Service:</strong> ${serviceName}</p>
      <p><strong>Date:</strong> ${formatDate(reserva.fecha, language)}</p>
      <p><strong>Time:</strong> ${reserva.hora}</p>
      <p><strong>Origin:</strong> ${origen}</p>
      <p><strong>Destination:</strong> ${destino}</p>
      <p><strong>City:</strong> ${reserva.municipio}</p>
      <p><strong>Passengers:</strong> ${reserva.numeroPasajeros} people</p>
      ${reserva.vehiculo ? `<p><strong>Vehicle:</strong> ${reserva.vehiculo.nombre}</p>` : ''}
    </div>

    ${reserva.notas ? `
    <div class="info-box" style="background-color: #f9fafb; border-left-color: #9ca3af;">
      <h3 style="margin-top: 0; font-size: 16px;">Additional Notes</h3>
      <p style="margin-bottom: 0;">${reserva.notas}</p>
    </div>
    ` : ''}
    
    <h2>Total Amount</h2>
    <p class="price">${formatPrice(Number(reserva.precioTotal))}</p>
    
    ${!reserva.esReservaAliado ? `
      <p style="margin-top: 24px;">
        <a href="${trackingUrl}" class="button">Make Payment</a>
      </p>
      <p style="color: #666; font-size: 14px;">You must complete the payment to confirm your booking.</p>
    ` : `
      <div class="info-box">
        <p><strong>Note:</strong> Payment will be made in cash at the time of service.</p>
      </div>
    `}
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">View My Booking Status</a>
    </p>
    
    <p>Thank you for trusting us!</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Reserva Confirmada - ${reserva.codigo}`
      : `Booking Confirmed - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 2: Cambio de Estado
// ============================================
export async function sendCambioEstadoEmail(
  reserva: ReservaWithRelations,
  estadoAnterior: string,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);

  const estadoTexto = {
    ES: {
      PENDIENTE_COTIZACION: 'Pendiente de Cotización',
      CONFIRMADA_PENDIENTE_PAGO: 'Confirmada - Pendiente de Pago',
      PAGADA_PENDIENTE_ASIGNACION: 'Pagada - Pendiente de Asignación',
      ASIGNADA_PENDIENTE_COMPLETAR: 'Asignada - Pendiente de Completar',
      COMPLETADA: 'Completada',
      CANCELADA: 'Cancelada',
    },
    EN: {
      PENDIENTE_COTIZACION: 'Pending Quote',
      CONFIRMADA_PENDIENTE_PAGO: 'Confirmed - Pending Payment',
      PAGADA_PENDIENTE_ASIGNACION: 'Paid - Pending Assignment',
      ASIGNADA_PENDIENTE_COMPLETAR: 'Assigned - Pending Completion',
      COMPLETADA: 'Completed',
      CANCELADA: 'Cancelled',
    }
  };

  const content = language === 'ES' ? `
    <h1>Actualización de tu Reserva</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>El estado de tu reserva <strong>${reserva.codigo}</strong> ha cambiado:</p>
    
    <div class="info-box">
      <p style="margin: 0;">
        <span style="color: #666;">Estado anterior:</span><br>
        <strong>${estadoTexto.ES[estadoAnterior as keyof typeof estadoTexto.ES]}</strong>
      </p>
    </div>
    
    <div class="info-box" style="background-color: #D6A75D20;">
      <p style="margin: 0;">
        <span style="color: #666;">Estado actual:</span><br>
        <strong style="color: #D6A75D;">${estadoTexto.ES[reserva.estado]}</strong>
      </p>
    </div>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Ver Detalles de Mi Reserva</a>
    </p>
  ` : `
    <h1>Booking Update</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>The status of your booking <strong>${reserva.codigo}</strong> has changed:</p>
    
    <div class="info-box">
      <p style="margin: 0;">
        <span style="color: #666;">Previous status:</span><br>
        <strong>${estadoTexto.EN[estadoAnterior as keyof typeof estadoTexto.EN]}</strong>
      </p>
    </div>
    
    <div class="info-box" style="background-color: #D6A75D20;">
      <p style="margin: 0;">
        <span style="color: #666;">Current status:</span><br>
        <strong style="color: #D6A75D;">${estadoTexto.EN[reserva.estado]}</strong>
      </p>
    </div>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">View My Booking Details</a>
    </p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Actualización de Reserva - ${reserva.codigo}`
      : `Booking Update - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 3: Pago Aprobado
// ============================================
export async function sendPagoAprobadoEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;

  const content = language === 'ES' ? `
    <h1>¡Pago Recibido! ✅</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Hemos recibido tu pago exitosamente. Tu reserva ahora está <strong>confirmada y pagada</strong>.</p>
    
    <div class="info-box" style="background-color: #86EFAC20; border-color: #166534;">
      <h2 style="color: #166534; margin-top: 0;">Recibo de Pago</h2>
      <p><strong>Código de Reserva:</strong> ${reserva.codigo}</p>
      <p><strong>Monto Pagado:</strong> <span class="price" style="font-size: 20px;">${formatPrice(Number(reserva.precioTotal))}</span></p>
      <p><strong>Fecha de Pago:</strong> ${formatDate(new Date(), language)}</p>
      ${reserva.pagoId ? `<p><strong>ID de Transacción:</strong> ${reserva.pagoId}</p>` : ''}
    </div>
    
    <h2>Próximos Pasos</h2>
    <p>Pronto te asignaremos un conductor. Recibirás un email con sus datos de contacto.</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Ver Estado de Mi Reserva</a>
    </p>
    
    <p>¡Gracias por tu pago!</p>
  ` : `
    <h1>Payment Received! ✅</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>We have successfully received your payment. Your booking is now <strong>confirmed and paid</strong>.</p>
    
    <div class="info-box" style="background-color: #86EFAC20; border-color: #166534;">
      <h2 style="color: #166534; margin-top: 0;">Payment Receipt</h2>
      <p><strong>Booking Code:</strong> ${reserva.codigo}</p>
      <p><strong>Amount Paid:</strong> <span class="price" style="font-size: 20px;">${formatPrice(Number(reserva.precioTotal))}</span></p>
      <p><strong>Payment Date:</strong> ${formatDate(new Date(), language)}</p>
      ${reserva.pagoId ? `<p><strong>Transaction ID:</strong> ${reserva.pagoId}</p>` : ''}
    </div>
    
    <h2>Next Steps</h2>
    <p>We will soon assign you a driver. You will receive an email with their contact details.</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">View My Booking Status</a>
    </p>
    
    <p>Thank you for your payment!</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Pago Confirmado - ${reserva.codigo}`
      : `Payment Confirmed - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 4: Conductor Asignado
// ============================================
export async function sendConductorAsignadoEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  if (!reserva.conductor || !reserva.vehiculo) {
    throw new Error('Conductor y vehículo deben estar asignados');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;
  const whatsappUrl = `https://wa.me/${reserva.conductor.whatsapp.replace(/\D/g, '')}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);

  const content = language === 'ES' ? `
    <h1>¡Conductor Asignado! 🚗</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Te hemos asignado un conductor para tu viaje. A continuación sus datos de contacto:</p>
    
    <div class="info-box" style="background-color: #3B82F620; border-color: #3B82F6;">
      <h2 style="color: #3B82F6; margin-top: 0;">Información del Conductor</h2>
      <p><strong>Nombre:</strong> ${reserva.conductor.nombre}</p>

      <p style="color: #666; font-size: 14px; margin-top: 12px;">Disponible para coordinar detalles del viaje</p>
    </div>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">Vehículo Asignado</h2>
      <p><strong>Tipo:</strong> ${reserva.vehiculo.nombre}</p>
    </div>
    
    <h2>Detalles del Viaje</h2>
    <p><strong>Servicio:</strong> ${serviceName}</p>
    <p><strong>Fecha:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Hora:</strong> ${reserva.hora}</p>
    

    
    <p style="margin-top: 16px;">
      <a href="${trackingUrl}" class="button">Ver Estado de Mi Reserva</a>
    </p>
    
    <p>¡Nos vemos pronto!</p>
  ` : `
    <h1>Driver Assigned! 🚗</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>We have assigned a driver for your trip. Here are their contact details:</p>
    
    <div class="info-box" style="background-color: #3B82F620; border-color: #3B82F6;">
      <h2 style="color: #3B82F6; margin-top: 0;">Driver Information</h2>
      <p><strong>Name:</strong> ${reserva.conductor.nombre}</p>

      <p style="color: #666; font-size: 14px; margin-top: 12px;">Available to coordinate trip details</p>
    </div>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">Assigned Vehicle</h2>
      <p><strong>Type:</strong> ${reserva.vehiculo.nombre}</p>
    </div>
    
    <h2>Trip Details</h2>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Date:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Time:</strong> ${reserva.hora}</p>
    

    
    <p style="margin-top: 16px;">
      <a href="${trackingUrl}" class="button">View My Booking Status</a>
    </p>
    
    <p>See you soon!</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Conductor Asignado - ${reserva.codigo}`
      : `Driver Assigned - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 5: Servicio Completado
// ============================================
export async function sendServicioCompletadoEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const ratingUrl = `${appUrl}/rate/${reserva.id}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);

  const content = language === 'ES' ? `
    <h1>¡Gracias por Elegirnos! ⭐</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Esperamos que hayas disfrutado tu experiencia con nosotros.</p>
    
    <div class="info-box" style="background-color: #86EFAC20; border-color: #166534;">
      <p style="margin: 0; color: #166534;"><strong>✅ Servicio Completado</strong></p>
      <p style="margin: 8px 0 0 0;">${serviceName}</p>
    </div>
    
    <h2>Califica tu Experiencia</h2>
    <p>Tu opinión es muy importante para nosotros. Por favor, tómate un momento para calificar nuestro servicio:</p>
    
    <p style="margin-top: 24px; text-align: center;">
      <a href="${ratingUrl}" class="button" style="font-size: 18px;">⭐ Calificar Servicio</a>
    </p>
    
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 16px;">
      Tu calificación nos ayuda a mejorar continuamente
    </p>
    
    <p style="margin-top: 32px;">¡Esperamos verte pronto de nuevo!</p>
  ` : `
    <h1>Thank You for Choosing Us! ⭐</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>We hope you enjoyed your experience with us.</p>
    
    <div class="info-box" style="background-color: #86EFAC20; border-color: #166534;">
      <p style="margin: 0; color: #166534;"><strong>✅ Service Completed</strong></p>
      <p style="margin: 8px 0 0 0;">${serviceName}</p>
    </div>
    
    <h2>Rate Your Experience</h2>
    <p>Your opinion is very important to us. Please take a moment to rate our service:</p>
    
    <p style="margin-top: 24px; text-align: center;">
      <a href="${ratingUrl}" class="button" style="font-size: 18px;">⭐ Rate Service</a>
    </p>
    
    <p style="text-align: center; color: #666; font-size: 14px; margin-top: 16px;">
      Your rating helps us continuously improve
    </p>
    
    <p style="margin-top: 32px;">We hope to see you again soon!</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `¡Gracias por Elegirnos! - ${reserva.codigo}`
      : `Thank You for Choosing Us! - ${reserva.codigo}`,
    html,
  });
}

// Helper to get Origin and Destination based on logic
const getOriginDestination = (reserva: ReservaWithRelations, language: 'ES' | 'EN') => {
  const isJMC = reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA';
  const airportName = isJMC ? 'Aeropuerto JMC' : 'Aeropuerto Olaya Herrera';

  let origen = '';
  let destino = '';

  if (reserva.aeropuertoTipo === 'DESDE') {
    origen = airportName;
    destino = reserva.lugarRecogida || (language === 'ES' ? 'Tu Hotel/Residencia' : 'Your Hotel/Residence');
  } else if (reserva.aeropuertoTipo === 'HACIA') {
    origen = reserva.lugarRecogida || (language === 'ES' ? 'Tu Hotel/Residencia' : 'Your Hotel/Residence');
    destino = airportName;
  } else {
    // Standard service / Tour
    origen = reserva.lugarRecogida || (language === 'ES' ? 'No especificado' : 'Not specified');

    const serviceName = getLocalizedName(reserva.servicio.nombre, language);
    destino = reserva.servicio.destinoAutoFill || serviceName || (language === 'ES' ? 'No especificado' : 'Not specified');
  }

  return { origen, destino };
};

// ============================================
// TRIGGER 6: Cotización Pendiente (Nueva)
// ============================================
export async function sendCotizacionPendienteEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);
  const { origen, destino } = getOriginDestination(reserva, language);

  const content = language === 'ES' ? `
    <h1>¡Reserva Recibida! ⏳</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Hemos recibido tu solicitud de reserva correctamente.</p>
    
    <div class="info-box" style="background-color: #FEF3C7; border-color: #D97706;">
      <h2 style="color: #D97706; margin-top: 0;">Pendiente de Cotización</h2>
      <p>Dado que tu destino es personalizado, nuestro equipo está calculando el mejor precio para ti.</p>
      <p><strong>En unos minutos recibirás un correo con la cotización final y el link de pago.</strong></p>
    </div>
    
    <h2>Detalles de la Solicitud</h2>
    <p><strong>Servicio:</strong> ${serviceName}</p>
    <p><strong>Fecha:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Origen:</strong> ${origen}</p>
    <p><strong>Destino:</strong> ${destino}</p>
    <p><strong>Municipio:</strong> ${reserva.otroMunicipio || reserva.municipio}</p>
    <p><strong>Pasajeros:</strong> ${reserva.numeroPasajeros} personas</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Ver Estado de Solicitud</a>
    </p>
    
    <p>¡Gracias por tu paciencia!</p>
  ` : `
    <h1>Booking Received! ⏳</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>We have successfully received your booking request.</p>
    
    <div class="info-box" style="background-color: #FEF3C7; border-color: #D97706;">
      <h2 style="color: #D97706; margin-top: 0;">Pending Quote</h2>
      <p>Since your destination is custom, our team is calculating the best price for you.</p>
      <p><strong>In a few minutes you will receive an email with the final quote and payment link.</strong></p>
    </div>
    
    <h2>Request Details</h2>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Date:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Origin:</strong> ${origen}</p>
    <p><strong>Destination:</strong> ${destino}</p>
    <p><strong>City:</strong> ${reserva.otroMunicipio || reserva.municipio}</p>
    <p><strong>Passengers:</strong> ${reserva.numeroPasajeros} people</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">View Request Status</a>
    </p>
    
    <p>Thank you for your patience!</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Reserva Recibida (Pendiente Cotización) - ${reserva.codigo}`
      : `Booking Received (Pending Quote) - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 7: Cotización Lista
// ============================================
export async function sendCotizacionListaEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trackingUrl = `${appUrl}/tracking/${reserva.codigo}`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);
  const { origen, destino } = getOriginDestination(reserva, language);

  const content = language === 'ES' ? `
    <h1>¡Tu Cotización Está Lista! 📋</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Hemos preparado tu cotización personalizada:</p>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">Código de Reserva</h2>
      <p style="font-size: 20px; font-weight: bold; color: #D6A75D; margin: 0;">${reserva.codigo}</p>
    </div>
    
    <h2>Detalles del Servicio</h2>
    <p><strong>Servicio:</strong> ${serviceName}</p>
    <p><strong>Fecha:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Origen:</strong> ${origen}</p>
    <p><strong>Destino:</strong> ${destino}</p>
    <p><strong>Pasajeros:</strong> ${reserva.numeroPasajeros} personas</p>
    
    <h2>Precio Total</h2>
    <p class="price">${formatPrice(Number(reserva.precioTotal))}</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Realizar Pago</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 16px;">
      Completa el pago para confirmar tu reserva
    </p>
  ` : `
    <h1>Your Quote is Ready! 📋</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>We have prepared your personalized quote:</p>
    
    <div class="info-box">
      <h2 style="margin-top: 0;">Booking Code</h2>
      <p style="font-size: 20px; font-weight: bold; color: #D6A75D; margin: 0;">${reserva.codigo}</p>
    </div>
    
    <h2>Service Details</h2>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Date:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Origin:</strong> ${origen}</p>
    <p><strong>Destination:</strong> ${destino}</p>
    <p><strong>Passengers:</strong> ${reserva.numeroPasajeros} people</p>
    
    <h2>Total Price</h2>
    <p class="price">${formatPrice(Number(reserva.precioTotal))}</p>
    
    <p style="margin-top: 24px;">
      <a href="${trackingUrl}" class="button">Make Payment</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 16px;">
      Complete the payment to confirm your booking
    </p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Cotización Lista - ${reserva.codigo}`
      : `Quote Ready - ${reserva.codigo}`,
    html,
  });
}

// ============================================
// TRIGGER 7: Reserva Cancelada
// ============================================
export async function sendCancelacionEmail(
  reserva: ReservaWithRelations,
  language: 'ES' | 'EN' = 'ES'
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const homeUrl = `${appUrl}/`;
  const serviceName = getLocalizedName(reserva.servicio.nombre, language);

  const content = language === 'ES' ? `
    <h1>Reserva Cancelada</h1>
    <p>Hola <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Tu reserva <strong>${reserva.codigo}</strong> ha sido cancelada exitosamente.</p>
    
    <div class="info-box" style="background-color: #FEE2E2; border-color: #EF4444;">
      <p style="margin: 0; color: #991B1B;"><strong>❌ Reserva Cancelada</strong></p>
      <p style="margin: 8px 0 0 0;">Código: ${reserva.codigo}</p>
    </div>
    
    <h2>Detalles de la Reserva Cancelada</h2>
    <p><strong>Servicio:</strong> ${serviceName}</p>
    <p><strong>Fecha:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Hora:</strong> ${reserva.hora}</p>
    <p><strong>Pasajeros:</strong> ${reserva.numeroPasajeros} personas</p>
    
    ${reserva.estadoPago === 'APROBADO' ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Reembolso</h3>
        <p>El monto de <strong>${formatPrice(Number(reserva.precioTotal))}</strong> será reembolsado en un plazo de 5-7 días hábiles.</p>
        <p style="color: #666; font-size: 14px;">Recibirás una notificación cuando el reembolso sea procesado.</p>
      </div>
    ` : ''}
    
    <p style="margin-top: 24px;">
      <a href="${homeUrl}" class="button">Hacer Nueva Reserva</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      Si tienes alguna pregunta, no dudes en contactarnos por WhatsApp: 
      <a href="https://wa.me/573175177409" style="color: #25D366; font-weight: bold;">+57 317 5177409</a>
    </p>
    
    <p>Esperamos verte pronto de nuevo.</p>
  ` : `
    <h1>Booking Cancelled</h1>
    <p>Hello <strong>${reserva.nombreCliente}</strong>,</p>
    <p>Your booking <strong>${reserva.codigo}</strong> has been successfully cancelled.</p>
    
    <div class="info-box" style="background-color: #FEE2E2; border-color: #EF4444;">
      <p style="margin: 0; color: #991B1B;"><strong>❌ Booking Cancelled</strong></p>
      <p style="margin: 8px 0 0 0;">Code: ${reserva.codigo}</p>
    </div>
    
    <h2>Cancelled Booking Details</h2>
    <p><strong>Service:</strong> ${serviceName}</p>
    <p><strong>Date:</strong> ${formatDate(reserva.fecha, language)}</p>
    <p><strong>Time:</strong> ${reserva.hora}</p>
    <p><strong>Passengers:</strong> ${reserva.numeroPasajeros} people</p>
    
    ${reserva.estadoPago === 'APROBADO' ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">Refund</h3>
        <p>The amount of <strong>${formatPrice(Number(reserva.precioTotal))}</strong> will be refunded within 5-7 business days.</p>
        <p style="color: #666; font-size: 14px;">You will receive a notification when the refund is processed.</p>
      </div>
    ` : ''}
    
    <p style="margin-top: 24px;">
      <a href="${homeUrl}" class="button">Make New Booking</a>
    </p>
    
    <p style="color: #666; font-size: 14px; margin-top: 24px;">
      If you have any questions, don't hesitate to contact us via WhatsApp: 
      <a href="https://wa.me/573175177409" style="color: #25D366; font-weight: bold;">+57 317 5177409</a>
    </p>
    
    <p>We hope to see you again soon.</p>
  `;

  const html = getEmailLayout(content, language);

  await transporter.sendMail({
    from: `"Transportes Medellín Travel" <${process.env.GMAIL_USER}>`,
    to: reserva.emailCliente,
    subject: language === 'ES'
      ? `Reserva Cancelada - ${reserva.codigo}`
      : `Booking Cancelled - ${reserva.codigo}`,
    html,
  });
}
