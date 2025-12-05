'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, ModalFooter } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiPhone } from 'react-icons/fi';

interface Conductor {
    id: string;
    nombre: string;
    whatsapp: string;
    telefono: string;
    documento: string;
    placa: string;
    foto: string | null;
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
        telefono: '',
        documento: '',
        placa: '',
        foto: null as string | null,
        disponible: true,
        activo: true
    });
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    useEffect(() => {
        fetchConductores();
    }, []);

    const fetchConductores = async () => {
        try {
            const res = await fetch('/api/conductores?activo=true');
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

            const data = await res.json();

            if (res.ok) {
                await fetchConductores();
            } else {
                alert(data.error || 'Error al eliminar el conductor');
            }
        } catch (error) {
            console.error('Error deleting conductor:', error);
            alert('Error al eliminar el conductor');
        }
    };

    const handleEdit = (conductor: Conductor) => {
        setEditingConductor(conductor);
        setFormData({
            nombre: conductor.nombre,
            whatsapp: conductor.whatsapp,
            telefono: conductor.telefono,
            documento: conductor.documento,
            placa: conductor.placa,
            foto: conductor.foto,
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
            telefono: '',
            documento: '',
            placa: '',
            foto: null,
            disponible: true,
            activo: true
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingPhoto(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload
            });

            const data = await res.json();
            if (data.success) {
                setFormData({ ...formData, foto: data.url });
            } else {
                alert('Error al subir la foto: ' + data.error);
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Error al subir la foto');
        } finally {
            setUploadingPhoto(false);
        }
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
                            <div className="flex items-start gap-4 mb-4">
                                {/* Photo */}
                                {conductor.foto ? (
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D6A75D] flex-shrink-0">
                                        <img
                                            src={conductor.foto}
                                            alt={conductor.nombre}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl font-bold text-gray-500">
                                            {conductor.nombre.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 truncate">
                                        {conductor.nombre}
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Tel:</span> {conductor.telefono}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Doc:</span> {conductor.documento}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Placa:</span> {conductor.placa}
                                        </p>
                                        <a
                                            href={`https://wa.me/${conductor.whatsapp.replace(/\D/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
                                        >
                                            <FiPhone size={14} />
                                            WhatsApp
                                        </a>
                                    </div>
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
                            label="Teléfono"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            placeholder="+57 300 123 4567"
                            required
                            fullWidth
                            helperText="Número de contacto del conductor"
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

                        <Input
                            label="Documento"
                            value={formData.documento}
                            onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                            placeholder="1234567890"
                            required
                            fullWidth
                            helperText="Número de cédula o documento de identidad"
                        />

                        <Input
                            label="Placa del Vehículo"
                            value={formData.placa}
                            onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                            placeholder="ABC123"
                            required
                            fullWidth
                            helperText="Placa del vehículo asignado"
                        />

                        {/* Photo Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Foto del Conductor (Opcional)
                            </label>
                            <div className="flex items-center gap-4">
                                {formData.foto && (
                                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                                        <img
                                            src={formData.foto}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        disabled={uploadingPhoto}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-[#D6A75D] file:text-white
                                            hover:file:bg-[#C19747]
                                            file:cursor-pointer cursor-pointer"
                                    />
                                    {uploadingPhoto && (
                                        <p className="text-sm text-gray-500 mt-1">Subiendo foto...</p>
                                    )}
                                </div>
                            </div>
                        </div>

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
