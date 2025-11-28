import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToBlob, UPLOAD_ERRORS } from '@/lib/upload';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: UPLOAD_ERRORS.NO_FILE },
                { status: 400 }
            );
        }

        // Subir a Vercel Blob (carpeta: vehiculos)
        const url = await uploadImageToBlob(file, 'vehiculos');

        return NextResponse.json({
            success: true,
            url,
            filename: file.name
        });

    } catch (error: any) {
        console.error('Error uploading file:', error);

        // Si el error viene de la validación, usar ese mensaje
        const errorMessage = error.message || UPLOAD_ERRORS.UPLOAD_FAILED;

        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
