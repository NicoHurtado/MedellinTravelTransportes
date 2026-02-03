import { Municipio, Idioma, TipoDocumento, AeropuertoTipo, AeropuertoNombre, TrasladoTipo } from '@prisma/client';

export interface Asistente {
    nombre: string;
    tipoDocumento: TipoDocumento;
    numeroDocumento: string;
    email: string;
    telefono: string;
}

export interface ReservationFormData {
    // Step 1: Trip Details
    idioma: Idioma;
    fecha: Date | null;
    hora: string;
    municipio: Municipio | '';
    otroMunicipio?: string;
    numeroPasajeros: number;

    // Service-specific fields
    aeropuertoTipo?: AeropuertoTipo;
    aeropuertoNombre?: AeropuertoNombre;
    numeroVuelo?: string;
    trasladoTipo?: TrasladoTipo;
    trasladoDestino?: string; // Para autocomplete del nombre del municipio
    lugarRecogida?: string;
    guiaCertificado?: boolean;
    vueltaBote?: boolean;
    cantidadAlmuerzos?: number;
    cantidadMotos?: number;
    cantidadParticipantes?: number;
    cantidadHoras?: number; // Para servicios por horas

    // Step 2: Contact Info
    nombreCliente: string;
    whatsappCliente: string;
    emailCliente: string;
    tipoDocumentoCliente?: TipoDocumento;
    numeroDocumentoCliente?: string;
    asistentes: Asistente[];

    // Step 3: Notes
    notas?: string;

    // Calculated fields
    vehiculoId?: string;
    precioBase: number;
    precioAdicionales: number;
    recargoNocturno: number;
    tarifaMunicipio: number;
    descuentoAliado: number;
    precioTotal: number;

    // Campos dinámicos del formulario
    datosDinamicos?: Record<string, any>;
}

export interface WizardStep {
    number: number;
    title: string;
    isValid: boolean;
}
