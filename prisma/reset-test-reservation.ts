import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Reseteando reserva TEST001 para pruebas con Bold sandbox...');

    // Resetear estado de la reserva TEST001
    await prisma.reserva.update({
        where: { codigo: 'TEST001' },
        data: {
            estado: 'CONFIRMADA_PENDIENTE_PAGO',
            estadoPago: 'PENDIENTE',
            pagoId: null,
            hashPago: null, // Se regenerará automáticamente
            comisionBold: null,
        },
    });

    console.log('✅ Reserva TEST001 reseteada');
    console.log('\n📝 Estado actual:');
    console.log('- Estado: CONFIRMADA_PENDIENTE_PAGO');
    console.log('- Estado Pago: PENDIENTE');
    console.log('- Hash: Se generará automáticamente');
    console.log('\n🧪 Listo para probar con Bold Sandbox');
    console.log('URL: http://localhost:3001/tracking/TEST001');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
