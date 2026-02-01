'use client';

import { ReservationFormData, Asistente } from '@/types/reservation';
import { TipoDocumento } from '@prisma/client';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { useLanguage, t } from '@/lib/i18n';
import LegalNotice from '@/components/LegalNotice';

interface Step2Props {
    formData: ReservationFormData;
    updateFormData: (updates: Partial<ReservationFormData>) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function Step2ContactInfo({ formData, updateFormData, onNext, onBack }: Step2Props) {
    const { language } = useLanguage();

    const addAsistente = () => {
        updateFormData({
            asistentes: [
                ...formData.asistentes,
                { nombre: '', tipoDocumento: TipoDocumento.CC, numeroDocumento: '', email: '', telefono: '' }
            ]
        });
    };

    const removeAsistente = (index: number) => {
        if (formData.asistentes.length > 1) {
            updateFormData({
                asistentes: formData.asistentes.filter((_, i) => i !== index)
            });
        }
    };

    const updateAsistente = (index: number, field: keyof Asistente, value: string) => {
        const updated = [...formData.asistentes];
        updated[index] = { ...updated[index], [field]: value };
        updateFormData({ asistentes: updated });
    };

    const isValid = () => {
        return (
            formData.nombreCliente.trim().length >= 3 &&
            formData.whatsappCliente.trim().length >= 10 &&
            formData.emailCliente.includes('@') &&
            formData.asistentes.length > 0 &&
            formData.asistentes.every(a =>
                a.nombre.trim().length >= 2 &&
                a.numeroDocumento.trim().length >= 4
            )
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-2">{t('reservas.paso2_titulo', language)}</h2>
                <p className="text-gray-600">
                    {language === 'es' ? 'Necesitamos tus datos para coordinar el servicio' : 'We need your details to coordinate the service'}
                </p>
            </div>

            {/* Contact fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reservas.paso2_nombre', language)} *
                    </label>
                    <input
                        type="text"
                        value={formData.nombreCliente}
                        onChange={(e) => updateFormData({ nombreCliente: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        placeholder="Juan Pérez"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reservas.paso2_whatsapp', language)} *
                    </label>
                    <input
                        type="tel"
                        value={formData.whatsappCliente}
                        onChange={(e) => updateFormData({ whatsappCliente: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        placeholder="+57 300 123 4567"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('reservas.paso2_email', language)} *
                    </label>
                    <input
                        type="email"
                        value={formData.emailCliente}
                        onChange={(e) => updateFormData({ emailCliente: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none"
                        placeholder="juan@email.com"
                        required
                    />
                </div>
            </div>

            {/* Asistentes */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{t('reservas.paso2_asistentes_titulo', language)}</h3>
                    <button
                        onClick={addAsistente}
                        className="flex items-center gap-2 text-[#D6A75D] hover:text-[#C5964A] font-medium text-sm"
                    >
                        <FiPlus /> {t('reservas.paso2_agregar_asistente', language)}
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.asistentes.map((asistente, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">
                                    {language === 'es' ? 'Asistente' : 'Attendee'} {index + 1}
                                </span>
                                {formData.asistentes.length > 1 && (
                                    <button
                                        onClick={() => removeAsistente(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <FiTrash2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={asistente.nombre}
                                    onChange={(e) => updateAsistente(index, 'nombre', e.target.value)}
                                    placeholder={t('reservas.paso2_nombre_asistente', language) + ' *'}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none text-sm"
                                />
                                <select
                                    value={asistente.tipoDocumento}
                                    onChange={(e) => updateAsistente(index, 'tipoDocumento', e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none text-sm"
                                >
                                    <option value={TipoDocumento.CC}>{t('tipoDocumento.CC', language)}</option>
                                    <option value={TipoDocumento.PASAPORTE}>{t('tipoDocumento.PASAPORTE', language)}</option>
                                    <option value={TipoDocumento.TI}>{t('tipoDocumento.TI', language)}</option>
                                    <option value={TipoDocumento.CE}>{t('tipoDocumento.CE', language)}</option>
                                </select>
                                <input
                                    type="text"
                                    value={asistente.numeroDocumento}
                                    onChange={(e) => updateAsistente(index, 'numeroDocumento', e.target.value)}
                                    placeholder={t('reservas.paso2_numero_doc', language) + ' *'}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent outline-none text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-gray-500 mt-2">
                    {t('reservas.paso2_asistentes_nota', language)}
                </p>
            </div>

            {/* Aviso Legal */}
            <LegalNotice />
        </div>
    );
}
