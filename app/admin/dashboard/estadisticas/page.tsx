'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui';
import { FiCalendar, FiDollarSign, FiUsers, FiCreditCard, FiTrendingUp } from 'react-icons/fi';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const COLORS = ['#D6A75D', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function EstadisticasPage() {
    const [reservas, setReservas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'

    useEffect(() => {
        fetchReservas();
    }, []);

    const fetchReservas = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reservas');
            if (res.ok) {
                const data = await res.json();
                setReservas(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching reservas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter reservas by selected month
    const filteredReservas = selectedMonth === 'all'
        ? reservas
        : reservas.filter(r => {
            const reservaDate = new Date(r.fecha);
            const [year, month] = selectedMonth.split('-');
            return reservaDate.getFullYear() === parseInt(year) &&
                reservaDate.getMonth() === parseInt(month) - 1;
        });

    // Calculate KPIs
    const totalReservas = filteredReservas.length;
    const reservasAliados = filteredReservas.filter(r => r.esReservaAliado).length;
    const reservasIndependientes = filteredReservas.filter(r => !r.esReservaAliado).length;

    // Pagos exitosos por Bold (reservas pagadas con estado PAGADA o superior)
    // Incluye: Independientes y Airbnbs (que pagan por link)
    const pagosBold = filteredReservas
        .filter(r => {
            const isPaidState =
                r.estado === 'PAGADA_PENDIENTE_ASIGNACION' ||
                r.estado === 'ASIGNADA_PENDIENTE_COMPLETAR' ||
                r.estado === 'COMPLETADA';

            const isIndependent = !r.esReservaAliado;
            const isAirbnb = r.esReservaAliado && r.aliado?.tipo === 'AIRBNB';

            return isPaidState && (isIndependent || isAirbnb);
        })
        .reduce((sum, r) => sum + Number(r.precioTotal || 0), 0);

    // Pagos en efectivo por hoteles (reservas de aliados confirmadas)
    // Incluye: Solo Hoteles (que pagan en efectivo/cuenta cobro)
    const pagosEfectivoHoteles = filteredReservas
        .filter(r => {
            const isValidState =
                r.estado === 'PAGADA_PENDIENTE_ASIGNACION' ||
                r.estado === 'ASIGNADA_PENDIENTE_COMPLETAR' ||
                r.estado === 'COMPLETADA';

            const isHotel = r.esReservaAliado && r.aliado?.tipo === 'HOTEL';

            return isValidState && isHotel;
        })
        .reduce((sum, r) => sum + Number(r.precioTotal || 0), 0);

    // Chart 1: Reservas por Servicios
    const serviciosCounts: Record<string, number> = {};
    filteredReservas.forEach(r => {
        const rawName = r.servicio?.nombre;
        let nombre = 'Sin servicio';

        if (rawName) {
            if (typeof rawName === 'object') {
                nombre = (rawName as any)['es'] || (rawName as any)['en'] || 'Sin nombre';
            } else if (typeof rawName === 'string') {
                nombre = rawName;
            }
        }

        serviciosCounts[nombre] = (serviciosCounts[nombre] || 0) + 1;
    });
    const reservasPorServicios = Object.entries(serviciosCounts)
        .map(([nombre, count]) => ({ nombre, cantidad: count }))
        .sort((a, b) => b.cantidad - a.cantidad);

    // Chart 2: Reservas por Días del Mes
    const reservasPorDia: Record<number, number> = {};
    filteredReservas.forEach(r => {
        const dia = new Date(r.fecha).getDate();
        reservasPorDia[dia] = (reservasPorDia[dia] || 0) + 1;
    });
    const reservasPorDiaData = Object.entries(reservasPorDia)
        .map(([dia, count]) => ({ dia: `Día ${dia}`, cantidad: count }))
        .sort((a, b) => parseInt(a.dia.split(' ')[1]) - parseInt(b.dia.split(' ')[1]));

    // Chart 3: Reservas por Aliados
    const aliadosCounts: Record<string, number> = {};
    filteredReservas.filter(r => r.esReservaAliado).forEach(r => {
        const nombre = r.aliado?.nombre || 'Sin aliado';
        aliadosCounts[nombre] = (aliadosCounts[nombre] || 0) + 1;
    });
    const reservasPorAliados = Object.entries(aliadosCounts)
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);

    // Generate month options (last 12 months + current)
    const generateMonthOptions = () => {
        const options = [{ value: 'all', label: 'Histórico (Todos los meses)' }];
        const now = new Date();

        for (let i = 0; i < 12; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const label = date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
            options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
        }

        return options;
    };

    const monthOptions = generateMonthOptions();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
                            <p className="text-sm text-gray-500 mt-1">Análisis y métricas del negocio</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="px-8 py-6 space-y-6">
                {/* Month Selector */}
                <Card>
                    <div className="flex items-center gap-4">
                        <FiCalendar className="text-[#D6A75D]" size={24} />
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Período de Análisis
                            </label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                            >
                                {monthOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </Card>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Reservas Totales</p>
                                <p className="text-3xl font-bold text-gray-900">{totalReservas}</p>
                            </div>
                            <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                                <FiCalendar size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Reservas Aliados</p>
                                <p className="text-3xl font-bold text-gray-900">{reservasAliados}</p>
                                <p className="text-xs text-gray-500 mt-1">Hoteles/Airbnbs</p>
                            </div>
                            <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                                <FiUsers size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Reservas Independientes</p>
                                <p className="text-3xl font-bold text-gray-900">{reservasIndependientes}</p>
                                <p className="text-xs text-gray-500 mt-1">Clientes directos</p>
                            </div>
                            <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                                <FiTrendingUp size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Pagos Bold</p>
                                <p className="text-2xl font-bold text-gray-900">${pagosBold.toLocaleString('es-CO')}</p>
                                <p className="text-xs text-gray-500 mt-1">Pagos en línea</p>
                            </div>
                            <div className="bg-yellow-50 text-[#D6A75D] p-3 rounded-lg">
                                <FiCreditCard size={24} />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-1">Pagos Efectivo</p>
                                <p className="text-2xl font-bold text-gray-900">${pagosEfectivoHoteles.toLocaleString('es-CO')}</p>
                                <p className="text-xs text-gray-500 mt-1">Hoteles</p>
                            </div>
                            <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                                <FiDollarSign size={24} />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Reservas por Servicios */}
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Reservas por Servicios</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reservasPorServicios}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nombre" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#D6A75D" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* Chart 2: Reservas por Días del Mes */}
                    <Card>
                        <h3 className="text-lg font-bold mb-4">Reservas por Días del Mes</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reservasPorDiaData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="dia" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="cantidad" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Chart 3: Reservas por Aliados - Full Width */}
                <Card>
                    <h3 className="text-lg font-bold mb-4">Reservas por Aliados</h3>
                    {reservasPorAliados.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={reservasPorAliados} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="nombre" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="cantidad" fill="#10B981" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No hay reservas de aliados en este período
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
