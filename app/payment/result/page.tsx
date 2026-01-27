'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentResultContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [orderId, setOrderId] = useState<string | null>(null);

    useEffect(() => {
        // Bold envía: ?bold-order-id=XXX&bold-tx-status=approved|rejected|pending
        const orderIdParam = searchParams.get('bold-order-id');
        const statusParam = searchParams.get('bold-tx-status');

        setOrderId(orderIdParam);
        setPaymentStatus(statusParam);
        setLoading(false);

        // Actualizar la base de datos si el pago fue aprobado
        if (statusParam === 'approved' && orderIdParam) {
            fetch('/api/reservas/confirmar-pago', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderIdParam,
                    status: 'APPROVED',
                })
            })
                .then(res => res.json())
                .then(data => {
                    console.log('✅ Base de datos actualizada:', data);
                })
                .catch(error => {
                    console.error('❌ Error actualizando base de datos:', error);
                });
        }
    }, [searchParams]);


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Procesando resultado del pago...</div>
            </div>
        );
    }

    const isApproved = paymentStatus === 'approved';
    const isPending = paymentStatus === 'pending';
    const isRejected = paymentStatus === 'rejected' || paymentStatus === 'failed';

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-black text-white py-6">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-3xl font-bold">Transportes Medellín Travel</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-4 py-12">
                <div className={`bg-white rounded-xl shadow-lg p-8 text-center ${isApproved ? 'border-t-4 border-green-500' :
                    isPending ? 'border-t-4 border-yellow-500' :
                        'border-t-4 border-red-500'
                    }`}>
                    {/* Icon */}
                    <div className="mb-6">
                        {isApproved && (
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {isPending && (
                            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        {isRejected && (
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div className="mb-8">
                        {isApproved && (
                            <>
                                <h2 className="text-3xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h2>
                                <p className="text-gray-600 text-lg">Tu pago ha sido procesado correctamente</p>
                            </>
                        )}
                        {isPending && (
                            <>
                                <h2 className="text-3xl font-bold text-yellow-600 mb-2">Pago Pendiente</h2>
                                <p className="text-gray-600 text-lg">Tu pago está siendo procesado</p>
                            </>
                        )}
                        {isRejected && (
                            <>
                                <h2 className="text-3xl font-bold text-red-600 mb-2">Pago Rechazado</h2>
                                <p className="text-gray-600 text-lg">No se pudo procesar tu pago</p>
                            </>
                        )}
                    </div>

                    {/* Order Info */}
                    {orderId && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-8">
                            <p className="text-sm text-gray-600">Código de Reserva</p>
                            <p className="text-2xl font-bold text-gray-900">{orderId}</p>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className="mb-8">
                        {isApproved && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-green-800">
                                    <strong>Próximos pasos:</strong><br />
                                    Pronto te asignaremos un conductor. Recibirás un email con sus datos de contacto.
                                </p>
                            </div>
                        )}
                        {isPending && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-yellow-800">
                                    <strong>Por favor espera:</strong><br />
                                    Tu pago está siendo procesado. Te notificaremos por email cuando se confirme.
                                </p>
                            </div>
                        )}
                        {isRejected && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800">
                                    <strong>¿Qué puedes hacer?</strong><br />
                                    Verifica los datos de tu tarjeta o usa otro método de pago.
                                    Si el problema persiste, contáctanos por WhatsApp.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {orderId && (
                            <Link
                                href={`/tracking/${orderId}`}
                                className="block w-full py-3 px-6 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                            >
                                Ver Estado de Mi Reserva
                            </Link>
                        )}

                        {isRejected && orderId && (
                            <Link
                                href={`/tracking/${orderId}`}
                                className="block w-full py-3 px-6 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                            >
                                Intentar Pagar Nuevamente
                            </Link>
                        )}

                        <Link
                            href="/"
                            className="block w-full py-3 px-6 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            Volver al Inicio
                        </Link>
                    </div>

                    {/* Contact */}
                    <div className="mt-8 pt-8 border-t">
                        <p className="text-sm text-gray-600 mb-3">¿Necesitas ayuda?</p>
                        <div className="flex justify-center space-x-6">
                            <a
                                href="https://wa.me/573175177409"
                                className="text-green-600 hover:text-green-700 font-medium"
                            >
                                <span className="inline-block mr-1">📱</span>
                                WhatsApp
                            </a>
                            <a
                                href="mailto:medellintraveltransportes@gmail.com"
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                <span className="inline-block mr-1">✉️</span>
                                Email
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function PaymentResultPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Cargando resultado del pago...</div>
            </div>
        }>
            <PaymentResultContent />
        </Suspense>
    );
}
