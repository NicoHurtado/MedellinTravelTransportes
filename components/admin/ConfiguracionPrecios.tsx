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
            setVehiculos(dataVehiculos.data || []);

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
        const servicio = servicios.find(s => s.id === servicioId);
        const isMunicipal = servicio?.tipo === 'TRANSPORTE_MUNICIPAL';
        
        const config = configuraciones.get(servicioId) || {
            servicioId,
            activo: false,
            preciosVehiculos: vehiculos.map(v => ({ 
                vehiculoId: v.id, 
                precio: '0', 
                comision: '0' 
            }))
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

        const precioIndex = config.preciosVehiculos.findIndex(pv => pv.vehiculoId === vehiculoId);
        if (precioIndex >= 0) {
            config.preciosVehiculos[precioIndex] = {
                ...config.preciosVehiculos[precioIndex],
                [field]: value
            };
        } else {
            config.preciosVehiculos.push({
                vehiculoId,
                precio: field === 'precio' ? value : '0',
                comision: field === 'comision' ? value : '0'
            });
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
            const serviciosActivos = Array.from(configuraciones.values()).filter(c => c.activo);

            for (const config of serviciosActivos) {
                // Verificar si es servicio municipal
                const servicio = servicios.find(s => s.id === config.servicioId);
                const isMunicipal = servicio?.tipo === 'TRANSPORTE_MUNICIPAL';

                await fetch(`/api/aliados/${aliadoId}/servicios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        servicioId: config.servicioId,
                        activo: config.activo,
                        preciosVehiculos: config.preciosVehiculos
                            .filter(pv => parseFloat(pv.precio) > 0)
                            .map(pv => {
                                // Si es municipal y no tiene comisión o es 0, calcular automáticamente el 10%
                                let comision = pv.comision;
                                if (isMunicipal) {
                                    comision = (parseFloat(pv.precio) * 0.10).toFixed(2);
                                }
                                
                                return {
                                    vehiculoId: pv.vehiculoId,
                                    precio: pv.precio,
                                    comision: comision
                                };
                            })
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

    // Separar servicios: normales vs transporte municipal
    const serviciosNormales = servicios.filter(s => s.tipo !== 'TRANSPORTE_MUNICIPAL');
    const serviciosMunicipales = servicios.filter(s => s.tipo === 'TRANSPORTE_MUNICIPAL');

    // Renderizar un servicio individual
    const renderServicio = (servicio: Servicio) => {
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
                                <h4 className="font-medium text-gray-900">
                                    {servicio.tipo === 'TRANSPORTE_MUNICIPAL' 
                                        ? 'Precios por Vehículo' 
                                        : 'Precios y Comisiones por Vehículo'}
                                </h4>
                                {servicio.tipo === 'TRANSPORTE_MUNICIPAL' ? (
                                    <span className="text-xs text-gray-500 bg-green-50 border border-green-200 px-2 py-1 rounded">
                                        La comisión se calcula automáticamente (10% del precio)
                                    </span>
                                ) : (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        La comisión es un valor fijo por servicio
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                                {vehiculos.map(vehiculo => {
                                                    const precioVehiculo = config.preciosVehiculos.find(
                                                        pv => pv.vehiculoId === vehiculo.id
                                                    );

                                    const isMunicipal = servicio.tipo === 'TRANSPORTE_MUNICIPAL';
                                    
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

                                            <div className={`flex gap-4 w-full ${isMunicipal ? 'sm:w-2/3' : 'sm:w-2/3'}`}>
                                                <div className={isMunicipal ? 'w-full' : 'flex-1'}>
                                                    <label className="block text-xs text-gray-500 mb-1">Precio Cliente</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                                        <input
                                                            type="number"
                                                            value={precioVehiculo?.precio || '0'}
                                                            onChange={(e) => {
                                                                const precio = e.target.value;
                                                                updatePrecioVehiculo(servicio.id, vehiculo.id, 'precio', precio);
                                                                // Si es municipal, calcular comisión automáticamente (10%)
                                                                if (isMunicipal && precio) {
                                                                    const comisionAuto = (parseFloat(precio) * 0.10).toFixed(2);
                                                                    updatePrecioVehiculo(servicio.id, vehiculo.id, 'comision', comisionAuto);
                                                                }
                                                            }}
                                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent text-sm"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    {isMunicipal && precioVehiculo?.precio && parseFloat(precioVehiculo.precio) > 0 && (
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Comisión automática: ${(parseFloat(precioVehiculo.precio) * 0.10).toFixed(0)}
                                                        </p>
                                                    )}
                                                </div>

                                                {!isMunicipal && (
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
                                                )}
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
    };

    return (
        <div className="space-y-6">
            {/* Servicios Activos */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Servicios Activos</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Selecciona los servicios que estarán disponibles para este aliado y configura sus precios.
                </p>

                <div className="space-y-3">
                    {/* Servicios Normales */}
                    {serviciosNormales.map(servicio => renderServicio(servicio))}

                    {/* Sección de Transporte Municipal (Colapsable) */}
                    {serviciosMunicipales.length > 0 && (
                        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                            {/* Header de la sección */}
                            <button
                                onClick={() => setMunicipalSectionExpanded(!municipalSectionExpanded)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <FiDollarSign className="text-green-600" size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h4 className="font-bold text-gray-900">Transporte Municipal</h4>
                                        <p className="text-xs text-gray-500">
                                            {serviciosMunicipales.length} destino(s) disponible(s)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">
                                        {municipalSectionExpanded ? 'Ocultar' : 'Mostrar'}
                                    </span>
                                    {municipalSectionExpanded ? (
                                        <FiChevronUp className="text-gray-600" size={20} />
                                    ) : (
                                        <FiChevronDown className="text-gray-600" size={20} />
                                    )}
                                </div>
                            </button>

                            {/* Contenido colapsable */}
                            {municipalSectionExpanded && (
                                <div className="p-4 pt-0 space-y-3">
                                    {serviciosMunicipales.map(servicio => renderServicio(servicio))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
