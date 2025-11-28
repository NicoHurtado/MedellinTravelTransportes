'use client';

import { useEffect, useRef } from 'react';

interface BoldButtonProps {
    orderId: string;
    amount: string; // Entero en string (ej: "150000")
    currency: string;
    apiKey: string;
    integritySignature: string;
    redirectionUrl: string;
    description: string;
    customerData?: {
        email?: string;
        fullName?: string;
        phone?: string;
        dialCode?: string;
    };
}

export const BoldButton = ({
    orderId,
    amount,
    currency,
    apiKey,
    integritySignature,
    redirectionUrl,
    description,
    customerData
}: BoldButtonProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) {
            console.error('❌ [BOLD COMPONENT] Container ref not available');
            return;
        }

        console.log('🔵 [BOLD COMPONENT] Initializing button');
        console.log('  - Order ID:', orderId);
        console.log('  - Amount:', amount);
        console.log('  - Redirection URL:', redirectionUrl);
        console.log('  - API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING');
        console.log('  - Hash:', integritySignature ? `${integritySignature.substring(0, 10)}...` : 'MISSING');

        // 1. Limpiar contenedor previo para evitar duplicados
        containerRef.current.innerHTML = '';

        // 2. Crear el script de Bold
        const script = document.createElement('script');
        script.src = 'https://checkout.bold.co/library/boldPaymentButton.js';

        // 3. Asignar atributos requeridos por Bold
        script.setAttribute('data-bold-button', 'dark-L');
        script.setAttribute('data-order-id', orderId);
        script.setAttribute('data-currency', currency);
        script.setAttribute('data-amount', amount);
        script.setAttribute('data-api-key', apiKey);
        script.setAttribute('data-integrity-signature', integritySignature);
        script.setAttribute('data-redirection-url', redirectionUrl);
        script.setAttribute('data-description', description);

        // Datos del cliente (opcional)
        if (customerData) {
            script.setAttribute('data-customer-data', JSON.stringify(customerData));
            console.log('  - Customer Data:', customerData);
        }

        // 4. Inyectar
        console.log('✅ [BOLD COMPONENT] Injecting script for Order:', orderId);
        containerRef.current.appendChild(script);

        // Cleanup: React 18 a veces renderiza doble en dev, esto asegura limpieza
        return () => {
            console.log('🔵 [BOLD COMPONENT] Cleanup for Order:', orderId);
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [orderId, amount, integritySignature, apiKey, redirectionUrl]); // Solo recargar si cambian datos críticos

    return (
        <div
            ref={containerRef}
            className="bold-container my-4 flex justify-center"
            style={{ minHeight: '60px' }} // Reserva espacio para evitar saltos
        >
            {/* Bold inyectará el iframe/botón aquí */}
        </div>
    );
};
