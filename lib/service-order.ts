/**
 * Service Order Utility
 * 
 * Defines the display order for services across the platform.
 * This order applies to:
 * - Hotel/Airbnb links
 * - Ally code links
 * - Regular users without any ally
 * 
 * Services not in this list will appear at the end in alphabetical order.
 */

export type TipoServicio =
  | 'TRANSPORTE_AEROPUERTO'
  | 'TOUR_GUATAPE'
  | 'CITY_TOUR'
  | 'TOUR_ATV'
  | 'TOUR_PARAPENTE'
  | 'TRANSPORTE_POR_HORAS'
  | 'TRANSPORTE_MUNICIPAL'
  | 'TOUR_HACIENDA_NAPOLES'
  | 'TOUR_OCCIDENTE'
  | 'OTRO';

/**
 * Priority order for services (lower number = higher priority)
 * 
 * Order based on most used services:
 * 1. Traslado privado aeropuerto (Private Airport Transfer)
 * 2. Tour Guatapé
 * 3. City Tour
 * 4. Comuna 13
 * 5. Tour de café
 * 6. Tour ATVs
 * 7. Tour Parapente
 * 8. Transporte por horas (Hourly Transport)
 */
const SERVICE_ORDER_MAP: Record<string, number> = {
  // Airport transfer - highest priority
  'TRANSPORTE_AEROPUERTO': 1,

  // Tours in order of popularity
  'TOUR_GUATAPE': 2,
  'CITY_TOUR': 3,
  'TOUR_ATV': 6,
  'TOUR_PARAPENTE': 7,

  // Hourly transport
  'TRANSPORTE_POR_HORAS': 8,

  // Other services (lower priority)
  'TOUR_HACIENDA_NAPOLES': 100,
  'TOUR_OCCIDENTE': 101,
  'TRANSPORTE_MUNICIPAL': 102,
  'OTRO': 999,
};

/**
 * Additional name-based ordering for services with the same tipo
 * This helps distinguish between services like "Comuna 13" and "City Tour"
 * which might have the same tipo but different names.
 */
const NAME_ORDER_MAP: Record<string, number> = {
  // City Tour variations
  'comuna 13': 4,
  'graffiti': 4,
  'café': 5,
  'coffee': 5,
  'city tour': 3,
  'citytour': 3,
};

interface ServiceForSorting {
  tipo: string;
  nombre: any; // Can be string, object, or JsonValue from Prisma
  esAeropuerto?: boolean;
  orden?: number; // Display order from database
  [key: string]: any;
}

/**
 * Extracts text from multi-language field
 */
function getServiceName(service: ServiceForSorting): string {
  // Handle null or undefined
  if (!service.nombre) {
    return '';
  }

  // Handle string
  if (typeof service.nombre === 'string') {
    return service.nombre.toLowerCase();
  }

  // Handle object (multi-language)
  if (typeof service.nombre === 'object') {
    const nombre = service.nombre as any;
    return (nombre.es || nombre.en || '').toLowerCase();
  }

  return '';
}

/**
 * Gets the priority order for a service based on tipo and name
 */
function getServicePriority(service: ServiceForSorting): number {
  // First, check tipo-based ordering
  const tipoPriority = SERVICE_ORDER_MAP[service.tipo];

  if (tipoPriority !== undefined) {
    // If the service has a specific name match, use that for fine-tuning
    const serviceName = getServiceName(service);

    for (const [nameKey, namePriority] of Object.entries(NAME_ORDER_MAP)) {
      if (serviceName.includes(nameKey)) {
        return namePriority;
      }
    }

    return tipoPriority;
  }

  // If no tipo match, check name-based ordering
  const serviceName = getServiceName(service);
  for (const [nameKey, namePriority] of Object.entries(NAME_ORDER_MAP)) {
    if (serviceName.includes(nameKey)) {
      return namePriority;
    }
  }

  // Default: very low priority (will appear at the end)
  return 1000;
}

/**
 * Sorts services according to the defined order
 * 
 * Priority:
 * 1. Database `orden` field (if present) - allows admin to customize order
 * 2. Hardcoded tipo/name priorities (fallback)
 * 3. Alphabetical by name
 * 
 * @param services - Array of services to sort
 * @returns Sorted array of services
 */
export function sortServicesByPriority<T extends ServiceForSorting>(services: T[]): T[] {
  return [...services].sort((a, b) => {
    // Primary sort: database orden field (lower = higher priority)
    const ordenA = a.orden ?? 999;
    const ordenB = b.orden ?? 999;

    if (ordenA !== ordenB) {
      return ordenA - ordenB;
    }

    // Secondary sort: hardcoded priorities (for backward compatibility)
    const priorityA = getServicePriority(a);
    const priorityB = getServicePriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Tertiary sort: alphabetically by name
    const nameA = getServiceName(a);
    const nameB = getServiceName(b);
    return nameA.localeCompare(nameB);
  });
}



