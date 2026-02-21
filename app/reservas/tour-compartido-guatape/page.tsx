'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReservasTourCompartidoGuatapeRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/reservas?tipo=TOUR_COMPARTIDO&form=1');
    }, [router]);

    return null;
}
