'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input } from '@/components/ui';
import { FiCheck, FiX, FiChevronDown, FiChevronUp, FiDollarSign } from 'react-icons/fi';
import { getLocalizedText } from '@/types/multi-language';

interface Servicio {
    id: string;
    nombre: string;
    tipo: string;
}

interface Vehiculo {
    id: string;
    nombre: string;
    capacidadMinima: number;
    capacidadMaxima: number;
}

interface PrecioVehiculo {
    vehiculoId: string;
    precio: string;
    comision: string;
}

interface ServicioConfig {
    servicioId: string;
    activo: boolean;
    preciosVehiculos: PrecioVehiculo[];
}

interface TarifaMunicipio {
    municipio: string;
    valorExtra: string;
}

interface ConfiguracionPreciosProps {
    aliadoId: string;
    onClose: () => void;
    onSave: () => void;
}

const MUNICIPIOS = [
    { value: 'ENVIGADO', label: 'Envigado' },
    { value: 'SABANETA', label: 'Sabaneta' },
    { value: 'ITAGUI', label: 'Itagüí' },
    { value: 'BELLO', label: 'Bello' },
    { value: 'MEDELLIN', label: 'Medellín' },
];

export default function ConfiguracionPrecios({ aliadoId, onClose, onSave }: ConfiguracionPreciosProps) {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [configuraciones, setConfiguraciones] = useState<Map<string, ServicioConfig>>(new Map());
    const [tarifasMunicipios, setTarifasMunicipios] = useState<TarifaMunicipio[]>(
        MUNICIPIOS.map(m => ({ municipio: m.value, valorExtra: '0' }))
    );
    const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
    const [municipalSectionExpanded, setMunicipalSectionExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            // Fetch servicios
            const resServicios = await fetch('/api/servicios');
            const dataServicios = await resServicios.json();
            setServicios(dataServicios.data || []);

            // Fetch vehiculos
            const resVehiculos = await fetch('/api/vehiculos');
            const dataVehiculos = await resVehiculos.json();
            const vehiculosData = dataVehiculos.data || [];

            // Sort by capacity
            const vehiculosSorted = vehiculosData.sort((a: any, b: any) =>
                (a.capacidadMaxima || 0) - (b.capacidadMaxima || 0)
            );

            setVehiculos(vehiculosSorted);

            // Fetch configuración existente
            const resConfig = await fetch(`/api/aliados/${aliadoId}/servicios`);
            const dataConfig = await resConfig.json();

            const configMap = new Map<string, ServicioConfig>();
            (dataConfig.data || []).forEach((sc: any) => {
                configMap.set(sc.servicioId, {
                    servicioId: sc.servicioId,
                    activo: sc.activo,
                    preciosVehiculos: sc.preciosVehiculos.map((pv: any) => ({
                        vehiculoId: pv.vehiculoId,
                        precio: pv.precio.toString(),
                        comision: pv.comision?.toString() || '0'
                    }))
                });
            });
            setConfiguraciones(configMap);

            // Fetch tarifas municipios
            const resTarifas = await fetch(`/api/aliados/${aliadoId}/tarifas-municipios`);
            const dataTarifas = await resTarifas.json();

            if (dataTarifas.data && dataTarifas.data.length > 0) {
                const tarifasMap = new Map<string, string>(
                    dataTarifas.data.map((t: any) => [t.municipio, String(t.valorExtra || '0')])
                );
                setTarifasMunicipios(
                    MUNICIPIOS.map(m => ({
                        municipio: m.value,
                        valorExtra: tarifasMap.get(m.value) || '0'
                    }))
                );
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [aliadoId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleServicio = (servicioId: string) => {
        const config = configuraciones.get(servicioId) || {
            servicioId,
            activo: false,
            preciosVehiculos: vehiculos.map(v => ({ vehiculoId: v.id, precio: '0', comision: '0' }))
        };

        config.activo = !config.activo;

        const newConfig = new Map(configuraciones);
        newConfig.set(servicioId, config);
        setConfiguraciones(newConfig);

        // Auto-expand when activating
        if (config.activo) {
            const newExpanded = new Set(expandedServices);
            newExpanded.add(servicioId);
            setExpandedServices(newExpanded);
        }
    };

    const toggleExpanded = (servicioId: string) => {
        const newExpanded = new Set(expandedServices);
        if (newExpanded.has(servicioId)) {
            newExpanded.delete(servicioId);
        } else {
            newExpanded.add(servicioId);
        }
        setExpandedServices(newExpanded);
    };

    const updatePrecioVehiculo = (servicioId: string, vehiculoId: string, field: 'precio' | 'comision', value: string) => {
        const config = configuraciones.get(servicioId);
        if (!config) return;

        // Check if this is a municipal transport service
        const servicio = servicios.find(s => s.id === servicioId);
        const isMunicipalTransport = servicio?.tipo === 'TRANSPORTE_MUNICIPAL';

        const precioIndex = config.preciosVehiculos.findIndex(pv => pv.vehiculoId === vehiculoId);

        let updatedPrecio: PrecioVehiculo;

        if (precioIndex >= 0) {
            updatedPrecio = { ...config.preciosVehiculos[precioIndex] };

            // Update the field that changed
            updatedPrecio[field] = value;

            // For municipal transport, auto-calculate 10% commission when price changes
            if (isMunicipalTransport && field === 'precio') {
                const precio = parseFloat(value) || 0;
                updatedPrecio.comision = Math.round(precio * 0.1).toString();
            }

            config.preciosVehiculos[precioIndex] = updatedPrecio;
        } else {
            // Creating new price entry
            updatedPrecio = {
                vehiculoId,
                precio: field === 'precio' ? value : '0',
                comision: field === 'comision' ? value : '0'
            };

            // For municipal transport, auto-calculate 10% commission
            if (isMunicipalTransport && field === 'precio') {
                const precio = parseFloat(value) || 0;
                updatedPrecio.comision = Math.round(precio * 0.1).toString();
            }

            config.preciosVehiculos.push(updatedPrecio);
        }

        const newConfig = new Map(configuraciones);
        newConfig.set(servicioId, { ...config });
        setConfiguraciones(newConfig);
    };

    const updateTarifaMunicipio = (municipio: string, valor: string) => {
        setTarifasMunicipios(prev =>
            prev.map(t => t.municipio === municipio ? { ...t, valorExtra: valor } : t)
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Guardar configuraciones de servicios
            const serviciosActivos = Array.from(configuraciones.values());

            for (const config of serviciosActivos) {
                await fetch(`/api/aliados/${aliadoId}/servicios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        servicioId: config.servicioId,
                        activo: config.activo,
                        preciosVehiculos: config.preciosVehiculos
                            .filter(pv => parseFloat(pv.precio) > 0)
                            .map(pv => ({
                                vehiculoId: pv.vehiculoId,
                                precio: pv.precio,
                                comision: pv.comision
                            }))
                    })
                });
            }

            // Guardar tarifas de municipios
            await fetch(`/api/aliados/${aliadoId}/tarifas-municipios`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tarifas: tarifasMunicipios.map(t => ({
                        municipio: t.municipio,
                        valorExtra: t.valorExtra
                    }))
                })
            });

            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving configuration:', error);
            alert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        );
    }

    // Separate services by type
    const regularServices = servicios.filter(s => s.tipo !== 'TRANSPORTE_MUNICIPAL');
    const municipalServices = servicios.filter(s => s.tipo === 'TRANSPORTE_MUNICIPAL');

    // Count active municipal services
    const activeMunicipalCount = municipalServices.filter(s => configuraciones.get(s.id)?.activo).length;

    return (
        <div className="space-y-6">
            {/* Servicios Regulares */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Servicios Activos</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Selecciona los servicios que estarán disponibles para este aliado y configura sus precios.
                </p>

                <div className="space-y-3">
                    {regularServices.map(servicio => {
                        const config = configuraciones.get(servicio.id);
                        const isActive = config?.activo || false;
                        const isExpanded = expandedServices.has(servicio.id);

                        return (
                            <Card key={servicio.id} padding="none">
                                {/* Header */}
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={isActive}
                                            onChange={() => toggleServicio(servicio.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-[#D6A75D] focus:ring-[#D6A75D]"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{getLocalizedText(servicio.nombre, 'ES')}</p>
                                            <p className="text-xs text-gray-500">{servicio.tipo}</p>
                                        </div>
                                    </div>

                                    {isActive && (
                                        <button
                                            onClick={() => toggleExpanded(servicio.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <FiChevronUp className="text-gray-600" />
                                            ) : (
                                                <FiChevronDown className="text-gray-600" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Configuración expandida */}
                                {isActive && isExpanded && config && (
                                    <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                                        {/* Precios y Comisiones por Vehículo */}
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-medium text-gray-900">Precios y Comisiones por Vehículo</h4>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    La comisión es un valor fijo por servicio
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                {vehiculos.map(vehiculo => {
                                                    const precioVehiculo = config.preciosVehiculos.find(
                                                        pv => pv.vehiculoId === vehiculo.id
                                                    );

                                                    return (
                                                        <div key={vehiculo.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                                                            <div className="w-full sm:w-1/3">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                    {vehiculo.nombre}
                                                                </label>
                                                                <span className="text-xs text-gray-500">
                                                                    {vehiculo.capacidadMinima}-{vehiculo.capacidadMaxima} pax
                                                                </span>
                                                            </div>

                                                            <div className="flex gap-4 w-full sm:w-2/3">
                                                                <div className="flex-1">
                                                                    <label className="block text-xs text-gray-500 mb-1">Precio Cliente</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                                        <input
                                                                            type="number"
                                                                            value={precioVehiculo?.precio || '0'}
                                                                            onChange={(e) => updatePrecioVehiculo(servicio.id, vehiculo.id, 'precio', e.target.value)}
                                                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent text-sm"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1">
                                                                    <label className="block text-xs text-gray-500 mb-1">Comisión (Fija)</label>
                                                                    <div className="relative">
                                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                                        <input
                                                                            type="number"
                                                                            value={precioVehiculo?.comision || '0'}
                                                                            onChange={(e) => updatePrecioVehiculo(servicio.id, vehiculo.id, 'comision', e.target.value)}
                                                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent text-sm"
                                                                            placeholder="0"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Sección de Transportes Municipales */}
            {municipalServices.length > 0 && (
                <div>
                    <Card padding="none" className="overflow-hidden">
                        {/* Header de la sección municipal */}
                        <div
                            className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 cursor-pointer hover:from-green-100 hover:to-emerald-100 transition-colors"
                            onClick={() => setMunicipalSectionExpanded(!municipalSectionExpanded)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-500 text-white rounded-full p-2">
                                        🚍
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-green-900">Transportes Municipales</h3>
                                        <p className="text-sm text-green-700">
                                            {activeMunicipalCount} de {municipalServices.length} destinos activos • Comisión automática del 10%
                                        </p>
                                    </div>
                                </div>
                                <button className="p-2 hover:bg-green-200/50 rounded-lg transition-colors">
                                    {municipalSectionExpanded ? (
                                        <FiChevronUp className="text-green-700" size={24} />
                                    ) : (
                                        <FiChevronDown className="text-green-700" size={24} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Contenido de transportes municipales */}
                        {municipalSectionExpanded && (
                            <div className="p-4 bg-green-50/30 space-y-3">
                                {municipalServices.map(servicio => {
                                    const config = configuraciones.get(servicio.id);
                                    const isActive = config?.activo || false;
                                    const isExpanded = expandedServices.has(servicio.id);

                                    return (
                                        <Card key={servicio.id} padding="none" className="border-green-200">
                                            {/* Header del servicio municipal */}
                                            <div className="p-3 flex items-center justify-between bg-white">
                                                <div className="flex items-center gap-3 flex-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={isActive}
                                                        onChange={() => toggleServicio(servicio.id)}
                                                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-gray-900">{getLocalizedText(servicio.nombre, 'ES')}</p>
                                                        <p className="text-xs text-green-600 font-medium">Comisión automática: 10% del precio</p>
                                                    </div>
                                                </div>

                                                {isActive && (
                                                    <button
                                                        onClick={() => toggleExpanded(servicio.id)}
                                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <FiChevronUp className="text-gray-600" />
                                                        ) : (
                                                            <FiChevronDown className="text-gray-600" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Configuración expandida del servicio municipal */}
                                            {isActive && isExpanded && config && (
                                                <div className="border-t border-green-100 p-4 bg-green-50/50 space-y-4">
                                                    <div>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <h4 className="font-medium text-gray-900">Precios por Vehículo</h4>
                                                            <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-medium">
                                                                ✨ Comisión calculada automáticamente (10%)
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4">
                                                            {vehiculos.map(vehiculo => {
                                                                const precioVehiculo = config.preciosVehiculos.find(
                                                                    pv => pv.vehiculoId === vehiculo.id
                                                                );
                                                                const precio = parseFloat(precioVehiculo?.precio || '0');
                                                                const comisionCalculada = Math.round(precio * 0.1);

                                                                return (
                                                                    <div key={vehiculo.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                                                                        <div className="w-full sm:w-1/3">
                                                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                                                {vehiculo.nombre}
                                                                            </label>
                                                                            <span className="text-xs text-gray-500">
                                                                                {vehiculo.capacidadMinima}-{vehiculo.capacidadMaxima} pax
                                                                            </span>
                                                                        </div>

                                                                        <div className="flex gap-4 w-full sm:w-2/3">
                                                                            <div className="flex-1">
                                                                                <label className="block text-xs text-gray-500 mb-1">Precio Cliente</label>
                                                                                <div className="relative">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={precioVehiculo?.precio || '0'}
                                                                                        onChange={(e) => updatePrecioVehiculo(servicio.id, vehiculo.id, 'precio', e.target.value)}
                                                                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                                                                        placeholder="0"
                                                                                    />
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex-1">
                                                                                <label className="block text-xs text-gray-500 mb-1">Comisión (10% auto)</label>
                                                                                <div className="relative">
                                                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600">$</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        value={precioVehiculo?.comision || '0'}
                                                                                        readOnly
                                                                                        className="w-full pl-8 pr-4 py-2 border border-green-200 rounded-lg bg-green-50 text-green-700 font-medium text-sm cursor-not-allowed"
                                                                                        placeholder="0"
                                                                                        title="Se calcula automáticamente como el 10% del precio"
                                                                                    />
                                                                                </div>
                                                                                {precio > 0 && (
                                                                                    <p className="text-xs text-green-600 mt-1">
                                                                                        = ${comisionCalculada.toLocaleString()} (10%)
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </Card>
                </div>
            )}

            {/* Tarifas por Municipio */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tarifas Adicionales por Municipio</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Configura valores adicionales que se sumarán al precio según el municipio seleccionado.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tarifasMunicipios.map(tarifa => (
                        <div key={tarifa.municipio}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {MUNICIPIOS.find(m => m.value === tarifa.municipio)?.label}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={tarifa.valorExtra}
                                    onChange={(e) => updateTarifaMunicipio(tarifa.municipio, e.target.value)}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="ghost" onClick={onClose} disabled={saving}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
            </div>
        </div>
    );
}
