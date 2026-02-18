'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
    FiArrowLeft,
    FiLoader,
    FiCheckCircle,
    FiX,
    FiSave,
    FiEdit2,
    FiUser,
    FiClock,
    FiMapPin,
    FiDollarSign,
    FiMail,
    FiPhone,
    FiCalendar,
    FiUsers,
    FiTruck
} from 'react-icons/fi';
import { EstadoReserva, TipoDocumento } from '@prisma/client';
import { getStateLabel, getStateColor, getAvailableTransitions } from '@/lib/state-transitions';
import { getLocalizedText } from '@/types/multi-language';
import { formatReservationDate } from '@/lib/date-utils';

export default function AdminReservaDetails({ params }: { params: { id: string } }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id } = params;

    const [reserva, setReserva] = useState<any>(null);
    const [conductores, setConductores] = useState<any[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [vehiculos, setVehiculos] = useState<any[]>([]);

    // Form states
    const [selectedConductor, setSelectedConductor] = useState('');
    const [selectedEstado, setSelectedEstado] = useState<string>('');
    const [quotePrice, setQuotePrice] = useState<number>(0);

    // Editable Service Details
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('');
    const [numeroPasajeros, setNumeroPasajeros] = useState(1);
    const [vehiculoId, setVehiculoId] = useState('');
    const [municipio, setMunicipio] = useState('');
    const [numeroVuelo, setNumeroVuelo] = useState('');
    const [lugarRecogida, setLugarRecogida] = useState('');
    const [notas, setNotas] = useState('');
    const [aeropuertoNombre, setAeropuertoNombre] = useState('');

    // Customer Edit States
    const [nombreCliente, setNombreCliente] = useState('');
    const [emailCliente, setEmailCliente] = useState('');
    const [whatsappCliente, setWhatsappCliente] = useState('');
    const [idioma, setIdioma] = useState('ES');

    // Editable Asistentes (passengers)
    const [asistentes, setAsistentes] = useState<any[]>([]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    const fetchData = useCallback(async () => {
        try {
            // Fetch Reserva
            const resReserva = await fetch(`/api/reservas/by-id/${id}`);
            if (!resReserva.ok) throw new Error('Error fetching reserva');
            const dataReserva = await resReserva.json();

            setReserva(dataReserva);

            // Initialize form states
            setSelectedConductor(dataReserva.conductorId || '');

            setSelectedEstado(dataReserva.estado);
            setQuotePrice(dataReserva.precioTotal || 0);

            // Initialize customer edit states
            setNombreCliente(dataReserva.nombreCliente || '');
            setEmailCliente(dataReserva.emailCliente || '');
            setWhatsappCliente(dataReserva.whatsappCliente || '');
            setIdioma(dataReserva.idioma || 'ES');

            // Initialize asistentes (passengers) for editing
            if (dataReserva.asistentes && dataReserva.asistentes.length > 0) {
                setAsistentes(dataReserva.asistentes.map((a: any) => ({
                    id: a.id,
                    nombre: a.nombre || '',
                    tipoDocumento: a.tipoDocumento || 'PASAPORTE',
                    numeroDocumento: a.numeroDocumento || '',
                    email: a.email || '',
                    telefono: a.telefono || '',
                })));
            }

            // Initialize service edit states
            setFecha(dataReserva.fecha ? new Date(dataReserva.fecha).toISOString().split('T')[0] : '');
            setHora(dataReserva.hora || '');
            setNumeroPasajeros(dataReserva.numeroPasajeros || 1);
            setVehiculoId(dataReserva.vehiculoId || '');
            setMunicipio(dataReserva.municipio || '');
            setNumeroVuelo(dataReserva.numeroVuelo || '');
            setLugarRecogida(dataReserva.lugarRecogida || '');
            setNotas(dataReserva.notas || '');
            setAeropuertoNombre(dataReserva.aeropuertoNombre || '');

            // Fetch Conductores
            const resConductores = await fetch('/api/conductores?activo=true');
            if (resConductores.ok) {
                const dataConductores = await resConductores.json();
                setConductores(dataConductores.data || []);
            }

            // Fetch Vehiculos (All active vehicles)
            const resVehiculos = await fetch('/api/vehiculos');
            if (resVehiculos.ok) {
                const dataVehiculos = await resVehiculos.json();
                // API usually returns { data: [...] } or just [...]
                setVehiculos(dataVehiculos.data || dataVehiculos || []);
            }



        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchData();
        }
    }, [status, fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body: any = {
                estado: selectedEstado,
                conductorId: selectedConductor || null,
                // Customer data
                nombreCliente,
                emailCliente,
                whatsappCliente,
                idioma,
                // Service Details
                fecha,
                hora,
                numeroPasajeros: Number(numeroPasajeros),
                vehiculoId: vehiculoId || null,
                municipio,
                numeroVuelo,
                lugarRecogida,
                notas,
                aeropuertoNombre,
                // Passengers (asistentes)
                asistentes: asistentes.map((a) => ({
                    id: a.id,
                    nombre: a.nombre,
                    tipoDocumento: a.tipoDocumento,
                    numeroDocumento: a.numeroDocumento,
                    email: a.email || null,
                    telefono: a.telefono || null,
                })),
            };

            // If updating price for quote
            if (reserva.estado === 'PENDIENTE_COTIZACION' && selectedEstado === 'CONFIRMADA_PENDIENTE_PAGO') {
                body.precioTotal = quotePrice;
                body.precioBase = quotePrice; // Assuming base price update for simplicity
            }

            const res = await fetch(`/api/reservas/by-id/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) throw new Error('Error updating reserva');

            const updatedReserva = await res.json();
            setReserva(updatedReserva.data);
            alert('Reserva actualizada exitosamente');

            // Refresh data to ensure sync
            fetchData();

        } catch (error) {
            console.error('Error updating reserva:', error);
            alert('Error al actualizar la reserva');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <FiLoader className="animate-spin text-4xl text-[#D6A75D]" />
            </div>
        );
    }

    if (!reserva) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800">Reserva no encontrada</h1>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 text-[#D6A75D] hover:underline"
                    >
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    const metodoPago = reserva.metodoPago === 'EFECTIVO' ? 'EFECTIVO' : 'BOLD';
    const estadoBold = reserva.estadoPago === 'APROBADO' ? 'PAGADO' : 'PENDIENTE';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <FiArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                Reserva #{reserva.codigo}
                                <span className={`text-sm px-3 py-1 rounded-full ${getStateColor(reserva.estado)}`}>
                                    {getStateLabel(reserva.estado)}
                                </span>
                            </h1>
                            <p className="text-sm text-gray-500">
                                Creada el {new Date(reserva.createdAt).toLocaleString('es-CO')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client Info */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiUser className="text-[#D6A75D]" /> Información del Cliente
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        value={nombreCliente}
                                        onChange={(e) => setNombreCliente(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                                    <div className="flex items-center gap-2">
                                        <FiMail className="text-gray-400" />
                                        <input
                                            type="email"
                                            value={emailCliente}
                                            onChange={(e) => setEmailCliente(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">WhatsApp</label>
                                    <div className="flex items-center gap-2">
                                        <FiPhone className="text-gray-400" />
                                        <input
                                            type="text"
                                            value={whatsappCliente}
                                            onChange={(e) => setWhatsappCliente(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Idioma</label>
                                    <select
                                        value={idioma}
                                        onChange={(e) => setIdioma(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    >
                                        <option value="ES">Español</option>
                                        <option value="EN">Inglés</option>
                                    </select>
                                </div>
                            </div>

                            {/* Lista de Asistentes - Editable */}
                            {asistentes.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <FiUsers className="text-[#D6A75D]" />
                                        Pasajeros Registrados ({asistentes.length})
                                        <span className="text-xs font-normal text-gray-400 ml-1">— Editable</span>
                                    </h3>
                                    <div className="space-y-4">
                                        {asistentes.map((asistente: any, index: number) => (
                                            <div key={asistente.id || index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-6 h-6 rounded-full bg-[#D6A75D]/10 flex items-center justify-center text-[#D6A75D] text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-sm">Pasajero {index + 1}</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Nombre</label>
                                                        <input
                                                            type="text"
                                                            value={asistente.nombre}
                                                            onChange={(e) => {
                                                                const updated = [...asistentes];
                                                                updated[index] = { ...updated[index], nombre: e.target.value };
                                                                setAsistentes(updated);
                                                            }}
                                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-5 gap-2">
                                                        <div className="col-span-2">
                                                            <label className="block text-xs text-gray-500 mb-1">Tipo Doc.</label>
                                                            <select
                                                                value={asistente.tipoDocumento}
                                                                onChange={(e) => {
                                                                    const updated = [...asistentes];
                                                                    updated[index] = { ...updated[index], tipoDocumento: e.target.value };
                                                                    setAsistentes(updated);
                                                                }}
                                                                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                                            >
                                                                <option value="PASAPORTE">Pasaporte</option>
                                                                <option value="CC">Cédula (CC)</option>
                                                                <option value="CE">Cédula Ext. (CE)</option>
                                                                <option value="TI">Tarjeta Identidad</option>
                                                            </select>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <label className="block text-xs text-gray-500 mb-1">Nro. Documento</label>
                                                            <input
                                                                type="text"
                                                                value={asistente.numeroDocumento}
                                                                onChange={(e) => {
                                                                    const updated = [...asistentes];
                                                                    updated[index] = { ...updated[index], numeroDocumento: e.target.value };
                                                                    setAsistentes(updated);
                                                                }}
                                                                placeholder="Número de documento"
                                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Email (opcional)</label>
                                                        <input
                                                            type="email"
                                                            value={asistente.email}
                                                            onChange={(e) => {
                                                                const updated = [...asistentes];
                                                                updated[index] = { ...updated[index], email: e.target.value };
                                                                setAsistentes(updated);
                                                            }}
                                                            placeholder="correo@ejemplo.com"
                                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-500 mb-1">Teléfono (opcional)</label>
                                                        <input
                                                            type="text"
                                                            value={asistente.telefono}
                                                            onChange={(e) => {
                                                                const updated = [...asistentes];
                                                                updated[index] = { ...updated[index], telefono: e.target.value };
                                                                setAsistentes(updated);
                                                            }}
                                                            placeholder="+57 300 000 0000"
                                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Service Details */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiMapPin className="text-[#D6A75D]" /> Detalles del Servicio
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-500 mb-1">Servicio</label>
                                    <p className="font-bold text-lg">
                                        {reserva.servicio?.nombre ? getLocalizedText(reserva.servicio.nombre, 'ES') : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Fecha y Hora</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={fecha}
                                            onChange={(e) => setFecha(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                        <input
                                            type="time"
                                            value={hora}
                                            onChange={(e) => setHora(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Pasajeros</label>
                                    <div className="flex items-center gap-2">
                                        <FiUsers className="text-gray-400" />
                                        <input
                                            type="number"
                                            min="1"
                                            value={numeroPasajeros}
                                            onChange={(e) => setNumeroPasajeros(Number(e.target.value))}
                                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                    </div>
                                </div>
                                {/* Cantidad de Horas - Only for hourly services */}
                                {reserva.cantidadHoras && (
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Duración</label>
                                        <div className="flex items-center gap-2">
                                            <FiClock className="text-gray-400" />
                                            <p className="font-medium">{reserva.cantidadHoras} horas</p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Municipio</label>
                                    <input
                                        type="text"
                                        value={municipio}
                                        onChange={(e) => setMunicipio(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    />
                                </div>
                                {/* Número de Vuelo - Solo para servicios de aeropuerto */}
                                {reserva.servicio?.esAeropuerto && (
                                    <div className={`md:col-span-2 p-4 rounded-lg border ${numeroVuelo ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <label className={`block text-sm font-bold mb-1 ${numeroVuelo ? 'text-blue-800' : 'text-yellow-800'}`}>
                                            ✈️ Número de Vuelo
                                        </label>
                                        <input
                                            type="text"
                                            value={numeroVuelo}
                                            onChange={(e) => setNumeroVuelo(e.target.value)}
                                            placeholder="Ej: AV9364"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none bg-white"
                                        />
                                    </div>
                                )}
                                {/* Origen / Lugar de Recogida */}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">
                                        {reserva.aeropuertoTipo === 'DESDE' ? 'Origen' : 'Lugar de Recogida'}
                                    </label>
                                    {reserva.aeropuertoTipo === 'DESDE' ? (
                                        <select
                                            value={aeropuertoNombre}
                                            onChange={(e) => setAeropuertoNombre(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        >
                                            <option value="">Seleccionar Aeropuerto</option>
                                            <option value="JOSE_MARIA_CORDOVA">Aeropuerto JMC</option>
                                            <option value="OLAYA_HERRERA">Aeropuerto Olaya Herrera</option>
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={lugarRecogida}
                                            onChange={(e) => setLugarRecogida(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        />
                                    )}
                                </div>
                                {/* Destino */}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Destino</label>
                                    <p className="font-medium">
                                        {reserva.aeropuertoTipo === 'HACIA'
                                            ? (reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' ? 'Aeropuerto JMC' : 'Aeropuerto Olaya Herrera')
                                            : (reserva.aeropuertoTipo === 'DESDE'
                                                ? (reserva.lugarRecogida || 'Tu Hotel/Residencia')
                                                : (reserva.servicio?.destinoAutoFill ||
                                                    (typeof reserva.servicio?.nombre === 'string'
                                                        ? reserva.servicio?.nombre
                                                        : (reserva.servicio?.nombre?.['es'] || reserva.servicio?.nombre?.['en']))
                                                    || 'No especificado')
                                            )
                                        }
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Vehículo ({reserva.vehiculo?.nombre})</label>
                                    <select
                                        value={vehiculoId}
                                        onChange={(e) => setVehiculoId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    >
                                        <option value="">Seleccionar Vehículo</option>
                                        {vehiculos.map((v) => (
                                            <option key={v.id} value={v.id}>
                                                {v.nombre} ({v.pasajerosMax} pax)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm text-gray-500 mb-1">Notas Adicionales</label>
                                    <textarea
                                        value={notas}
                                        onChange={(e) => setNotas(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiDollarSign className="text-[#D6A75D]" /> Cotización y Pagos
                            </h2>

                            {reserva.estado === 'PENDIENTE_COTIZACION' ? (
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                                    <h3 className="font-bold text-blue-900 mb-2">Establecer Precio</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="block text-sm text-blue-800 mb-1">Precio Total (COP)</label>
                                            <input
                                                type="number"
                                                value={quotePrice}
                                                onChange={(e) => setQuotePrice(Number(e.target.value))}
                                                className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                        <div className="pt-6">
                                            <p className="text-xs text-blue-600">
                                                Al guardar, el estado cambiará a <strong>Confirmada</strong> y se enviará el email de cotización.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 border-b border-gray-100 pb-4 mb-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Precio Base</span>
                                        <span className="font-medium">${Number(reserva.precioBase).toLocaleString('es-CO')}</span>
                                    </div>
                                    {reserva.precioAdicionales > 0 && (
                                        <>
                                            <div className="flex justify-between font-semibold text-gray-700 border-t pt-2 mt-1">
                                                <span>Adicionales</span>
                                                <span>${Number(reserva.precioAdicionales).toLocaleString('es-CO')}</span>
                                            </div>
                                            {/* Desglose Detallado de Adicionales */}
                                            <div className="pl-4 border-l-2 border-blue-200 ml-2 my-2 space-y-2 bg-blue-50 p-3 rounded-r-lg">
                                                {(() => {
                                                    const items: JSX.Element[] = [];

                                                    // 1. Dynamic Fields (Campos Personalizados del Servicio)
                                                    try {
                                                        const dynamicFields = reserva.servicio?.camposPersonalizadosBuffer
                                                            ? (Array.isArray(reserva.servicio.camposPersonalizadosBuffer)
                                                                ? reserva.servicio.camposPersonalizadosBuffer
                                                                : JSON.parse(reserva.servicio.camposPersonalizadosBuffer))
                                                            : (reserva.servicio?.camposPersonalizados
                                                                ? (Array.isArray(reserva.servicio.camposPersonalizados)
                                                                    ? reserva.servicio.camposPersonalizados
                                                                    : JSON.parse(reserva.servicio.camposPersonalizados as string))
                                                                : []);

                                                        if (dynamicFields.length && reserva.datosDinamicos) {
                                                            dynamicFields.forEach((field: any) => {
                                                                // Get the field key - different formats supported
                                                                const fieldKey = field.clave || field.key || field.id || field.name;
                                                                if (!fieldKey) return;

                                                                // Get user's value for this field
                                                                const value = reserva.datosDinamicos[fieldKey];
                                                                if (value === undefined || value === null) return;

                                                                // Get field configuration
                                                                const tipo = field.tipo ? field.tipo.toUpperCase() : '';
                                                                const label = field.etiqueta?.es || field.label || fieldKey;
                                                                const tienePrecio = field.tienePrecio !== false; // Default true

                                                                if (!tienePrecio) return;

                                                                let itemPrice = 0;
                                                                let displayValue = '';

                                                                // Calculate price based on field type
                                                                if (tipo === 'SWITCH' && value === true) {
                                                                    const precio = field.precio || field.precioUnitario || 0;
                                                                    itemPrice = Number(precio);
                                                                    displayValue = '1 unidad';
                                                                } else if (tipo === 'COUNTER' && Number(value) > 0) {
                                                                    const precioUnitario = field.precioUnitario || 0;
                                                                    const cantidad = Number(value);
                                                                    itemPrice = cantidad * Number(precioUnitario);
                                                                    displayValue = `${cantidad} × $${Number(precioUnitario).toLocaleString('es-CO')}`;
                                                                } else if (tipo === 'SELECT' && field.opciones) {
                                                                    const opcionSeleccionada = field.opciones.find(
                                                                        (opt: any) => opt.valor === value
                                                                    );
                                                                    if (opcionSeleccionada?.precio) {
                                                                        itemPrice = Number(opcionSeleccionada.precio);
                                                                        displayValue = opcionSeleccionada.etiqueta?.es || opcionSeleccionada.label || value;
                                                                    }
                                                                }

                                                                if (itemPrice > 0) {
                                                                    items.push(
                                                                        <div key={`dyn-${fieldKey}`} className="flex justify-between items-center">
                                                                            <div className="flex-1">
                                                                                <p className="font-medium text-gray-700">{label}</p>
                                                                                <p className="text-xs text-gray-500">{displayValue}</p>
                                                                            </div>
                                                                            <span className="font-semibold text-blue-700">
                                                                                ${itemPrice.toLocaleString('es-CO')}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                }
                                                            });
                                                        }
                                                    } catch (e) {
                                                        console.error('Error parsing dynamic fields breakdown:', e);
                                                    }

                                                    // 2. Adicionales Seleccionados (Sistema Relacional)
                                                    if (reserva.adicionalesSeleccionados && Array.isArray(reserva.adicionalesSeleccionados)) {
                                                        reserva.adicionalesSeleccionados.forEach((sel: any) => {
                                                            const nombre = sel.adicional?.nombre || 'Adicional';
                                                            const cantidad = sel.cantidad || 1;
                                                            const precioUnitario = sel.precioUnitario || sel.adicional?.precio || 0;
                                                            const precioTotal = Number(precioUnitario) * Number(cantidad);

                                                            if (precioTotal > 0) {
                                                                items.push(
                                                                    <div key={`rel-${sel.id || nombre}`} className="flex justify-between items-center">
                                                                        <div className="flex-1">
                                                                            <p className="font-medium text-gray-700">{nombre}</p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {cantidad} × ${Number(precioUnitario).toLocaleString('es-CO')}
                                                                            </p>
                                                                        </div>
                                                                        <span className="font-semibold text-blue-700">
                                                                            ${precioTotal.toLocaleString('es-CO')}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                        });
                                                    }

                                                    if (items.length === 0) {
                                                        return (
                                                            <div className="text-sm text-gray-500 italic">
                                                                No se encontró el desglose de adicionales
                                                                <div className="text-xs mt-1 font-mono bg-white p-2 rounded">
                                                                    Debug: {JSON.stringify({
                                                                        hasDatosDinamicos: !!reserva.datosDinamicos,
                                                                        datosDinamicos: reserva.datosDinamicos,
                                                                        hasFields: !!reserva.servicio?.camposPersonalizados,
                                                                        fieldsType: typeof reserva.servicio?.camposPersonalizados
                                                                    }, null, 2)}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return <>{items}</>;
                                                })()}
                                            </div>
                                        </>
                                    )}
                                    {reserva.recargoNocturno > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Recargo Nocturno</span>
                                            <span className="font-medium">${Number(reserva.recargoNocturno).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    {reserva.tarifaMunicipio > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tarifa Municipio</span>
                                            <span className="font-medium">${Number(reserva.tarifaMunicipio).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    {reserva.descuentoAliado > 0 && (
                                        <div className="flex justify-between text-green-600">
                                            <span>Descuento Aliado</span>
                                            <span className="font-medium">-${Number(reserva.descuentoAliado).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                                        <span>Total</span>
                                        <span className="text-[#D6A75D]">${Number(reserva.precioTotal).toLocaleString('es-CO')}</span>
                                    </div>

                                    {reserva.esReservaAliado && Number(reserva.comisionAliado) > 0 && (
                                        <div className="flex justify-between text-sm font-medium text-blue-600 mt-2 pt-2 border-t border-dashed border-gray-200">
                                            <span>Comisión Aliado ({reserva.aliado?.nombre})</span>
                                            <span>${Number(reserva.comisionAliado).toLocaleString('es-CO')}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment Status */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <p className="text-sm text-gray-500">Método de Pago</p>
                                    <p className={`font-bold ${metodoPago === 'BOLD' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                        {metodoPago === 'BOLD' ? 'BOLD (Tarjeta)' : 'EFECTIVO'}
                                    </p>
                                    {metodoPago === 'BOLD' && (
                                        <p className={`text-sm font-semibold mt-1 ${estadoBold === 'PAGADO' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            Estado BOLD: {estadoBold}
                                        </p>
                                    )}
                                </div>
                                {reserva.hashPago && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-mono">Hash: {reserva.hashPago.substring(0, 8)}...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Management */}
                    <div className="space-y-6">
                        {/* Status Management */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#D6A75D]">
                            <h2 className="text-lg font-bold mb-4">Gestión de Estado</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estado Actual
                                    </label>
                                    <select
                                        value={selectedEstado}
                                        onChange={(e) => setSelectedEstado(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    >
                                        {Object.values(EstadoReserva).map((estado) => (
                                            <option key={estado} value={estado}>
                                                {getStateLabel(estado)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Cambiar el estado enviará automáticamente los correos de notificación correspondientes al cliente.
                                </p>
                            </div>
                        </div>

                        {/* Assignment */}
                        <div className="bg-white p-6 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FiTruck className="text-[#D6A75D]" /> Asignación
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Conductor
                                    </label>
                                    <select
                                        value={selectedConductor}
                                        onChange={(e) => setSelectedConductor(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] outline-none"
                                    >
                                        <option value="">Seleccionar Conductor</option>
                                        {conductores.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre} {c.disponible ? '(Disponible)' : '(Ocupado)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                            </div>
                        </div>

                        {/* Ally Info (if applicable) */}
                        {reserva.aliado && (
                            <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-100">
                                <h2 className="text-lg font-bold text-blue-900 mb-2">Reserva de Aliado</h2>
                                <p className="font-medium text-blue-800">{reserva.aliado.nombre}</p>
                                <p className="text-sm text-blue-600">{reserva.aliado.tipo}</p>
                                <div className="mt-4 pt-4 border-t border-blue-200">
                                    <p className="text-xs text-blue-500">
                                        Código Aliado: {reserva.aliado.codigo}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
