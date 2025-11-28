import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();


async function main() {
    console.log('🌱 Creando datos de prueba...');

    // 0. Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin' },
        update: {
            password: hashedPassword,
        },
        create: {
            email: 'admin',
            password: hashedPassword,
        },
    });
    console.log('✅ Usuario admin creado - Email: admin, Password: admin');

    // 1. Crear vehículo de prueba
    const vehiculo = await prisma.vehiculo.upsert({
        where: { id: 'test-vehiculo-1' },
        update: {},
        create: {
            id: 'test-vehiculo-1',
            nombre: 'Van 7 pasajeros',
            capacidadMinima: 1,
            capacidadMaxima: 7,
            imagen: '/van-removebg-preview.png',
            activo: true,
        },
    });
    console.log('✅ Vehículo creado:', vehiculo.nombre);


    // 2. Crear servicio de prueba
    const servicio = await prisma.servicio.upsert({
        where: { id: 'test-servicio-1' },
        update: {},
        create: {
            id: 'test-servicio-1',
            nombre: { es: 'Tour Guatapé', en: 'Guatapé Tour' },
            tipo: 'TOUR_GUATAPE',
            descripcion: {
                es: 'Tour completo al pueblo más colorido de Colombia. Incluye transporte, guía y tiempo libre.',
                en: 'Complete tour to Colombia\'s most colorful town. Includes transport, guide and free time.'
            },
            imagen: '/guatape.jpg',
            activo: true,
            duracion: '8 horas',
            incluye: {
                es: ['Transporte', 'Guía turístico', 'Seguro'],
                en: ['Transport', 'Tour guide', 'Insurance']
            },
            precioBase: 150000,
            aplicaRecargoNocturno: false,
            esAeropuerto: false,
            destinoAutoFill: 'Guatapé',
            camposPersonalizados: [],
        },
    });
    console.log('✅ Servicio creado:', servicio.nombre);

    // 3. Crear relación servicio-vehículo
    await prisma.servicioVehiculo.upsert({
        where: {
            servicioId_vehiculoId: {
                servicioId: servicio.id,
                vehiculoId: vehiculo.id,
            }
        },
        update: {},
        create: {
            servicioId: servicio.id,
            vehiculoId: vehiculo.id,
            precio: 150000,
        },
    });
    console.log('✅ Relación servicio-vehículo creada');

    // 4. Crear conductor de prueba
    const conductor = await prisma.conductor.upsert({
        where: { id: 'test-conductor-1' },
        update: {},
        create: {
            id: 'test-conductor-1',
            nombre: 'Carlos González',
            whatsapp: '+573125551234',
            disponible: true,
            activo: true,
            fotosVehiculo: [],
        },
    });
    console.log('✅ Conductor creado:', conductor.nombre);

    // 5. Crear reserva de prueba
    const reserva = await prisma.reserva.upsert({
        where: { id: 'test-reserva-1' },
        update: {},
        create: {
            id: 'test-reserva-1',
            codigo: 'TEST001',
            nombreCliente: 'Juan Pérez',
            whatsappCliente: '+573157177409',
            emailCliente: process.env.GMAIL_USER || 'medellintraveltransportes@gmail.com', // Email a donde se enviará la prueba
            servicioId: servicio.id,
            fecha: new Date('2025-01-15T08:00:00'),
            hora: '08:00',
            idioma: 'ES',
            municipio: 'MEDELLIN',
            numeroPasajeros: 4,
            vehiculoId: vehiculo.id,
            conductorId: conductor.id,
            precioBase: 150000,
            precioAdicionales: 0,
            recargoNocturno: 0,
            tarifaMunicipio: 0,
            descuentoAliado: 0,
            precioTotal: 150000,
            estado: 'CONFIRMADA_PENDIENTE_PAGO',
            estadoPago: 'PENDIENTE',
            esReservaAliado: false,
            notas: 'Reserva de prueba para testing de emails',
        },
    });
    console.log('✅ Reserva creada:', reserva.codigo);

    // 6. Crear asistentes de prueba
    await prisma.asistente.upsert({
        where: { id: 'test-asistente-1' },
        update: {},
        create: {
            id: 'test-asistente-1',
            reservaId: reserva.id,
            nombre: 'Juan Pérez',
            tipoDocumento: 'CC',
            numeroDocumento: '1234567890',
        },
    });
    console.log('✅ Asistente creado');

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('\n📧 Para probar el envío de emails:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. Abre: http://localhost:3000/api/test-email');
    console.log('3. O usa curl:');
    console.log(`   curl -X POST http://localhost:3000/api/test-email \\
     -H "Content-Type: application/json" \\
     -d '{"reservaId":"test-reserva-1","type":"confirmada","language":"ES"}'`);
    console.log(`\n✉️  El email se enviará a: ${reserva.emailCliente}`);
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
