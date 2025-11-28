'use client';

import { useState } from 'react';
import { DynamicField, SelectOption, createTextField, createCounterField, createSwitchField, createSelectField } from '@/types/dynamic-fields';
import { FiPlus, FiTrash2, FiMenu, FiEdit2, FiEye } from 'react-icons/fi';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DynamicFieldBuilderProps {
    fields: DynamicField[];
    onChange: (fields: DynamicField[]) => void;
    language?: 'es' | 'en';
}

export default function DynamicFieldBuilder({ fields, onChange, language = 'es' }: DynamicFieldBuilderProps) {
    const [isAddingField, setIsAddingField] = useState(false);
    const [editingField, setEditingField] = useState<{ index: number; field: DynamicField } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = fields.findIndex((f) => f.clave === active.id);
            const newIndex = fields.findIndex((f) => f.clave === over.id);

            const reordered = arrayMove(fields, oldIndex, newIndex);
            // Update orden values
            const updated = reordered.map((field, index) => ({ ...field, orden: index }));
            onChange(updated);
        }
    };

    const addField = (newField: DynamicField) => {
        onChange([...fields, { ...newField, orden: fields.length }]);
        setIsAddingField(false);
    };

    const updateField = (index: number, updatedField: DynamicField) => {
        const updated = [...fields];
        updated[index] = updatedField;
        onChange(updated);
        setEditingField(null);
    };

    const deleteField = (index: number) => {
        const updated = fields.filter((_, i) => i !== index);
        // Reorder
        const reordered = updated.map((field, i) => ({ ...field, orden: i }));
        onChange(reordered);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Campos Dinámicos</h3>
                <button
                    type="button"
                    onClick={() => setIsAddingField(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#D6A75D] text-black rounded-lg hover:bg-[#C5964A] transition-colors"
                >
                    <FiPlus /> Agregar Campo
                </button>
            </div>

            {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    No hay campos dinámicos. Haz clic en &quot;Agregar Campo&quot; para comenzar.
                </div>
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map((f) => f.clave)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                            {fields.map((field, index) => (
                                <SortableFieldItem
                                    key={field.clave}
                                    field={field}
                                    index={index}
                                    onEdit={() => setEditingField({ index, field })}
                                    onDelete={() => deleteField(index)}
                                    language={language}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}

            {/* Add Field Modal */}
            {isAddingField && (
                <FieldEditorModal
                    onSave={addField}
                    onClose={() => setIsAddingField(false)}
                    language={language}
                />
            )}

            {/* Edit Field Modal */}
            {editingField && (
                <FieldEditorModal
                    field={editingField.field}
                    onSave={(field) => updateField(editingField.index, field)}
                    onClose={() => setEditingField(null)}
                    language={language}
                />
            )}
        </div>
    );
}

// Sortable Field Item Component
function SortableFieldItem({
    field,
    index,
    onEdit,
    onDelete,
    language,
}: {
    field: DynamicField;
    index: number;
    onEdit: () => void;
    onDelete: () => void;
    language: 'es' | 'en';
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.clave });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getFieldTypeLabel = (tipo: string) => {
        const labels: Record<string, string> = {
            TEXT: 'Texto',
            TEXTAREA: 'Área de Texto',
            SELECT: 'Selección',
            SWITCH: 'Sí/No',
            COUNTER: 'Contador',
        };
        return labels[tipo] || tipo;
    };

    return (
        <div ref={setNodeRef} style={style} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                    <FiMenu size={20} />
                </button>

                {/* Field Info */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{field.etiqueta[language]}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{getFieldTypeLabel(field.tipo)}</span>
                        {field.requerido && <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">Requerido</span>}
                        {field.tienePrecio && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                ${field.precioUnitario?.toLocaleString('es-CO')}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Clave: {field.clave}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onEdit} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <FiEdit2 />
                    </button>
                    <button type="button" onClick={onDelete} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                        <FiTrash2 />
                    </button>
                </div>
            </div>
        </div>
    );
}

// Field Editor Modal Component
function FieldEditorModal({
    field,
    onSave,
    onClose,
    language,
}: {
    field?: DynamicField;
    onSave: (field: DynamicField) => void;
    onClose: () => void;
    language: 'es' | 'en';
}) {
    const [tipo, setTipo] = useState<'TEXT' | 'TEXTAREA' | 'SELECT' | 'SWITCH' | 'COUNTER'>(field?.tipo || 'TEXT');
    const [clave, setClave] = useState(field?.clave || '');
    const [etiquetaEs, setEtiquetaEs] = useState(field?.etiqueta.es || '');
    const [etiquetaEn, setEtiquetaEn] = useState(field?.etiqueta.en || '');
    const [requerido, setRequerido] = useState(field?.requerido || false);
    const [tienePrecio, setTienePrecio] = useState(field?.tienePrecio || false);
    const [precioUnitario, setPrecioUnitario] = useState(field?.precioUnitario || 0);
    const [placeholderEs, setPlaceholderEs] = useState(field?.placeholder?.es || '');
    const [placeholderEn, setPlaceholderEn] = useState(field?.placeholder?.en || '');
    const [opciones, setOpciones] = useState<SelectOption[]>(
        field && field.tipo === 'SELECT' && 'opciones' in field ? field.opciones : []
    );

    const handleSave = () => {
        // Validate
        if (!clave || !etiquetaEs || !etiquetaEn) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        // Create field based on type
        let newField: DynamicField;

        switch (tipo) {
            case 'TEXT':
            case 'TEXTAREA':
                newField = {
                    tipo,
                    clave,
                    etiqueta: { es: etiquetaEs, en: etiquetaEn },
                    requerido,
                    orden: field?.orden || 0,
                    tienePrecio: false,
                    placeholder: placeholderEs || placeholderEn ? { es: placeholderEs, en: placeholderEn } : undefined,
                } as DynamicField;
                break;

            case 'COUNTER':
                newField = {
                    tipo: 'COUNTER',
                    clave,
                    etiqueta: { es: etiquetaEs, en: etiquetaEn },
                    requerido,
                    orden: field?.orden || 0,
                    min: 0,
                    step: 1,
                    tienePrecio,
                    precioUnitario: tienePrecio ? precioUnitario : undefined,
                };
                break;

            case 'SWITCH':
                newField = {
                    tipo: 'SWITCH',
                    clave,
                    etiqueta: { es: etiquetaEs, en: etiquetaEn },
                    requerido,
                    orden: field?.orden || 0,
                    tienePrecio,
                    precioUnitario: tienePrecio ? precioUnitario : undefined,
                };
                break;

            case 'SELECT':
                if (opciones.length === 0) {
                    alert('Debes agregar al menos una opción');
                    return;
                }
                newField = {
                    tipo: 'SELECT',
                    clave,
                    etiqueta: { es: etiquetaEs, en: etiquetaEn },
                    requerido,
                    orden: field?.orden || 0,
                    opciones,
                    tienePrecio: false,
                };
                break;

            default:
                return;
        }

        onSave(newField);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold">{field ? 'Editar Campo' : 'Nuevo Campo'}</h2>
                </div>

                <div className="p-6 space-y-4">
                    {/* Field Type */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Tipo de Campo *</label>
                        <select
                            value={tipo}
                            onChange={(e) => setTipo(e.target.value as any)}
                            disabled={!!field} // Can't change type when editing
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        >
                            <option value="TEXT">Texto</option>
                            <option value="TEXTAREA">Área de Texto</option>
                            <option value="SELECT">Selección (Dropdown)</option>
                            <option value="SWITCH">Sí/No (Toggle)</option>
                            <option value="COUNTER">Contador (Numérico)</option>
                        </select>
                    </div>

                    {/* Field Key */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Clave Interna * (sin espacios)</label>
                        <input
                            type="text"
                            value={clave}
                            onChange={(e) => setClave(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            disabled={!!field} // Can't change key when editing
                            placeholder="ej: numeroVuelo, cantidadCamisetas"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                    </div>

                    {/* Labels */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Etiqueta (Español) *</label>
                            <input
                                type="text"
                                value={etiquetaEs}
                                onChange={(e) => setEtiquetaEs(e.target.value)}
                                placeholder="ej: Número de Vuelo"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Etiqueta (Inglés) *</label>
                            <input
                                type="text"
                                value={etiquetaEn}
                                onChange={(e) => setEtiquetaEn(e.target.value)}
                                placeholder="ej: Flight Number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Placeholders (for TEXT/TEXTAREA) */}
                    {(tipo === 'TEXT' || tipo === 'TEXTAREA') && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Placeholder (Español)</label>
                                <input
                                    type="text"
                                    value={placeholderEs}
                                    onChange={(e) => setPlaceholderEs(e.target.value)}
                                    placeholder="ej: Ej: AV123"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Placeholder (Inglés)</label>
                                <input
                                    type="text"
                                    value={placeholderEn}
                                    onChange={(e) => setPlaceholderEn(e.target.value)}
                                    placeholder="ej: Ex: AV123"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Required Checkbox */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="requerido"
                            checked={requerido}
                            onChange={(e) => setRequerido(e.target.checked)}
                            className="w-4 h-4 text-[#D6A75D] border-gray-300 rounded focus:ring-[#D6A75D]"
                        />
                        <label htmlFor="requerido" className="text-sm font-medium">
                            Campo requerido
                        </label>
                    </div>

                    {/* Pricing (for COUNTER and SWITCH) */}
                    {(tipo === 'COUNTER' || tipo === 'SWITCH') && (
                        <>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="tienePrecio"
                                    checked={tienePrecio}
                                    onChange={(e) => setTienePrecio(e.target.checked)}
                                    className="w-4 h-4 text-[#D6A75D] border-gray-300 rounded focus:ring-[#D6A75D]"
                                />
                                <label htmlFor="tienePrecio" className="text-sm font-medium">
                                    Este campo tiene precio
                                </label>
                            </div>

                            {tienePrecio && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Precio Unitario (COP)</label>
                                    <input
                                        type="number"
                                        value={precioUnitario}
                                        onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                                        min="0"
                                        step="1000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                                    />
                                </div>
                            )}
                        </>
                    )}

                    {/* Options (for SELECT) */}
                    {tipo === 'SELECT' && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Opciones</label>
                            <SelectOptionsBuilder opciones={opciones} onChange={setOpciones} />
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2 bg-[#D6A75D] text-black rounded-lg hover:bg-[#C5964A] transition-colors"
                    >
                        {field ? 'Actualizar' : 'Agregar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Select Options Builder Component
function SelectOptionsBuilder({
    opciones,
    onChange,
}: {
    opciones: SelectOption[];
    onChange: (opciones: SelectOption[]) => void;
}) {
    const addOption = () => {
        onChange([
            ...opciones,
            {
                valor: '',
                etiqueta: { es: '', en: '' },
            },
        ]);
    };

    const updateOption = (index: number, field: keyof SelectOption, value: any) => {
        const updated = [...opciones];
        if (field === 'etiqueta') {
            updated[index] = { ...updated[index], etiqueta: value };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        onChange(updated);
    };

    const deleteOption = (index: number) => {
        onChange(opciones.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            {opciones.map((opcion, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                            type="text"
                            value={opcion.valor}
                            onChange={(e) => updateOption(index, 'valor', e.target.value)}
                            placeholder="Valor (ej: basico)"
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                        <input
                            type="text"
                            value={opcion.etiqueta.es}
                            onChange={(e) => updateOption(index, 'etiqueta', { ...opcion.etiqueta, es: e.target.value })}
                            placeholder="Etiqueta ES"
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                        <input
                            type="text"
                            value={opcion.etiqueta.en}
                            onChange={(e) => updateOption(index, 'etiqueta', { ...opcion.etiqueta, en: e.target.value })}
                            placeholder="Etiqueta EN"
                            className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#D6A75D] focus:border-transparent"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => deleteOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                        <FiTrash2 />
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addOption}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#D6A75D] hover:text-[#D6A75D] transition-colors"
            >
                + Agregar Opción
            </button>
        </div>
    );
}
