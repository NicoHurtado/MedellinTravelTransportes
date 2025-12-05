import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCalendarEvent, updateCalendarEvent } from '@/lib/google-calendar-service';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode'); // 'create' (default) or 'update'

        // 1. Determine which reservations to fetch based on mode
        const whereClause: any = {
            estado: {
                not: 'CANCELADA'
            }
        };

        if (mode === 'update') {
            // Fetch reservations that HAVE an event ID to update them
            whereClause.googleCalendarEventId = { not: null };
        } else {
            // Default: Fetch reservations that DO NOT have an event ID to create them
            whereClause.googleCalendarEventId = null;
        }

        const reservationsToSync = await prisma.reserva.findMany({
            where: whereClause,
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

        console.log(`📅 Found ${reservationsToSync.length} reservations to ${mode === 'update' ? 'update' : 'sync'} with Google Calendar`);

        let syncedCount = 0;
        let errorCount = 0;
        const results = [];

        // 2. Iterate and sync/update
        for (const reserva of reservationsToSync) {
            try {
                if (mode === 'update') {
                    console.log(`🔄 Updating reservation ${reserva.codigo}...`);
                    const success = await updateCalendarEvent(reserva);

                    if (success) {
                        syncedCount++;
                        results.push({ codigo: reserva.codigo, status: 'success', action: 'updated' });
                    } else {
                        errorCount++;
                        results.push({ codigo: reserva.codigo, status: 'failed', error: 'Could not update event' });
                    }
                } else {
                    console.log(`➕ Creating event for reservation ${reserva.codigo}...`);
                    const eventId = await createCalendarEvent(reserva);

                    if (eventId) {
                        await prisma.reserva.update({
                            where: { id: reserva.id },
                            data: { googleCalendarEventId: eventId }
                        });

                        syncedCount++;
                        results.push({ codigo: reserva.codigo, status: 'success', eventId, action: 'created' });
                    } else {
                        errorCount++;
                        results.push({ codigo: reserva.codigo, status: 'failed', error: 'Could not create event' });
                    }
                }

            } catch (err: any) {
                console.error(`❌ Error processing reservation ${reserva.codigo}:`, err);
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
