'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, ModalFooter } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiPhone } from 'react-icons/fi';

interface Conductor {
    id: string;
    nombre: string;
    whatsapp: string;
    disponible: boolean;
    activo: boolean;
    fotosVehiculo: string[];
}

export default function ConductoresPage() {
    const router = useRouter();
    const [conductores, setConductores] = useState<Conductor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingConductor, setEditingConductor] = useState<Conductor | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        whatsapp: '',
        disponible: true,
        activo: true
    });

    useEffect(() => {
        fetchConductores();
    }, []);

    const fetchConductores = async () => {
        try {
            const res = await fetch('/api/conductores');
            const data = await res.json();
            setConductores(data.data || []);
        } catch (error) {
            console.error('Error fetching conductores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingConductor
                ? `/api/conductores/${editingConductor.id}`
                : '/api/conductores';

            const method = editingConductor ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchConductores();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving conductor:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este conductor?')) return;

        try {
            const res = await fetch(`/api/conductores/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchConductores();
            }
        } catch (error) {
            console.error('Error deleting conductor:', error);
        }
    };

    const handleEdit = (conductor: Conductor) => {
        setEditingConductor(conductor);
        setFormData({
            nombre: conductor.nombre,
            whatsapp: conductor.whatsapp,
            disponible: conductor.disponible,
            activo: conductor.activo
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingConductor(null);
        setFormData({
            nombre: '',
            whatsapp: '',
            disponible: true,
            activo: true
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando conductores...</p>
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
                            <h1 className="text-3xl font-bold">Gestión de Conductores</h1>
                            <p className="text-gray-400 mt-1">Administra tu equipo de conductores</p>
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
                    <div className="flex gap-6">
                        <p className="text-gray-600">
                            Total: <span className="font-bold text-gray-900">{conductores.length}</span>
                        </p>
                        <p className="text-gray-600">
                            Activos: <span className="font-bold text-green-600">
                                {conductores.filter(c => c.activo).length}
                            </span>
                        </p>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <FiPlus className="mr-2" />
                        Nuevo Conductor
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {conductores.map((conductor) => (
                        <Card key={conductor.id} hover>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                        {conductor.nombre}
                                    </h3>
                                    <a
                                        href={`https://wa.me/${conductor.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors"
                                    >
                                        <FiPhone size={16} />
                                        {conductor.whatsapp}
                                    </a>
                                </div>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${conductor.activo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {conductor.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => handleEdit(conductor)}
                                >
                                    <FiEdit2 className="mr-2" size={16} />
                                    Editar
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(conductor.id)}
                                >
                                    <FiTrash2 size={16} />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {conductores.length === 0 && (
                    <Card className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <FiPlus size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No hay conductores registrados
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Comienza agregando tu primer conductor
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            Agregar Primer Conductor
                        </Button>
                    </Card>
                )}
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingConductor ? 'Editar Conductor' : 'Nuevo Conductor'}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Nombre Completo"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Carlos González"
                            required
                            fullWidth
                        />

                        <Input
                            label="WhatsApp"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                            placeholder="+57 300 123 4567"
                            required
                            fullWidth
                            helperText="Incluye código de país (+57)"
                        />

                        <div className="space-y-3">


                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={formData.activo}
                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-[#D6A75D] focus:ring-[#D6A75D]"
                                />
                                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                                    Conductor activo en el sistema
                                </label>
                            </div>
                        </div>
                    </div>

                    <ModalFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingConductor ? 'Guardar Cambios' : 'Crear Conductor'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}
