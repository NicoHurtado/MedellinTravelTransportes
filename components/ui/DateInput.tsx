'use client';

import { useState, useEffect } from 'react';

interface DateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    required?: boolean;
    min?: string;
    showHelper?: boolean;
}

export default function DateInput({ value, onChange, className = '', placeholder = 'Ej: 25/12/2024', required = false, min, showHelper = false }: DateInputProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Detectar si es dispositivo móvil
        const checkMobile = () => {
            const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            setIsMobile(mobile);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Convertir el valor ISO a formato dd/mm/yyyy para display
        if (value && !isMobile) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    setDisplayValue(`${day}/${month}/${year}`);
                }
            } catch (e) {
                setDisplayValue('');
            }
        }
    }, [value, isMobile]);

    const handleDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let inputValue = e.target.value.replace(/[^\d]/g, ''); // Solo números
        
        // Limitar a 8 dígitos (ddmmyyyy)
        if (inputValue.length > 8) {
            inputValue = inputValue.slice(0, 8);
        }

        // Formatear con "/"
        let formatted = '';
        if (inputValue.length > 0) {
            formatted = inputValue.slice(0, 2);
            if (inputValue.length > 2) {
                formatted += '/' + inputValue.slice(2, 4);
            }
            if (inputValue.length > 4) {
                formatted += '/' + inputValue.slice(4, 8);
            }
        }

        setDisplayValue(formatted);

        // Si está completo, validar y convertir a formato ISO
        if (inputValue.length === 8) {
            const day = parseInt(inputValue.slice(0, 2));
            const month = parseInt(inputValue.slice(2, 4));
            const year = parseInt(inputValue.slice(4, 8));

            // Validación básica
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                // Crear fecha en formato ISO (yyyy-mm-dd)
                const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onChange(isoDate);
            }
        } else if (formatted === '') {
            onChange('');
        }
    };

    const handleDesktopBlur = () => {
        // Al perder el foco, validar la fecha completa
        if (displayValue.length === 10) {
            const parts = displayValue.split('/');
            if (parts.length === 3) {
                const day = parseInt(parts[0]);
                const month = parseInt(parts[1]);
                const year = parseInt(parts[2]);

                if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900) {
                    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    onChange(isoDate);
                }
            }
        }
    };

    if (isMobile) {
        // En móviles, usar el input nativo
        return (
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={className}
                required={required}
                min={min}
            />
        );
    }

    // En desktop, usar input de texto con máscara
    return (
        <>
            <input
                type="text"
                value={displayValue}
                onChange={handleDesktopChange}
                onBlur={handleDesktopBlur}
                placeholder={placeholder}
                className={className}
                required={required}
                maxLength={10}
            />
            {showHelper && (
                <p className="text-xs text-gray-500 mt-1">
                    Formato: día/mes/año (dd/mm/yyyy)
                </p>
            )}
        </>
    );
}
