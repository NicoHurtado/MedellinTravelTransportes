import crypto from 'crypto';

/**
 * Genera el hash de integridad para Bold.co
 * Según documentación: {OrderId}{Amount}{Currency}{SecretKey}
 * https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-manual
 * 
 * IMPORTANTE: Usa la "Llave Secreta" (BOLD_SECRET_KEY) para firmar el hash
 * La "Llave de Identidad" (BOLD_PUBLIC_KEY) solo se usa en el botón de pago del frontend
 */
export function generateBoldHash(
    orderId: string,
    amount: number,
    currency: string = 'COP'
): string {
    const isTestMode = process.env.BOLD_MODE === 'test';

    // CORRECCIÓN: Usar BOLD_SECRET_KEY (la llave secreta) para firmar el hash
    // NO usar BOLD_PUBLIC_KEY (esa es solo para identificarte en el frontend)
    const integritySecret = isTestMode
        ? process.env.BOLD_SECRET_KEY_TEST      // v9u1tsiuqKSTxzYaGZQeqw
        : process.env.BOLD_SECRET_KEY;          // AbZlffMjNKxJkpM_PA9UIQ

    if (!integritySecret) {
        throw new Error(`BOLD_SECRET_KEY${isTestMode ? '_TEST' : ''} not configured`);
    }

    // Convertir amount a string SIN decimales (Bold requiere número entero)
    const amountString = Math.round(amount).toString();

    // Concatenar en el orden EXACTO especificado por Bold (sin espacios)
    const concatenatedString = `${orderId}${amountString}${currency}${integritySecret}`;

    console.log('🔵 [BOLD HASH GENERATION]');
    console.log('  - Test Mode:', isTestMode);
    console.log('  - Order ID:', orderId);
    console.log('  - Amount:', amountString);
    console.log('  - Currency:', currency);
    console.log('  - Secret Key:', integritySecret ? `${integritySecret.substring(0, 5)}...` : 'MISSING');
    console.log('  - Concatenated String:', concatenatedString);

    // Generar hash SHA256
    const hash = crypto
        .createHash('sha256')
        .update(concatenatedString)
        .digest('hex');

    console.log('  - Generated Hash:', hash);

    return hash;
}

/**
 * Valida que el hash recibido sea correcto
 */
export function validateBoldHash(
    orderId: string,
    amount: number,
    currency: string,
    receivedHash: string
): boolean {
    const expectedHash = generateBoldHash(orderId, amount, currency);
    return expectedHash === receivedHash;
}

/**
 * Configuración de Bold
 */
const isTestMode = process.env.BOLD_MODE === 'test';

export const boldConfig = {
    publicKey: isTestMode
        ? (process.env.BOLD_PUBLIC_KEY_TEST || '')
        : (process.env.BOLD_PUBLIC_KEY || ''),
    secretKey: isTestMode
        ? (process.env.BOLD_SECRET_KEY_TEST || '')
        : (process.env.BOLD_SECRET_KEY || ''),
    publicKeyClient: isTestMode
        ? (process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY_TEST || '')
        : (process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY || ''),
    checkoutUrl: 'https://checkout.bold.co/payment',
    apiUrl: 'https://api.bold.co',
    currency: 'COP',
    isTestMode,
};

/**
 * Estados de Bold mapeados
 */
export const boldPaymentStatus = {
    APPROVED: 'approved',
    REJECTED: 'rejected',
    PENDING: 'pending',
    FAILED: 'failed',
} as const;

export type BoldPaymentStatus = typeof boldPaymentStatus[keyof typeof boldPaymentStatus];
