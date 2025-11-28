import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No se proporcionó ningún archivo' },
                { status: 400 }
            );
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Tipo de archivo no permitido. Solo JPG, PNG y WEBP.' },
                { status: 400 }
            );
        }

        // Validar tamaño (5MB máximo)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'El archivo es demasiado grande. Máximo 5MB.' },
                { status: 400 }
            );
        }

        // Generar nombre único
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Sanitizar nombre de archivo
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${originalName}`;

        // Guardar archivo
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'servicios');
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);

        // Retornar URL pública
        const publicUrl = `/uploads/servicios/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            message: 'Imagen subida exitosamente'
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json(
            { error: 'Error al subir la imagen' },
            { status: 500 }
        );
    }
}
