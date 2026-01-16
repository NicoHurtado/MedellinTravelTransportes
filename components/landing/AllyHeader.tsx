'use client';

import Image from 'next/image';
import { FiLock } from 'react-icons/fi';

interface AllyHeaderProps {
    allyName: string;
    allyType?: string;
}

export default function AllyHeader({ allyName, allyType }: AllyHeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-sm py-4 shadow-lg">
            <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                {/* Logo - Sin link para evitar navegación */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Image
                            src="/logo.png"
                            alt="Transportes Medellín Travel"
                            width={48}
                            height={48}
                            className="w-10 h-10 md:w-12 md:h-12 object-contain"
                        />
                    </div>
                    <span className="font-bold text-lg md:text-xl tracking-tight text-white">
                        Transportes Medellín
                    </span>
                </div>

                {/* Indicador de Reserva Exclusiva */}
                <div className="flex items-center gap-2 bg-[#D6A75D]/20 border border-[#D6A75D]/50 px-4 py-2 rounded-lg">
                    <FiLock className="text-[#D6A75D]" size={16} />
                    <div className="hidden sm:block">
                        <p className="text-xs text-[#D6A75D]/80 font-medium">Portal Exclusivo</p>
                        <p className="text-sm text-white font-bold truncate max-w-[200px]">{allyName}</p>
                    </div>
                    <div className="sm:hidden">
                        <p className="text-xs text-[#D6A75D] font-bold">Exclusivo {allyType === 'HOTEL' ? 'Hotel' : 'Aliado'}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}

