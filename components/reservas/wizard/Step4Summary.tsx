import { ReservationFormData } from '@/types/reservation';
import { formatPrice } from '@/lib/pricing';
import { FormField } from '@/components/admin/FormBuilder';
import { useLanguage, t } from '@/lib/i18n';
import Image from 'next/image';

interface Step4Props {
    service: any;
    formData: ReservationFormData;
    onConfirm: () => void;
    onBack: () => void;
    loading: boolean;
}

export default function Step4Summary({ service, formData, onConfirm, onBack, loading }: Step4Props) {
    const { language } = useLanguage();

    const municipioLabels: Record<string, string> = {
        MEDELLIN: 'Medellín',
        POBLADO: 'El Poblado',
        LAURELES: 'Laureles',
        SABANETA: 'Sabaneta',
        BELLO: 'Bello',
        ITAGUI: 'Itagüí',
        ENVIGADO: 'Envigado',
        OTRO: formData.otroMunicipio || 'Otro',
    };

    // 1. Parsear campos dinámicos
    const dynamicFields: FormField[] = (() => {
        if (!service.camposPersonalizados) return [];
        try {
            return Array.isArray(service.camposPersonalizados)
                ? service.camposPersonalizados
                : JSON.parse(service.camposPersonalizados as string);
        } catch (error) {
            console.error('❌ Error parsing camposPersonalizados:', error);
            return [];
        }
    })();

    // Helper para obtener la etiqueta correcta (Soporta string simple u objeto ES/EN)
    const getLabel = (field: any) => {
        if (field.etiqueta && typeof field.etiqueta === 'object') {
            return field.etiqueta[language] || field.etiqueta['es'] || field.label;
        }
        return field.label || field.clave || 'Campo';
    };

    // 2. Calcular precio dinámico (CORREGIDO MAYÚSCULAS)
    const dynamicPrice = (() => {
        if (!formData.datosDinamicos || dynamicFields.length === 0) return 0;

        let total = 0;

        dynamicFields.forEach((field) => {
            // @ts-ignore
            const fieldKey = field.key || field.id || field.name || field.clave;
            if (!fieldKey) return;

            const value = formData.datosDinamicos![fieldKey];

            // CORRECCIÓN: Convertir tipo a minúsculas para comparar
            const tipo = field.tipo ? field.tipo.toLowerCase() : '';

            console.log(`🔍 Calc - Tipo: ${tipo}, Valor: ${value}, Precio: ${field.precio}, PrecioUnitario: ${field.precioUnitario}`);

            // Switch: soporta tanto 'precio' como 'precioUnitario'
            if (tipo === 'switch' && value === true) {
                const precio = field.precio || field.precioUnitario;
                if (precio) {
                    total += Number(precio);
                }
            }
            // Counter: usa precioUnitario
            if (tipo === 'counter' && Number(value) > 0 && field.precioUnitario) {
                total += Number(value) * Number(field.precioUnitario);
            }
        });

        console.log('✅ Precio Dinámico Total:', total);
        return total;
    })();


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">{t('reservas.paso4_titulo', language)}</h2>
                <p className="text-gray-600">
                    {language === 'es' ? 'Revisa los detalles antes de confirmar' : 'Review details before confirming'}
                </p>
            </div>

            {/* Service Details */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <h3 className="font-bold text-lg mb-4">{t('reservas.paso4_detalles', language)}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-gray-600">{t('reservas.paso4_servicio', language)}:</span>
                        <p className="font-medium">{service.nombre}</p>
                    </div>

                    {/* Selected Vehicle */}
                    {(() => {
                        const selectedVehicle = service.vehiculosPermitidos?.find((v: any) => v.vehiculo.id === formData.vehiculoId)?.vehiculo;
                        if (selectedVehicle) {
                            return (
                                <div className="col-span-2 flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-200 mt-2">
                                    <div className="relative w-20 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                                        {selectedVehicle.imagen ? (
                                            <Image
                                                src={selectedVehicle.imagen}
                                                alt={selectedVehicle.nombre}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                No img
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500 block">{t('reservas.paso1_vehiculo', language)}</span>
                                        <p className="font-bold text-gray-900">{selectedVehicle.nombre}</p>
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div>
                        <span className="text-gray-600">{t('reservas.paso4_fecha', language)}:</span>
                        <p className="font-medium">
                            {formData.fecha ? (() => {
                                const dateStr = formData.fecha.toISOString().split('T')[0];
                                const [year, month, day] = dateStr.split('-').map(Number);
                                const monthNames = language === 'es'
                                    ? ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
                                    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                                return `${day} de ${monthNames[month - 1]} de ${year}`;
                            })() : ''}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-600">{t('tracking.hora', language)}:</span>
                        <p className="font-medium">{formData.hora}</p>
                    </div>

                    {/* Cantidad de Horas - Only for hourly services */}
                    {service.esPorHoras && formData.cantidadHoras && (
                        <div>
                            <span className="text-gray-600">{language === 'es' ? 'Duración' : 'Duration'}:</span>
                            <p className="font-medium">
                                {formData.cantidadHoras} {language === 'es' ? 'horas' : 'hours'}
                            </p>
                        </div>
                    )}

                    {/* Origen */}
                    <div>
                        <span className="text-gray-600">
                            {language === 'es' ? 'Origen' : 'Origin'}:
                        </span>
                        <p className="font-medium">
                            {formData.aeropuertoTipo === 'DESDE'
                                ? ((formData.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' || !formData.aeropuertoNombre)
                                    ? (language === 'es' ? 'Aeropuerto JMC' : 'JMC Airport')
                                    : (language === 'es' ? 'Aeropuerto Olaya Herrera' : 'Olaya Herrera Airport'))
                                : formData.trasladoTipo === 'DESDE_MUNICIPIO'
                                    ? (formData.lugarRecogida || (language === 'es' ? 'No especificado' : 'Not specified'))
                                    : (formData.lugarRecogida || (language === 'es' ? 'No especificado' : 'Not specified'))}
                        </p>
                    </div>

                    {/* Destino */}
                    <div>
                        <span className="text-gray-600">{language === 'es' ? 'Destino' : 'Destination'}:</span>
                        <p className="font-medium">
                            {formData.aeropuertoTipo === 'HACIA'
                                ? ((formData.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' || !formData.aeropuertoNombre)
                                    ? (language === 'es' ? 'Aeropuerto JMC' : 'JMC Airport')
                                    : (language === 'es' ? 'Aeropuerto Olaya Herrera' : 'Olaya Herrera Airport'))
                                : formData.aeropuertoTipo === 'DESDE'
                                    ? (formData.lugarRecogida || (language === 'es' ? 'Tu Hotel/Residencia' : 'Your Hotel/Residence'))
                                    : formData.trasladoTipo === 'DESDE_UBICACION'
                                        ? (formData.trasladoDestino || (language === 'es' ? 'No especificado' : 'Not specified'))
                                        : formData.trasladoTipo === 'DESDE_MUNICIPIO'
                                            ? (formData.trasladoDestino || (language === 'es' ? 'No especificado' : 'Not specified'))
                                            : (service.destinoAutoFill || service.nombre || (language === 'es' ? 'No especificado' : 'Not specified'))
                            }
                        </p>
                    </div>

                    {formData.municipio && (
                        <div>
                            <span className="text-gray-600">{t('reservas.paso4_municipio', language)}:</span>
                            <p className="font-medium">{municipioLabels[formData.municipio]}</p>
                        </div>
                    )}
                    <div>
                        <span className="text-gray-600">{t('reservas.paso4_pasajeros', language)}:</span>
                        <p className="font-medium">{formData.numeroPasajeros} {t('comunes.personas', language)}</p>
                    </div>
                    <div>
                        <span className="text-gray-600">{language === 'es' ? 'Idioma' : 'Language'}:</span>
                        <p className="font-medium">{formData.idioma === 'ES' ? 'Español' : 'English'}</p>
                    </div>
                </div>
            </div>

            {/* Participants Summary (for Shared Tours or when assistants exist) */}
            {formData.asistentes && formData.asistentes.length > 0 && formData.asistentes[0].nombre && (
                <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                    <h3 className="font-bold text-lg mb-2">{language === 'es' ? 'Participantes' : 'Participants'}</h3>
                    <div className="text-sm space-y-2 max-h-60 overflow-y-auto">
                        {formData.asistentes.map((asistente, idx) => (
                            <div key={idx} className="border-b border-gray-200 last:border-0 pb-2 last:pb-0">
                                <p className="font-medium text-gray-900">{idx + 1}. {asistente.nombre}</p>
                                <p className="text-xs text-gray-500">
                                    {asistente.tipoDocumento} {asistente.numeroDocumento}
                                    {asistente.email && ` • ${asistente.email}`}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shared Tour Information Box */}
            {service.tipo === 'TOUR_COMPARTIDO' && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                    <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                        🚌 {language === 'es' ? 'Información del Tour Compartido' : 'Shared Tour Information'}
                    </h3>
                    <div className="text-sm text-amber-900 space-y-2">
                        <p><strong>{language === 'es' ? 'Punto de Encuentro:' : 'Meeting Point:'}</strong> Casa del Reloj<br />Carrera 35 con Calle 7 en Provenza.</p>
                        <p><strong>{language === 'es' ? 'Hora de Salida:' : 'Departure Time:'}</strong> 7:50 AM</p>
                        <p className="italic">{language === 'es' ? 'Nota: Debes llegar por tus propios medios. No hay servicio de recogida.' : 'Note: You must arrive on your own. No pickup service available.'}</p>
                    </div>
                </div>
            )}

            {/* Contact Info */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                <h3 className="font-bold text-lg mb-4">{t('reservas.paso2_titulo', language)}</h3>
                <div className="text-sm space-y-1">
                    <p><span className="text-gray-600">{t('tracking.nombre', language)}:</span> <span className="font-medium">{formData.nombreCliente}</span></p>
                    <p><span className="text-gray-600">{t('tracking.whatsapp', language)}:</span> <span className="font-medium">{formData.whatsappCliente}</span></p>
                    <p><span className="text-gray-600">{t('tracking.email', language)}:</span> <span className="font-medium">{formData.emailCliente}</span></p>
                </div>
            </div>

            {/* Notes */}
            {formData.notas && formData.notas.trim().length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                    <h3 className="font-bold text-lg mb-4">{language === 'es' ? 'Notas Adicionales' : 'Additional Notes'}</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.notas}</p>
                </div>
            )}

            {/* Dynamic Fields Info (Visualización) */}
            {dynamicFields.length > 0 && formData.datosDinamicos && Object.keys(formData.datosDinamicos).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6 space-y-2">
                    <h3 className="font-bold text-lg mb-4">{language === 'es' ? 'Información Adicional' : 'Additional Information'}</h3>
                    <div className="text-sm space-y-2">
                        {dynamicFields.map((field) => {
                            // @ts-ignore
                            const fieldKey = field.key || field.id || field.name || field.clave;
                            if (!fieldKey) return null;

                            const value = formData.datosDinamicos![fieldKey];
                            const tipo = field.tipo ? field.tipo.toLowerCase() : '';
                            const label = getLabel(field); // Usar helper para etiqueta

                            if (value === undefined || value === null || value === '' || value === false || value === 0) {
                                return null;
                            }
                            return (
                                <div key={field.id || fieldKey} className="flex justify-between">
                                    <span className="text-gray-600">{label}:</span>
                                    <span className="font-medium">
                                        {tipo === 'switch' ? (value ? t('comunes.si', language) : t('comunes.no', language)) :
                                            tipo === 'counter' ? `${value} ${language === 'es' ? 'unidad(es)' : 'unit(s)'}` :
                                                String(value)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Price Breakdown - Only show if NOT manual quote */}
            {formData.municipio !== 'OTRO' && (
                <div className="bg-[#D6A75D]/10 border-2 border-[#D6A75D] rounded-lg p-6">
                    <h3 className="font-bold text-lg mb-4">{t('reservas.paso4_desglose', language)}</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>
                                {(() => {
                                    const selectedVehicle = service.vehiculosPermitidos?.find((v: any) => v.vehiculo.id === formData.vehiculoId)?.vehiculo;
                                    const vehicleName = selectedVehicle ? selectedVehicle.nombre : t('reservas.paso4_precio_base', language);

                                    if (service.esPorHoras && formData.cantidadHoras) {
                                        const selectedVehicleData = service.vehiculosPermitidos?.find((v: any) => v.vehiculo.id === formData.vehiculoId);
                                        const precioHora = selectedVehicleData ? Number(selectedVehicleData.precio) : 0;
                                        return `${vehicleName} (${formatPrice(precioHora)} × ${formData.cantidadHoras} ${language === 'es' ? 'horas' : 'hours'})`;
                                    }

                                    return vehicleName;
                                })()}
                            </span>
                            <span className="font-medium">{formatPrice(formData.precioBase)}</span>
                        </div>


                        {/* Desglose de Extras Dinámicos */}
                        {dynamicFields.length > 0 && formData.datosDinamicos && (
                            <>
                                {dynamicFields.map((field) => {
                                    // @ts-ignore
                                    const fieldKey = field.key || field.id || field.name || field.clave;
                                    if (!fieldKey) return null;

                                    const value = formData.datosDinamicos![fieldKey];
                                    const tipo = field.tipo ? field.tipo.toLowerCase() : '';
                                    const label = getLabel(field);

                                    // Debug log
                                    console.log('🔍 Field:', label, 'Tipo:', tipo, 'Value:', value, 'Precio:', field.precio, 'PrecioUnitario:', field.precioUnitario);

                                    // Mostrar Switch con precio (soporta tanto 'precio' como 'precioUnitario')
                                    if (tipo === 'switch' && value === true) {
                                        const precio = field.precio || field.precioUnitario;
                                        if (precio) {
                                            return (
                                                <div key={field.id || fieldKey} className="flex justify-between text-sm">
                                                    <span>{label}</span>
                                                    <span className="font-medium">{formatPrice(precio)}</span>
                                                </div>
                                            );
                                        }
                                    }
                                    // Mostrar Counter con precio
                                    if (tipo === 'counter' && Number(value) > 0 && field.precioUnitario) {
                                        return (
                                            <div key={field.id || fieldKey} className="flex justify-between text-sm">
                                                <span>{label} ({value})</span>
                                                <span className="font-medium">{formatPrice(Number(value) * Number(field.precioUnitario))}</span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })}
                            </>
                        )}

                        {formData.recargoNocturno > 0 && (
                            <div className="flex justify-between">
                                <span>{t('reservas.paso4_recargo', language)}</span>
                                <span className="font-medium">{formatPrice(formData.recargoNocturno)}</span>
                            </div>
                        )}

                        {formData.tarifaMunicipio > 0 && (
                            <div className="flex justify-between">
                                <span>{t('reservas.paso4_tarifa_municipio', language)}</span>
                                <span className="font-medium">{formatPrice(formData.tarifaMunicipio)}</span>
                            </div>
                        )}

                        {formData.descuentoAliado > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>{t('reservas.paso4_descuento', language)}</span>
                                <span className="font-medium">-{formatPrice(formData.descuentoAliado)}</span>
                            </div>
                        )}

                        {/* Comisión Bold 6% - Solo para servicios que no son por horas */}
                        {!service.esPorHoras && (
                            <div className="flex justify-between text-orange-600">
                                <span>+ 6% {language === 'es' ? 'Impuestos del pago' : 'Payment taxes'}:</span>
                                <span className="font-medium">{formatPrice(formData.precioTotal * 0.06)}</span>
                            </div>
                        )}

                        <div className="border-t-2 border-[#D6A75D] pt-2 mt-2">
                            <div className="flex justify-between text-xl font-bold">
                                <span>{t('reservas.paso4_total', language)}</span>
                                <span className="text-[#D6A75D]">
                                    {!service.esPorHoras
                                        ? formatPrice(formData.precioTotal * 1.06)
                                        : formatPrice(formData.precioTotal)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment method notice for hourly services */}
            {service.esPorHoras && formData.municipio !== 'OTRO' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                        <strong>💰 {language === 'es' ? 'Método de Pago' : 'Payment Method'}:</strong> {language === 'es' ? 'El pago de este servicio se realiza en efectivo al finalizar el recorrido.' : 'Payment for this service is made in cash at the end of the trip.'}
                    </p>
                </div>
            )}

            {formData.municipio === 'OTRO' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Nota:</strong> {language === 'es' ? 'Esta reserva requiere cotización manual. Te contactaremos pronto con el precio final.' : 'This booking requires manual quote. We will contact you soon with the final price.'}
                    </p>
                </div>
            )}
        </div>
    );
}
