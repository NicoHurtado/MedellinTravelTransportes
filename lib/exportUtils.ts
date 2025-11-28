import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getLocalizedText } from '@/types/multi-language';
import { getStateLabel } from '@/lib/state-transitions';

export const exportarReservasPDF = (data: any[], viewMode: 'nueva' | 'antigua', filtros: any) => {
    // 1. Crear documento (orientación horizontal para que quepan las columnas)
    const doc = new jsPDF({ orientation: 'landscape' });

    // 2. Definir Columnas y Filas según el modo
    let head = [];
    let body = [];

    if (viewMode === 'nueva') {
        head = [['CÓDIGO', 'CLIENTE', 'SERVICIO', 'FECHA', 'ESTADO', 'ALIADO', 'COMISIÓN', 'TOTAL']];
        body = data.map((row: any) => [
            row.codigo,
            row.nombreCliente,
            row.servicio?.nombre ? getLocalizedText(row.servicio.nombre, 'ES') : '-',
            new Date(row.fecha).toLocaleDateString('es-CO'),
            getStateLabel(row.estado),
            row.aliado?.nombre || 'Independiente',
            `$${(Number(row.comisionAliado) || 0).toLocaleString('es-CO')}`,
            `$${Number(row.precioTotal).toLocaleString('es-CO')}`
        ]);
    } else {
        head = [['CANAL', 'NOMBRE', 'SERVICIO', 'FECHA', 'COTIZACIÓN', 'ESTADO']];
        body = data.map((row: any) => [
            row.canal || '-',
            row.nombre,
            row.servicio,
            row.fecha ? new Date(row.fecha).toLocaleDateString('es-CO') : '-',
            row.cotizacion,
            row.estado_servicio || '-'
        ]);
    }

    // 3. Encabezado del Reporte (Logo y Títulos)
    const fechaImpresion = new Date().toLocaleString('es-CO');

    // Título Principal
    doc.setFontSize(18);
    doc.text('Transportes Medellín Travel', 14, 22);

    // Subtítulo
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Reporte de Base de Datos (${viewMode === 'nueva' ? 'Registros Actuales' : 'Histórico'})`, 14, 30);

    // Info Extra (Fecha y Filtros)
    doc.setFontSize(9);
    doc.text(`Generado: ${fechaImpresion}`, 230, 22);
    doc.text(`Total Registros: ${data.length}`, 230, 28);

    if (filtros.busqueda || filtros.desde || filtros.hasta) {
        let textoFiltros = 'Filtros: ';
        if (filtros.busqueda) textoFiltros += `Búsqueda: "${filtros.busqueda}" `;
        if (filtros.desde) textoFiltros += `Desde: ${filtros.desde} `;
        if (filtros.hasta) textoFiltros += `Hasta: ${filtros.hasta}`;
        doc.text(textoFiltros, 14, 38);
    }

    // 4. Generar la Tabla
    autoTable(doc, {
        head: head,
        body: body,
        startY: 45, // Donde empieza la tabla verticalmente
        theme: 'grid', // 'striped', 'grid', 'plain'
        styles: {
            fontSize: 9,
            cellPadding: 3,
        },
        headStyles: {
            fillColor: [10, 10, 10], // Color Negro (Tu marca)
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            // Alinear columna de precios a la derecha (índice 6 y 7 en modo 'nueva')
            6: { halign: 'right', fontStyle: 'bold' },
            7: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245] // Gris muy claro para filas alternas
        },
        // Pie de página de la tabla (Totales)
        didDrawPage: (data) => {
            // Solo si es la última página, mostrar totales
            // (Lógica opcional, por simplicidad dejamos esto limpio)
        }
    });

    // 5. Agregar Total General al final
    if (viewMode === 'nueva') {
        const finalY = (doc as any).lastAutoTable.finalY + 10; // Posición Y después de la tabla
        const totalDinero = data.reduce((sum: number, r: any) => sum + (Number(r.precioTotal) || 0), 0);
        const totalComision = data.reduce((sum: number, r: any) => sum + (Number(r.comisionAliado) || 0), 0);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`TOTAL COMISIONES: $${totalComision.toLocaleString('es-CO')}`, 130, finalY);
        doc.text(`TOTAL GENERAL: $${totalDinero.toLocaleString('es-CO')}`, 220, finalY);
    }

    // 6. Descargar
    doc.save(`Reporte_Reservas_${new Date().toISOString().split('T')[0]}.pdf`);
};
