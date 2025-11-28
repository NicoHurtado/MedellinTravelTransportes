'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiMenu, FiX, FiGlobe } from 'react-icons/fi';
import AliadoModal from './AliadoModal';
import { useLanguage, t } from '@/lib/i18n';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isAliadoModalOpen, setIsAliadoModalOpen] = useState(false);
    const { language, toggleLanguage } = useLanguage();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? 'bg-black/95 backdrop-blur-sm py-3 shadow-lg' : 'bg-black/90 py-5'
                    }`}
            >
                <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="relative z-50 flex items-center gap-3 group">
                        <div className="relative w-10 h-10 md:w-12 md:h-12 transition-transform group-hover:scale-105">
                            <Image
                                src="/logo.png"
                                alt="Transportes Medellín Travel"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className={`font-bold text-lg md:text-xl tracking-tight transition-colors ${isScrolled ? 'text-white' : 'text-white'
                            }`}>
                            Transportes Medellín
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        <Link href="/#servicios" className="text-white/90 hover:text-[#D6A75D] transition-colors text-sm font-medium">
                            {t('header.servicios', language)}
                        </Link>
                        <Link href="/#como-funciona" className="text-white/90 hover:text-[#D6A75D] transition-colors text-sm font-medium">
                            {t('header.comoFunciona', language)}
                        </Link>
                        <Link href="/#testimonios" className="text-white/90 hover:text-[#D6A75D] transition-colors text-sm font-medium">
                            {t('header.testimonios', language)}
                        </Link>

                        <div className="h-4 w-px bg-white/20"></div>

                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1 text-white/90 hover:text-[#D6A75D] transition-colors text-sm font-medium"
                        >
                            <FiGlobe size={16} />
                            {language.toUpperCase()}
                        </button>

                        <Link
                            href="/reservas"
                            className="bg-[#D6A75D] hover:bg-[#C5964A] text-black font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
                        >
                            {t('header.reservar', language)}
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden relative z-50 text-white p-2"
                    >
                        {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <div className={`fixed inset-0 bg-black/95 backdrop-blur-md z-30 transition-transform duration-300 md:hidden flex flex-col items-center justify-center gap-8 ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <Link
                    href="/#servicios"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-bold text-white hover:text-[#D6A75D] transition-colors"
                >
                    {t('header.servicios', language)}
                </Link>
                <Link
                    href="/#como-funciona"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-bold text-white hover:text-[#D6A75D] transition-colors"
                >
                    {t('header.comoFunciona', language)}
                </Link>
                <Link
                    href="/#testimonios"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-bold text-white hover:text-[#D6A75D] transition-colors"
                >
                    {t('header.testimonios', language)}
                </Link>

                <div className="w-16 h-px bg-white/20"></div>

                <button
                    onClick={() => { toggleLanguage(); setIsMobileMenuOpen(false); }}
                    className="text-xl font-medium text-white hover:text-[#D6A75D] transition-colors flex items-center gap-2"
                >
                    <FiGlobe /> {language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                </button>

                <Link
                    href="/reservas"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="bg-[#D6A75D] text-black font-bold py-3 px-8 rounded-xl text-xl mt-4"
                >
                    {t('header.reservar', language)}
                </Link>
            </div>

            <AliadoModal
                isOpen={isAliadoModalOpen}
                onClose={() => setIsAliadoModalOpen(false)}
            />
        </>
    );
}
