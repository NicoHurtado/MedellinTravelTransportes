/**
 * Script de prueba para verificar envío de correos a nicolashamezquita@gmail.com
 * Cubre todos los escenarios: independiente, aliado (efectivo y bold), cotización
 *
 * Ejecutar: npx tsx scripts/test-emails-nicolas.ts
 */

// ⚠️ IMPORTANTE: Cargar .env ANTES de cualquier import que use process.env
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

function loadEnv() {
    const envPaths = [
        path.resolve(process.cwd(), '.env.local'),
        path.resolve(process.cwd(), '.env'),
    ];

    for (const envPath of envPaths) {
        try {
            const envFile = fs.readFileSync(envPath, 'utf-8');
            envFile.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const eqIndex = trimmed.indexOf('=');
                if (eqIndex === -1) return;
                const key = trimmed.slice(0, eqIndex).trim();
                let value = trimmed.slice(eqIndex + 1).trim();
                // Strip surrounding quotes
                value = value.replace(/^["']|["']$/g, '');
                if (key && !process.env[key]) {
                    process.env[key] = value;
                }
            });
            console.log(`✅ Env loaded from: ${envPath}`);
        } catch {
            // file doesn't exist, skip
        }
    }
}

loadEnv();

// Siempre usar la URL de producción para los links del correo
process.env.NEXT_PUBLIC_APP_URL = 'https://tmedellintravel.com';

// Ahora sí importar los módulos que usan process.env
import { Prisma, EstadoReserva, EstadoPago, TipoServicio } from '@prisma/client';

const testEmail = 'nicolashamezquita@gmail.com';

// Servicio mock genérico
const mockServicio = {
    id: '1',
    nombre: JSON.stringify({ es: 'Traslado Aeropuerto JMC', en: 'JMC Airport Transfer' }),
    descripcion: JSON.stringify({ es: 'Traslado privado al aeropuerto', en: 'Private airport transfer' }),
    imagen: '',
    tipo: TipoServicio.AEROPUERTO,
    duracion: null,
    horarioInicio: null,
    horarioFin: null,
    incluye: JSON.stringify({ es: [], en: [] }),
    aplicaRecargoNocturno: false,
    recargoNocturnoInicio: null,
    recargoNocturnoFin: null,
    montoRecargoNocturno: null,
    esAeropuerto: true,
    destinoAutoFill: null,
    esPorHoras: false,
    adicionales: {},
    camposPersonalizados: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    activo: true,
    precioBase: new Prisma.Decimal(150000),
    orden: 1,
};

const mockServicioTour = {
    ...mockServicio,
    id: '2',
    nombre: JSON.stringify({ es: 'Tour Compartido Guatapé', en: 'Shared Tour Guatapé' }),
    tipo: TipoServicio.TOUR_COMPARTIDO,
    esAeropuerto: false,
};

// Reserva base
const baseReserva = {
    id: 'test-id',
    codigo: 'TEST1234',
    servicioId: '1',
    fecha: new Date('2026-05-15'),
    hora: '09:00',
    nombreCliente: 'Nicolas H.',
    whatsappCliente: '3001234567',
    emailCliente: testEmail,
    idioma: 'ES',
    municipio: 'Medellín',
    otroMunicipio: null,
    numeroPasajeros: 2,
    vehiculoId: null,
    aeropuertoTipo: 'DESDE',
    aeropuertoNombre: 'JOSE_MARIA_CORDOVA',
    numeroVuelo: 'AV123',
    trasladoTipo: null,
    trasladoDestino: 'Hotel Poblado',
    lugarRecogida: null,
    guiaCertificado: false,
    vueltaBote: false,
    cantidadAlmuerzos: 0,
    cantidadMotos: 0,
    cantidadParticipantes: 0,
    cantidadHoras: null,
    notas: 'Prueba de envío de correo - por favor ignorar.',
    datosDinamicos: {},
    precioBase: new Prisma.Decimal(150000),
    precioAdicionales: new Prisma.Decimal(0),
    recargoNocturno: new Prisma.Decimal(0),
    tarifaMunicipio: new Prisma.Decimal(0),
    descuentoAliado: new Prisma.Decimal(0),
    comisionBold: new Prisma.Decimal(0),
    comisionAliado: new Prisma.Decimal(0),
    precioTotal: new Prisma.Decimal(150000),
    estado: EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
    metodoPago: 'BOLD',
    estadoPago: EstadoPago.PENDIENTE,
    pagoId: null,
    esReservaAliado: false,
    aliadoId: null,
    pedidoId: null,
    esPedido: false,
    googleCalendarEventId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    conductor: null,
    vehiculo: null,
    servicio: mockServicio,
};

async function testEmails() {
    console.log(`\n🚀 Iniciando pruebas de envío de correo a: ${testEmail}`);
    console.log(`   GMAIL_USER: ${process.env.GMAIL_USER || '⚠️ NO SET'}`);
    console.log(`   APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    console.log('─'.repeat(60));

    // Importación dinámica DESPUÉS de cargar env para que el transporter tenga credenciales
    const {
        sendReservaConfirmadaEmail,
        sendCotizacionPendienteEmail,
        sendTourCompartidoConfirmationEmail,
    } = await import('../lib/email-service.js');

    let successCount = 0;
    let failCount = 0;

    const runTest = async (nombre: string, fn: () => Promise<void>) => {
        console.log(`\n📧 ${nombre}`);
        try {
            await fn();
            console.log(`   ✅ Enviado exitosamente`);
            successCount++;
        } catch (error: any) {
            console.error(`   ❌ Error: ${error.message}`);
            failCount++;
        }
    };

    // ─────────────────────────────────────────────
    // Escenario 1: Reserva Independiente (Bold)
    // ─────────────────────────────────────────────
    await runTest('Escenario 1: Reserva Independiente (Bold)', async () => {
        await sendReservaConfirmadaEmail(
            { ...baseReserva, codigo: 'IND-BOLD', esReservaAliado: false } as any,
            'ES',
            null
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 2: Reserva Independiente (Efectivo)
    // ─────────────────────────────────────────────
    await runTest('Escenario 2: Reserva Independiente (Efectivo)', async () => {
        await sendReservaConfirmadaEmail(
            {
                ...baseReserva,
                codigo: 'IND-EFE',
                metodoPago: 'EFECTIVO',
                estado: EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION,
                estadoPago: null,
                comisionBold: new Prisma.Decimal(0),
                esReservaAliado: false,
            } as any,
            'ES',
            null
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 3: Reserva Aliado (Efectivo)
    // ─────────────────────────────────────────────
    await runTest('Escenario 3: Reserva Aliado (Efectivo)', async () => {
        await sendReservaConfirmadaEmail(
            {
                ...baseReserva,
                codigo: 'ALI-EFE',
                metodoPago: 'EFECTIVO',
                estado: EstadoReserva.CONFIRMADA_PENDIENTE_ASIGNACION,
                estadoPago: null,
                comisionBold: new Prisma.Decimal(0),
                esReservaAliado: true,
                aliadoId: 'test-aliado-id',
            } as any,
            'ES',
            testEmail  // el aliado también recibe el correo
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 4: Reserva Aliado (Bold)
    // ─────────────────────────────────────────────
    await runTest('Escenario 4: Reserva Aliado (Bold)', async () => {
        await sendReservaConfirmadaEmail(
            {
                ...baseReserva,
                codigo: 'ALI-BOLD',
                metodoPago: 'BOLD',
                estado: EstadoReserva.CONFIRMADA_PENDIENTE_PAGO,
                estadoPago: EstadoPago.PENDIENTE,
                comisionBold: new Prisma.Decimal(9000),
                precioTotal: new Prisma.Decimal(159000),
                esReservaAliado: true,
                aliadoId: 'test-aliado-id',
            } as any,
            'ES',
            testEmail  // el aliado también recibe el correo
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 5: Cotización Pendiente (municipio OTRO)
    // ─────────────────────────────────────────────
    await runTest('Escenario 5: Cotización Pendiente', async () => {
        await sendCotizacionPendienteEmail(
            {
                ...baseReserva,
                codigo: 'COT-PEND',
                municipio: 'OTRO',
                otroMunicipio: 'Peñol - destino personalizado',
                estado: EstadoReserva.PENDIENTE_COTIZACION,
                estadoPago: null,
                aeropuertoTipo: null,
                aeropuertoNombre: null,
                lugarRecogida: 'Hotel Poblado Medellin',
                trasladoDestino: 'Peñol',
                esReservaAliado: false,
            } as any,
            'ES'
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 6: Tour Compartido (Independiente)
    // ─────────────────────────────────────────────
    await runTest('Escenario 6: Tour Compartido (Independiente)', async () => {
        await sendTourCompartidoConfirmationEmail(
            {
                ...baseReserva,
                codigo: 'TOUR-IND',
                servicio: mockServicioTour,
                aeropuertoTipo: null,
                aeropuertoNombre: null,
                esReservaAliado: false,
            } as any,
            'ES'
        );
    });

    // ─────────────────────────────────────────────
    // Escenario 7: Tour Compartido (Aliado)
    // ─────────────────────────────────────────────
    await runTest('Escenario 7: Tour Compartido (Aliado)', async () => {
        await sendTourCompartidoConfirmationEmail(
            {
                ...baseReserva,
                codigo: 'TOUR-ALI',
                servicio: mockServicioTour,
                aeropuertoTipo: null,
                aeropuertoNombre: null,
                esReservaAliado: true,
                aliadoId: 'test-aliado-id',
            } as any,
            'ES'
        );
    });

    console.log('\n' + '─'.repeat(60));
    console.log(`✨ Pruebas completadas: ${successCount} exitosas, ${failCount} fallidas.`);

    if (failCount > 0) {
        console.log('\n⚠️  Si hay errores de autenticación (EAUTH), verifica:');
        console.log('   1. GMAIL_USER y GMAIL_APP_PASSWORD en .env o .env.local');
        console.log('   2. Que la contraseña de aplicación de Google esté vigente');
        console.log('   3. Que la cuenta de Gmail tenga "Acceso de apps menos seguras" o App Password activo');
        process.exit(1);
    }
}

testEmails();
