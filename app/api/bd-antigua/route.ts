import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const bdAntigua = await prisma.bdAntigua.findMany({
            orderBy: {
                created_at: 'desc'
            }
        });

        console.log('BD Antigua records found:', bdAntigua.length);
        console.log('Sample record:', bdAntigua[0]);

        return NextResponse.json({
            success: true,
            data: bdAntigua
        });
    } catch (error) {
        console.error('Error fetching bd_antigua:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener registros de BD antigua' },
            { status: 500 }
        );
    }
}
