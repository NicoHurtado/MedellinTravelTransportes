'use client';

import { useEffect, useState } from 'react';
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

    // Form states
    const [selectedConductor, setSelectedConductor] = useState('');

    const [selectedEstado, setSelectedEstado] = useState<string>('');
    const [quotePrice, setQuotePrice] = useState<number>(0);

    // Customer Edit States
    const [nombreCliente, setNombreCliente] = useState('');
    const [emailCliente, setEmailCliente] = useState('');
    const [whatsappCliente, setWhatsappCliente] = useState('');
    const [idioma, setIdioma] = useState('ES');

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/admin/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchData();
        }
    }, [status, id]);

    const fetchData = async () => {
        try {
            // Fetch Reserva
            const resReserva = await fetch(`/api/reservas/${id}`);
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

            // Fetch Conductores
            const resConductores = await fetch('/api/conductores?activo=true');
            if (resConductores.ok) {
                const dataConductores = await resConductores.json();
                setConductores(dataConductores.data || []);
            }



        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    };

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
                idioma
            };

            // If updating price for quote
            if (reserva.estado === 'PENDIENTE_COTIZACION' && selectedEstado === 'CONFIRMADA_PENDIENTE_PAGO') {
                body.precioTotal = quotePrice;
                body.precioBase = quotePrice; // Assuming base price update for simplicity
            }

            const res = await fetch(`/api/reservas/${id}`, {
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
                                    <div className="flex items-center gap-2">
                                        <FiCalendar className="text-gray-400" />
                                        <p className="font-medium">
                                            {formatReservationDate(reserva.fecha, 'es-CO', 'short')} - {reserva.hora}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Pasajeros</label>
                                    <div className="flex items-center gap-2">
                                        <FiUsers className="text-gray-400" />
                                        <p className="font-medium">{reserva.numeroPasajeros}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">Municipio</label>
                                    <p className="font-medium">{reserva.municipio}</p>
                                </div>
                                {/* Origen / Lugar de Recogida */}
                                <div>
                                    <label className="block text-sm text-gray-500 mb-1">
                                        {reserva.aeropuertoTipo === 'DESDE' ? 'Origen' : 'Lugar de Recogida'}
                                    </label>
                                    <p className="font-medium">
                                        {reserva.aeropuertoTipo === 'DESDE'
                                            ? (reserva.aeropuertoNombre === 'JOSE_MARIA_CORDOVA' ? 'Aeropuerto JMC' : 'Aeropuerto Olaya Herrera')
                                            : (reserva.lugarRecogida || 'No especificado')}
                                    </p>
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
                                {reserva.vehiculo && (
                                    <div>
                                        <label className="block text-sm text-gray-500 mb-1">Vehículo</label>
                                        <p className="font-medium">{reserva.vehiculo.nombre}</p>
                                    </div>
                                )}
                                {reserva.notas && (
                                    <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                        <label className="block text-sm text-yellow-800 font-bold mb-1">Notas Adicionales</label>
                                        <p className="text-sm text-yellow-900">{reserva.notas}</p>
                                    </div>
                                )}
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
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Adicionales</span>
                                            <span className="font-medium">${Number(reserva.precioAdicionales).toLocaleString('es-CO')}</span>
                                        </div>
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
                                    <p className="text-sm text-gray-500">Estado del Pago</p>
                                    <p className={`font-bold ${reserva.estadoPago === 'APROBADO' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {reserva.estadoPago || 'PENDIENTE'}
                                    </p>
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
