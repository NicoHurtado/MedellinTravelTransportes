import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent } from '@/lib/google-calendar-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. Fetch reservations that need syncing
        // - No Google Calendar Event ID
        // - Not Cancelled
        // - Include necessary relations
        const reservationsToSync = await prisma.reserva.findMany({
            where: {
                googleCalendarEventId: null,
                estado: {
                    not: 'CANCELADA'
                }
            },
            include: {
                servicio: true,
                conductor: true,
                vehiculo: true,
                aliado: true
            },
            orderBy: {
                fecha: 'desc'
            }
        });

        console.log(`📅 Found ${reservationsToSync.length} reservations to sync with Google Calendar`);

        let syncedCount = 0;
        let errorCount = 0;
        const results = [];

        // 2. Iterate and sync
        for (const reserva of reservationsToSync) {
            try {
                console.log(`🔄 Syncing reservation ${reserva.codigo}...`);

                const eventId = await createCalendarEvent(reserva);

                if (eventId) {
                    // 3. Update reservation with new Event ID
                    await prisma.reserva.update({
                        where: { id: reserva.id },
                        data: { googleCalendarEventId: eventId }
                    });

                    syncedCount++;
                    results.push({ codigo: reserva.codigo, status: 'success', eventId });
                } else {
                    errorCount++;
                    results.push({ codigo: reserva.codigo, status: 'failed', error: 'Could not create event' });
                }

            } catch (err: any) {
                console.error(`❌ Error syncing reservation ${reserva.codigo}:`, err);
                errorCount++;
                results.push({ codigo: reserva.codigo, status: 'error', message: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sync completed. Synced: ${syncedCount}, Failed: ${errorCount}`,
            totalFound: reservationsToSync.length,
            syncedCount,
            errorCount,
            details: results
        });

    } catch (error: any) {
        console.error('❌ Error in calendar sync API:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        );
    }
}
