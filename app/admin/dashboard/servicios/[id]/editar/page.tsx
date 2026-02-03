'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import Link from 'next/link';
import DynamicFieldBuilder from '@/components/admin/DynamicFieldBuilder';
import ImageUploader from '@/components/admin/ImageUploader';
import MunicipalityPricingEditor from '@/components/admin/MunicipalityPricingEditor';
import { DynamicField } from '@/types/dynamic-fields';
import { getLocalizedText, getLocalizedArray } from '@/types/multi-language';
import { Municipio } from '@prisma/client';
import { TimeInput } from '@/components/ui';

interface Vehiculo {
    id: string;
    nombre: string;
    capacidadMinima: number;
    capacidadMaxima: number;
    imagen: string;
}

export default function EditarServicioPage() {
    const router = useRouter();
    const params = useParams();
    const servicioId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

    // Basic Info - Multi-language
    const [nombreES, setNombreES] = useState('');
    const [nombreEN, setNombreEN] = useState('');
    const [tipo, setTipo] = useState('OTRO');
    const [descripcionES, setDescripcionES] = useState('');
    const [descripcionEN, setDescripcionEN] = useState('');
    const [imagen, setImagen] = useState('');
    const [duracion, setDuracion] = useState('');
    const [incluyeES, setIncluyeES] = useState<string[]>(['']);
    const [incluyeEN, setIncluyeEN] = useState<string[]>(['']);
    const [precioBase, setPrecioBase] = useState(0);

    // Night Surcharge
    const [aplicaRecargoNocturno, setAplicaRecargoNocturno] = useState(false);
    const [recargoNocturnoInicio, setRecargoNocturnoInicio] = useState('22:00');
    const [recargoNocturnoFin, setRecargoNocturnoFin] = useState('06:00');
    const [montoRecargoNocturno, setMontoRecargoNocturno] = useState(0);

    // Special Logic
    const [esAeropuerto, setEsAeropuerto] = useState(false);
    const [destinoAutoFill, setDestinoAutoFill] = useState('');

    // Dynamic Fields
    const [camposPersonalizados, setCamposPersonalizados] = useState<DynamicField[]>([]);

    // Municipality Pricing
    const [tarifasMunicipios, setTarifasMunicipios] = useState<{ municipio: Municipio; valorExtra: number }[]>([]);

    // Vehicles
    const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState<
        { vehiculoId: string; precio: number }[]
    >([]);

    useEffect(() => {
        const fetchVehiculos = async () => {
            try {
                const res = await fetch('/api/admin/vehiculos');
                const data = await res.json();
                if (data.success) {
                    setVehiculos(data.data);
                }
            } catch (error) {
                console.error('Error fetching vehicles:', error);
            }
        };

        const fetchServicio = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/servicios/${servicioId}`);
                const data = await res.json();

                if (data.success) {
                    const servicio = data.data;

                    // Basic info - Multi-language
                    setNombreES(getLocalizedText(servicio.nombre, 'ES'));
                    setNombreEN(getLocalizedText(servicio.nombre, 'EN'));
                    setTipo(servicio.tipo);
                    setDescripcionES(getLocalizedText(servicio.descripcion, 'ES'));
                    setDescripcionEN(getLocalizedText(servicio.descripcion, 'EN'));
                    setImagen(servicio.imagen);
                    setDuracion(servicio.duracion || '');

                    const incluyeArrayES = getLocalizedArray(servicio.incluye, 'ES');
                    const incluyeArrayEN = getLocalizedArray(servicio.incluye, 'EN');
                    setIncluyeES(incluyeArrayES.length > 0 ? incluyeArrayES : ['']);
                    setIncluyeEN(incluyeArrayEN.length > 0 ? incluyeArrayEN : ['']);

                    setPrecioBase(Number(servicio.precioBase));

                    // Night surcharge
                    setAplicaRecargoNocturno(servicio.aplicaRecargoNocturno);
                    setRecargoNocturnoInicio(servicio.recargoNocturnoInicio || '22:00');
                    setRecargoNocturnoFin(servicio.recargoNocturnoFin || '06:00');
                    setMontoRecargoNocturno(Number(servicio.montoRecargoNocturno || 0));

                    // Special logic
                    setEsAeropuerto(servicio.esAeropuerto || false);
                    setDestinoAutoFill(servicio.destinoAutoFill || '');

                    // Dynamic fields
                    setCamposPersonalizados(
                        Array.isArray(servicio.camposPersonalizados)
                            ? servicio.camposPersonalizados
                            : []
                    );

                    // Vehicles
                    setVehiculosSeleccionados(
                        servicio.vehiculosPermitidos.map((v: any) => ({
                            vehiculoId: v.vehiculoId,
                            precio: Number(v.precio),
                        }))
                    );

                    // Municipality Pricing
                    setTarifasMunicipios(
                        Array.isArray(servicio.tarifasMunicipios)
                            ? servicio.tarifasMunicipios.map((t: any) => ({
                                municipio: t.municipio as Municipio,
                                valorExtra: Number(t.valorExtra)
                            }))
                            : []
                    );
                } else {
                    alert('Error al cargar el servicio');
                    router.push('/admin/dashboard/servicios');
                }
            } catch (error) {
                console.error('Error fetching service:', error);
                alert('Error al cargar el servicio');
                router.push('/admin/dashboard/servicios');
            } finally {
                setLoading(false);
            }
        };

        fetchVehiculos();
        fetchServicio();
    }, [servicioId, router]);

    const handleAddIncluyeES = () => {
        setIncluyeES([...incluyeES, '']);
    };

    const handleRemoveIncluyeES = (index: number) => {
        setIncluyeES(incluyeES.filter((_, i) => i !== index));
    };

    const handleIncluyeChangeES = (index: number, value: string) => {
        const updated = [...incluyeES];
        updated[index] = value;
        setIncluyeES(updated);
    };

    const handleAddIncluyeEN = () => {
        setIncluyeEN([...incluyeEN, '']);
    };

    const handleRemoveIncluyeEN = (index: number) => {
        setIncluyeEN(incluyeEN.filter((_, i) => i !== index));
    };

    const handleIncluyeChangeEN = (index: number, value: string) => {
        const updated = [...incluyeEN];
        updated[index] = value;
        setIncluyeEN(updated);
    };

    const handleVehiculoToggle = (vehiculoId: string) => {
        const exists = vehiculosSeleccionados.find((v) => v.vehiculoId === vehiculoId);
        if (exists) {
            setVehiculosSeleccionados(
                vehiculosSeleccionados.filter((v) => v.vehiculoId !== vehiculoId)
            );
        } else {
            setVehiculosSeleccionados([
                ...vehiculosSeleccionados,
                { vehiculoId, precio: precioBase },
            ]);
        }
    };

    const handleVehiculoPrecioChange = (vehiculoId: string, precio: number) => {
        setVehiculosSeleccionados(
            vehiculosSeleccionados.map((v) =>
                v.vehiculoId === vehiculoId ? { ...v, precio } : v
            )
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!nombreES || !nombreEN || !tipo || !descripcionES || !descripcionEN) {
            alert('Por favor completa todos los campos requeridos en ambos idiomas');
            return;
        }

        if (!imagen) {
            alert('Por favor sube una imagen del servicio. Recuerda hacer clic en el botón "Subir" después de seleccionar el archivo.');
            return;
        }

        // Skip vehicle validation for Tour Compartido (price is per person, not per vehicle)
        if (tipo !== 'TOUR_COMPARTIDO' && vehiculosSeleccionados.length === 0) {
            alert('Debes seleccionar al menos un vehículo');
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/api/admin/servicios/${servicioId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: { es: nombreES, en: nombreEN },
                    tipo,
                    descripcion: { es: descripcionES, en: descripcionEN },
                    imagen,
                    duracion: duracion || null,
                    incluye: {
                        es: incluyeES.filter((i) => i.trim() !== ''),
                        en: incluyeEN.filter((i) => i.trim() !== '')
                    },
                    precioBase,
                    aplicaRecargoNocturno,
                    recargoNocturnoInicio: aplicaRecargoNocturno ? recargoNocturnoInicio : null,
                    recargoNocturnoFin: aplicaRecargoNocturno ? recargoNocturnoFin : null,
                    montoRecargoNocturno: aplicaRecargoNocturno ? montoRecargoNocturno : null,
                    esAeropuerto,
                    destinoAutoFill: destinoAutoFill || null,
                    camposPersonalizados,
                    vehiculos: vehiculosSeleccionados,
                    tarifasMunicipios,
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert('Servicio actualizado exitosamente');
                router.push('/admin/dashboard/servicios');
            } else {
                alert(data.error || 'Error al actualizar servicio');
            }
        } catch (error) {
            console.error('Error updating service:', error);
            alert('Error al actualizar servicio');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D]"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/dashboard/servicios"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <FiArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Servicio</h1>
                    <p className="text-gray-600 mt-1">
                        Modifica la configuración del servicio
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">Información Básica</h2>
                    <p className="text-sm text-gray-600 mb-4">
                        🌍 Completa la información en ambos idiomas (Español e Inglés)
                    </p>

                    {/* Nombre Multi-idioma */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">
                            Nombre del Servicio *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🇪🇸 Español</label>
                                <input
                                    type="text"
                                    value={nombreES}
                                    onChange={(e) => setNombreES(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    placeholder="ej: Tour Guatapé Premium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🇬🇧 English</label>
                                <input
                                    type="text"
                                    value={nombreEN}
                                    onChange={(e) => setNombreEN(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    placeholder="ex: Guatapé Premium Tour"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tipo de Servicio */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Tipo de Servicio *
                            </label>
                            <select
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                            >
                                <option value="TRANSPORTE_AEROPUERTO">Transporte Aeropuerto</option>
                                <option value="TOUR_COMPARTIDO">Tour Compartido</option>
                                <option value="CITY_TOUR">City Tour</option>
                                <option value="TOUR_GUATAPE">Tour Guatapé</option>
                                <option value="TOUR_PARAPENTE">Tour Parapente</option>
                                <option value="TOUR_ATV">Tour ATV</option>
                                <option value="TOUR_HACIENDA_NAPOLES">Tour Hacienda Nápoles</option>
                                <option value="TOUR_OCCIDENTE">Tour Occidente</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                    </div>

                    {/* Descripción Multi-idioma */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                            Descripción *
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🇪🇸 Español</label>
                                <textarea
                                    value={descripcionES}
                                    onChange={(e) => setDescripcionES(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    placeholder="Describe el servicio..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">🇬🇧 English</label>
                                <textarea
                                    value={descripcionEN}
                                    onChange={(e) => setDescripcionEN(e.target.value)}
                                    required
                                    rows={4}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    placeholder="Describe the service..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <ImageUploader
                                currentImageUrl={imagen}
                                onImageUploaded={(url) => setImagen(url)}
                                label="Imagen del Servicio *"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Duración (opcional)
                            </label>
                            <input
                                type="text"
                                value={duracion}
                                onChange={(e) => setDuracion(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                placeholder="ej: 8 horas"
                            />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                            Precio Base (COP)
                        </label>
                        <input
                            type="number"
                            value={precioBase}
                            onChange={(e) => setPrecioBase(Number(e.target.value))}
                            min="0"

                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                    </div>

                    {/* What's Included - Multi-idioma */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                            ¿Qué incluye?
                        </label>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Español */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-2">🇪🇸 Español</label>
                                {incluyeES.map((item, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => handleIncluyeChangeES(index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                            placeholder="ej: Transporte privado"
                                        />
                                        {incluyeES.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIncluyeES(index)}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddIncluyeES}
                                    className="text-sm text-[#D6A75D] hover:underline"
                                >
                                    + Agregar item
                                </button>
                            </div>

                            {/* English */}
                            <div>
                                <label className="block text-xs text-gray-500 mb-2">🇬🇧 English</label>
                                {incluyeEN.map((item, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => handleIncluyeChangeEN(index, e.target.value)}
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                            placeholder="ex: Private transport"
                                        />
                                        {incluyeEN.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveIncluyeEN(index)}
                                                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddIncluyeEN}
                                    className="text-sm text-[#D6A75D] hover:underline"
                                >
                                    + Add item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Special Logic Flags */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">Lógica Especial</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="esAeropuerto"
                                checked={esAeropuerto}
                                onChange={(e) => setEsAeropuerto(e.target.checked)}
                                className="mt-1 w-4 h-4 text-[#D6A75D] border-gray-300 rounded focus:ring-[#D6A75D]"
                            />
                            <div>
                                <label htmlFor="esAeropuerto" className="font-medium cursor-pointer">
                                    Este es un servicio de aeropuerto
                                </label>
                                <p className="text-sm text-gray-500">
                                    Muestra botones especiales para &quot;Hacia/Desde Aeropuerto&quot;
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Auto-rellenar destino (opcional)
                            </label>
                            <input
                                type="text"
                                value={destinoAutoFill}
                                onChange={(e) => setDestinoAutoFill(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                placeholder="ej: Guatapé"
                            />
                        </div>
                    </div>
                </div>

                {/* Night Surcharge */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">Recargo Nocturno</h2>

                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            id="aplicaRecargoNocturno"
                            checked={aplicaRecargoNocturno}
                            onChange={(e) => setAplicaRecargoNocturno(e.target.checked)}
                            className="w-4 h-4 text-[#D6A75D] border-gray-300 rounded focus:ring-[#D6A75D]"
                        />
                        <label htmlFor="aplicaRecargoNocturno" className="font-medium cursor-pointer">
                            Aplicar recargo nocturno
                        </label>
                    </div>

                    {aplicaRecargoNocturno && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Hora inicio
                                </label>
                                <TimeInput
                                    value={recargoNocturnoInicio}
                                    onChange={(value) => setRecargoNocturnoInicio(value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Hora fin
                                </label>
                                <TimeInput
                                    value={recargoNocturnoFin}
                                    onChange={(value) => setRecargoNocturnoFin(value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Monto recargo (COP)
                                </label>
                                <input
                                    type="number"
                                    value={montoRecargoNocturno}
                                    onChange={(e) => setMontoRecargoNocturno(Number(e.target.value))}
                                    min="0"

                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Fields */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <DynamicFieldBuilder
                        fields={camposPersonalizados}
                        onChange={setCamposPersonalizados}
                    />
                </div>

                {/* Vehicle Assignment */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4">Vehículos y Precios</h2>

                    {vehiculos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay vehículos registrados.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {vehiculos.map((vehiculo) => {
                                const isSelected = vehiculosSeleccionados.find(
                                    (v) => v.vehiculoId === vehiculo.id
                                );

                                return (
                                    <div
                                        key={vehiculo.id}
                                        className={`border-2 rounded-lg p-4 transition-colors ${isSelected
                                            ? 'border-[#D6A75D] bg-[#D6A75D]/5'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => handleVehiculoToggle(vehiculo.id)}
                                                className="w-5 h-5 text-[#D6A75D] border-gray-300 rounded focus:ring-[#D6A75D]"
                                            />

                                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                                                <img
                                                    src={vehiculo.imagen || '/placeholder.jpg'}
                                                    alt={vehiculo.nombre}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <h3 className="font-semibold">{vehiculo.nombre}</h3>
                                                <p className="text-sm text-gray-500">
                                                    Capacidad: {vehiculo.capacidadMinima} - {vehiculo.capacidadMaxima}{' '}
                                                    pasajeros
                                                </p>
                                            </div>

                                            {isSelected && (
                                                <div className="w-48">
                                                    <label className="block text-sm font-medium mb-1">
                                                        Precio (COP)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={isSelected.precio}
                                                        onChange={(e) =>
                                                            handleVehiculoPrecioChange(
                                                                vehiculo.id,
                                                                Number(e.target.value)
                                                            )
                                                        }
                                                        min="0"

                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>



                {/* Municipality Pricing */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">Tarifas por Municipio</h2>
                    <p className="text-gray-600 mb-4">
                        Configura valores adicionales según el municipio de recogida (solo para usuarios regulares).
                    </p>
                    <MunicipalityPricingEditor
                        tarifas={tarifasMunicipios}
                        onChange={setTarifasMunicipios}
                    />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/admin/dashboard/servicios"
                        className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-[#D6A75D] text-black font-bold rounded-lg hover:bg-[#C5964A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <FiSave /> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
}
