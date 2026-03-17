/**
 * Script para reenviar el email de confirmación a la reserva YF2S66CW
 * Cliente: LORENA RODAS - solymartravel1@gmail.com
 *
 * Ejecutar con: npx tsx scripts/resend-email-YF2S66CW.ts
 */

import { prisma } from '../lib/prisma';

async function main() {
    const codigo = 'YF2S66CW';

    console.log(`🔍 Buscando reserva ${codigo}...`);

    const reserva = await prisma.reserva.findUnique({
        where: { codigo },
        include: {
            servicio: true,
            conductor: true,
            vehiculo: true,
            aliado: true,
            asistentes: true,
        },
    });

    if (!reserva) {
        console.error(`❌ Reserva ${codigo} no encontrada`);
        process.exit(1);
    }

    console.log('📋 Datos de la reserva:');
    console.log(`   Código:    ${reserva.codigo}`);
    console.log(`   Cliente:   ${reserva.nombreCliente}`);
    console.log(`   Email:     ${reserva.emailCliente}`);
    console.log(`   Estado:    ${reserva.estado}`);
    console.log(`   Pago:      ${reserva.metodoPago}`);
    console.log(`   Servicio:  ${JSON.stringify(reserva.servicio.nombre)}`);
    console.log('');

    const idioma = (reserva.idioma as 'ES' | 'EN') || 'ES';

    console.log(`📧 Reenviando email de confirmación a ${reserva.emailCliente}...`);

    const { sendReservaConfirmadaEmail } = await import('../lib/email-service');
    await sendReservaConfirmadaEmail(reserva as any, idioma, null);

    console.log(`✅ Email de confirmación enviado exitosamente a ${reserva.emailCliente}`);
}

main()
    .catch((err) => {
        console.error('❌ Error:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
