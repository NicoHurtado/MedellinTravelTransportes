
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting review seeding...');

    // 1. Get a service to attach reviews to
    const service = await prisma.servicio.findFirst({
        where: { activo: true },
    });

    if (!service) {
        console.error('No active service found. Please create a service first.');
        return;
    }

    console.log(`Attaching reviews to service: ${service.nombre}`);

    const reviews = [
        {
            name: 'Laura García',
            comment: '¡Una experiencia increíble! El conductor fue muy amable y puntual. El vehículo estaba impecable. Definitivamente volveré a usar sus servicios.',
        },
        {
            name: 'Carlos Rodríguez',
            comment: 'Excelente servicio de transporte. Nos recogieron a tiempo en el aeropuerto y el viaje fue muy cómodo. Muy recomendados.',
        },
        {
            name: 'Sarah Jenkins',
            comment: 'Great experience! The driver spoke English which was very helpful. The tour to Guatapé was the highlight of our trip.',
        },
        {
            name: 'Ana María Martínez',
            comment: 'Servicio 5 estrellas. La atención al cliente fue rápida y eficiente. El conductor conocía muy bien la ciudad y nos dio buenas recomendaciones.',
        },
        {
            name: 'David Wilson',
            comment: 'Professional and reliable. Booking was easy and everything went exactly as planned. Will book again next time I am in Medellin.',
        },
    ];

    for (let i = 0; i < reviews.length; i++) {
        const review = reviews[i];
        const uniqueCode = `REV-SEED-${Date.now()}-${i}`;

        // 2. Create a dummy completed reservation
        const reservation = await prisma.reserva.create({
            data: {
                codigo: uniqueCode,
                nombreCliente: review.name,
                whatsappCliente: '3000000000',
                emailCliente: 'test@example.com',
                servicioId: service.id,
                fecha: new Date(),
                hora: '10:00',
                idioma: 'ES',
                municipio: 'MEDELLIN',
                numeroPasajeros: 2,
                precioBase: service.precioBase,
                precioTotal: service.precioBase,
                estado: 'COMPLETADA',
                estadoPago: 'APROBADO',
            },
        });

        // 3. Create the review
        await prisma.calificacion.create({
            data: {
                reservaId: reservation.id,
                servicioId: service.id,
                estrellas: 5,
                comentario: review.comment,
                nombreCliente: review.name,
                esPublica: false, // User wants to choose which to highlight
                destacada: false,
            },
        });

        console.log(`Created review for ${review.name}`);
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
