import { NextResponse } from 'next/server';

export async function GET() {
    const isTestMode = process.env.BOLD_MODE === 'test';

    const config = {
        publicKey: isTestMode
            ? process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY_TEST
            : process.env.NEXT_PUBLIC_BOLD_PUBLIC_KEY,
        isTestMode,
        redirectUrl: process.env.NEXT_PUBLIC_APP_URL
            ? `${process.env.NEXT_PUBLIC_APP_URL}/payment/result`
            : 'http://localhost:3001/payment/result',
    };

    console.log('🔵 [BOLD CONFIG API] Returning config:', {
        ...config,
        publicKey: config.publicKey ? `${config.publicKey.substring(0, 10)}...` : 'MISSING'
    });

    return NextResponse.json(config);
}
