'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReservasAeropuertoRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/reservas?tipo=TRANSPORTE_AEROPUERTO&form=1');
    }, [router]);

    return null;
}
