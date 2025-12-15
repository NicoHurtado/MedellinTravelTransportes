'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, ModalFooter } from '@/components/ui';
import { FiPlus, FiEdit2, FiTrash2, FiArrowLeft, FiCopy, FiSettings, FiCheck } from 'react-icons/fi';
import ConfiguracionPrecios from '@/components/admin/ConfiguracionPrecios';

interface Aliado {
    id: string;
    nombre: string;
    tipo: 'HOTEL' | 'AIRBNB' | 'AGENCIA';
    codigo: string;
    email: string;
    contacto: string;
    activo: boolean;
    _count?: {
        reservas: number;
    };
}

export default function AliadosPage() {
    const router = useRouter();
    const [aliados, setAliados] = useState<Aliado[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
    const [editingAliado, setEditingAliado] = useState<Aliado | null>(null);
    const [configuringAliadoId, setConfiguringAliadoId] = useState<string | null>(null);
    const [copiedCodigo, setCopiedCodigo] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'HOTEL' as 'HOTEL' | 'AIRBNB' | 'AGENCIA',
        email: '',
        contacto: '',
        activo: true
    });

    useEffect(() => {
        fetchAliados();
    }, []);

    const fetchAliados = async () => {
        try {
            const res = await fetch('/api/aliados');
            const data = await res.json();
            setAliados(data.data || []);
        } catch (error) {
            console.error('Error fetching aliados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingAliado
                ? `/api/aliados/${editingAliado.id}`
                : '/api/aliados';

            const method = editingAliado ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchAliados();
                handleCloseModal();
                
                // Ya no se abre automáticamente la configuración de precios
                // El usuario debe hacer clic manualmente en "Configurar Precios"
            }
        } catch (error) {
            console.error('Error saving aliado:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este aliado?')) return;

        try {
            const res = await fetch(`/api/aliados/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchAliados();
            }
        } catch (error) {
            console.error('Error deleting aliado:', error);
        }
    };

    const handleEdit = (aliado: Aliado) => {
        setEditingAliado(aliado);
        setFormData({
            nombre: aliado.nombre,
            tipo: aliado.tipo,
            email: aliado.email,
            contacto: aliado.contacto,
            activo: aliado.activo
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAliado(null);
        setFormData({
            nombre: '',
            tipo: 'HOTEL',
            email: '',
            contacto: '',
            activo: true
        });
    };

    const copyCode = (codigo: string) => {
        navigator.clipboard.writeText(codigo);
        setCopiedCodigo(codigo);
        setTimeout(() => setCopiedCodigo(null), 2000);
    };

    const copyLink = (codigo: string, tipo: 'HOTEL' | 'AIRBNB' | 'AGENCIA') => {
        // Hotel y Agencia usan '/hotel/', Airbnb usa '/reservas/'
        const path = (tipo === 'HOTEL' || tipo === 'AGENCIA') ? 'hotel' : 'reservas';
        const link = `${window.location.origin}/${path}/${codigo}`;
        navigator.clipboard.writeText(link);
        setCopiedCodigo(`LINK-${codigo}`);
        setTimeout(() => setCopiedCodigo(null), 2000);
    };

    const handleConfigPrecios = (aliadoId: string) => {
        setConfiguringAliadoId(aliadoId);
        setIsConfigModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D6A75D] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Cargando aliados...</p>
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
                            <h1 className="text-3xl font-bold">Gestión de Aliados</h1>
                            <p className="text-gray-400 mt-1">Administra hoteles, agencias y Airbnbs</p>
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
                        Total de aliados: <span className="font-bold text-gray-900">{aliados.length}</span>
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <FiPlus className="mr-2" />
                        Nuevo Aliado
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aliados.map((aliado) => (
                        <Card key={aliado.id} hover>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                                        {aliado.nombre}
                                    </h3>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                        aliado.tipo === 'HOTEL'
                                            ? 'bg-blue-100 text-blue-800'
                                            : aliado.tipo === 'AIRBNB'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-green-100 text-green-800'
                                        }`}>
                                        {aliado.tipo}
                                    </span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${aliado.activo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {aliado.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-xs text-gray-500">Código de Acceso</p>
                                        <p className="text-lg font-bold text-[#D6A75D]">{aliado.codigo}</p>
                                    </div>
                                    <button
                                        onClick={() => copyCode(aliado.codigo)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                        title="Copiar código"
                                    >
                                        {copiedCodigo === aliado.codigo ? (
                                            <FiCheck size={18} className="text-green-600" />
                                        ) : (
                                            <FiCopy size={18} className="text-gray-600" />
                                        )}
                                    </button>
                                </div>

                                {/* Public Link Section - Always show for all types */}
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    {(aliado.tipo === 'HOTEL' || aliado.tipo === 'AGENCIA') ? (
                                        <>
                                            {/* Hotel y Agencia tienen código de acceso y link público */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">
                                                        {aliado.tipo === 'HOTEL' ? 'Link Público (Huéspedes):' : 'Link Público (Clientes):'}
                                                    </span>
                                                    <button
                                                        onClick={() => copyLink(aliado.codigo, aliado.tipo)}
                                                        className="text-xs flex items-center gap-1 text-[#D6A75D] hover:text-[#C5964A] font-medium"
                                                        title={aliado.tipo === 'HOTEL' ? 'Link para huéspedes - pago en efectivo' : 'Link para clientes - pago en efectivo'}
                                                    >
                                                        {copiedCodigo === `LINK-${aliado.codigo}` ? (
                                                            <>
                                                                <FiCheck size={14} /> Copiado
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCopy size={14} /> Copiar Link
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-400 italic">
                                                    💡 El código es para {aliado.tipo === 'HOTEL' ? 'recepcionistas' : 'empleados de la agencia'}. El link público es para {aliado.tipo === 'HOTEL' ? 'huéspedes' : 'clientes'} (pago en efectivo).
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {/* Airbnb only has public link */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Enlace de reservas:</span>
                                                <button
                                                    onClick={() => copyLink(aliado.codigo, aliado.tipo)}
                                                    className="text-xs flex items-center gap-1 text-[#D6A75D] hover:text-[#C5964A] font-medium"
                                                >
                                                    {copiedCodigo === `LINK-${aliado.codigo}` ? (
                                                        <>
                                                            <FiCheck size={14} /> Copiado
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FiCopy size={14} /> Copiar Link
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="text-sm text-gray-600">
                                    <p>📧 {aliado.email}</p>
                                    <p>📱 {aliado.contacto}</p>
                                </div>

                                {aliado._count && (
                                    <p className="text-sm text-gray-500">
                                        📊 {aliado._count.reservas} reservas
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    fullWidth
                                    onClick={() => handleConfigPrecios(aliado.id)}
                                >
                                    <FiSettings className="mr-2" size={16} />
                                    Configurar Precios
                                </Button>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        fullWidth
                                        onClick={() => handleEdit(aliado)}
                                    >
                                        <FiEdit2 className="mr-2" size={16} />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => handleDelete(aliado.id)}
                                    >
                                        <FiTrash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {aliados.length === 0 && (
                    <Card className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                            <FiPlus size={48} className="mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No hay aliados registrados
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Comienza creando tu primer aliado
                        </p>
                        <Button onClick={() => setIsModalOpen(true)}>
                            Crear Primer Aliado
                        </Button>
                    </Card>
                )}
            </main>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingAliado ? 'Editar Aliado' : 'Nuevo Aliado'}
                size="md"
            >
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <Input
                            label="Nombre del Aliado"
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            placeholder="Ej: Hotel Medellín Plaza"
                            required
                            fullWidth
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tipo de Aliado
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="HOTEL"
                                        checked={formData.tipo === 'HOTEL'}
                                        onChange={(e) => setFormData({ ...formData, tipo: 'HOTEL' })}
                                        className="w-4 h-4 text-[#D6A75D] focus:ring-[#D6A75D]"
                                    />
                                    <span className="text-sm">Hotel</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="AIRBNB"
                                        checked={formData.tipo === 'AIRBNB'}
                                        onChange={(e) => setFormData({ ...formData, tipo: 'AIRBNB' })}
                                        className="w-4 h-4 text-[#D6A75D] focus:ring-[#D6A75D]"
                                    />
                                    <span className="text-sm">Airbnb</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="AGENCIA"
                                        checked={formData.tipo === 'AGENCIA'}
                                        onChange={(e) => setFormData({ ...formData, tipo: 'AGENCIA' })}
                                        className="w-4 h-4 text-[#D6A75D] focus:ring-[#D6A75D]"
                                    />
                                    <span className="text-sm">Agencia</span>
                                </label>
                            </div>
                        </div>

                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="contacto@hotel.com"
                            required
                            fullWidth
                        />

                        <Input
                            label="Teléfono de Contacto"
                            value={formData.contacto}
                            onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                            placeholder="+57 300 123 4567"
                            required
                            fullWidth
                        />

                        {editingAliado && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <strong>Código de acceso:</strong> {editingAliado.codigo}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    El código se genera automáticamente y no puede modificarse
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="activo"
                                checked={formData.activo}
                                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-[#D6A75D] focus:ring-[#D6A75D]"
                            />
                            <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                                Aliado activo
                            </label>
                        </div>
                    </div>

                    <ModalFooter className="mt-6">
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            {editingAliado ? 'Guardar Cambios' : 'Crear Aliado'}
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>

            {/* Modal Configuración de Precios */}
            <Modal
                isOpen={isConfigModalOpen}
                onClose={() => setIsConfigModalOpen(false)}
                title="Configuración de Precios y Servicios"
                size="xl"
            >
                {configuringAliadoId && (
                    <ConfiguracionPrecios
                        aliadoId={configuringAliadoId}
                        onClose={() => setIsConfigModalOpen(false)}
                        onSave={() => {
                            fetchAliados();
                            setIsConfigModalOpen(false);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}
