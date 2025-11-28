'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, ModalFooter } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiUsers } from 'react-icons/fi';
import ImageUpload from '@/components/admin/ImageUpload';

interface Vehiculo {
    id: string;
    nombre: string;
    capacidadMinima: number;
    capacidadMaxima: number;
    imagen: string;
    activo: boolean;
}

export default function VehiculosPage() {
    const router = useRouter();
    const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVehiculo, setEditingVehiculo] = useState<Vehiculo | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        capacidadMinima: 1,
        capacidadMaxima: 4,
        imagen: '',
        activo: true
    });

    useEffect(() => {
        fetchVehiculos();
    }, []);

    const fetchVehiculos = async () => {
        try {
            const res = await fetch('/api/vehiculos');
            const data = await res.json();
            setVehiculos(data.data || []);
        } catch (error) {
            console.error('Error fetching vehiculos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingVehiculo
                ? `/api/vehiculos/${editingVehiculo.id}`
                : '/api/vehiculos';

            const method = editingVehiculo ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchVehiculos();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving vehiculo:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;

        try {
            const res = await fetch(`/api/vehiculos/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchVehiculos();
            }
        } catch (error) {
            console.error('Error deleting vehiculo:', error);
        }
    };

    const handleEdit = (vehiculo: Vehiculo) => {
        setEditingVehiculo(vehiculo);
        setFormData({
            nombre: vehiculo.nombre,
            capacidadMinima: vehiculo.capacidadMinima,
            capacidadMaxima: vehiculo.capacidadMaxima,
            imagen: vehiculo.imagen,
            activo: vehiculo.activo
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingVehiculo(null);
        setFormData({
            nombre: '',
            capacidadMinima: 1,
            capacidadMaxima: 4,
            imagen: '',
            activo: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando vehículos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-black text-white py-6 shadow-lg">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
                            <p className="text-gray-400 mt-1">Administra tu flota de vehículos</p>
                        </div>
                        <Button
                            onClick={() => router.push('/admin/dashboard')}
                            variant="ghost"
                            className="text-white"
                        >
                            <FiArrowLeft className="mr-2" />
                            Volver al Dashboard
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6 flex justify-between items-center">
                    <p className="text-gray-600">
                        Total de vehículos: <span className="font-bold text-gray-900">{vehiculos.length}</span>
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <FiPlus className="mr-2" />
                        Nuevo Vehículo
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehiculos.map((vehiculo) => (
                        <Card key={vehiculo.id} hover padding="none">
                            {/* Image */}
                            <div className="relative h-56 bg-gray-200 rounded-t-2xl overflow-hidden">
                                {vehiculo.imagen ? (
                                    <img
                                        src={vehiculo.imagen}
                                        alt={vehiculo.nombre}
                                        className="w-full h-full object-contain p-4"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        🚗
                                    </div>
                                )}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${vehiculo.activo
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {vehiculo.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">
                                    {vehiculo.nombre}
                                </h3>

                                <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                                    <FiUsers className="text-gray-600" size={20} />
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Capacidad</p>
                                        <p className="text-sm font-bold text-gray-900">
                                            {vehiculo.capacidadMinima} - {vehiculo.capacidadMaxima} pasajeros
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        onClick={() => handleEdit(vehiculo)}
                                    >
                                        <FiEdit2 className="mr-2" size={16} />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(vehiculo.id)}
                                    >
                                        <FiTrash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {vehiculos.length === 0 && (
                    <Card className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <FiPlus size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No hay vehículos registrados
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Comienza agregando tu primer vehículo
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            Agregar Primer Vehículo
                        </Button>
                    </Card>
                )}
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingVehiculo ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Nombre/Modelo del Vehículo"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Van 7 pasajeros, Sedan, SUV"
                            required
                            fullWidth
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Capacidad Mínima"
                                type="number"
                                min="1"
                                value={formData.capacidadMinima}
                                onChange={(e) => setFormData({ ...formData, capacidadMinima: Number(e.target.value) })}
                                required
                                fullWidth
                            />

                            <Input
                                label="Capacidad Máxima"
                                type="number"
                                min="1"
                                value={formData.capacidadMaxima}
                                onChange={(e) => setFormData({ ...formData, capacidadMaxima: Number(e.target.value) })}
                                required
                                fullWidth
                            />
                        </div>

                        <ImageUpload
                            value={formData.imagen}
                            onChange={(url) => setFormData({ ...formData, imagen: url })}
                            label="Imagen del Vehículo"
                        />

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="activo"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-[#D6A75D] focus:ring-[#D6A75D]"
                            />
                            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                                Vehículo activo (disponible para asignación)
                            </label>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                                <strong>💡 Nota:</strong> El vehículo se seleccionará automáticamente según el número de pasajeros en la reserva.
                            </p>
                        </div>
                    </div>

                    <ModalFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingVehiculo ? 'Guardar Cambios' : 'Crear Vehículo'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}
