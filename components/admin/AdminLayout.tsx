'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
    FiHome,
    FiCalendar,
    FiBarChart2,
    FiDatabase,
    FiPackage,
    FiUsers,
    FiUser,
    FiTruck,
    FiLogOut,
    FiMenu,
    FiX,
    FiStar,
    FiMapPin,
    FiDollarSign,
    FiCreditCard
} from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [pathname, isMobile]);

    const navigation = [
        { name: 'Reservas', href: '/admin/dashboard', icon: FiHome },
        { name: 'Reservas BOLD', href: '/admin/dashboard?payment=VOLT', icon: FiCreditCard },
        { name: 'Reservas EFECTIVO', href: '/admin/dashboard?payment=EFECTIVO', icon: FiDollarSign },
        { name: 'Tour Compartido', href: '/admin/dashboard/tour-compartido', icon: FiMapPin },
        { name: 'Calendario', href: '/admin/dashboard/calendario', icon: FiCalendar },
        { name: 'Crear Cotización', href: '/admin/dashboard/cotizaciones/crear', icon: FiDollarSign },
        { name: 'Estadísticas', href: '/admin/dashboard/estadisticas', icon: FiBarChart2 },
        { name: 'Calificaciones', href: '/admin/dashboard/calificaciones', icon: FiStar },
        { name: 'Base de Datos', href: '/admin/dashboard/base-datos', icon: FiDatabase },
    ];

    const resources = [
        { name: 'Servicios', href: '/admin/dashboard/servicios', icon: FiPackage },
        { name: 'Transporte Municipal', href: '/admin/dashboard/servicios/transporte-municipal', icon: FiMapPin },
        { name: 'Aliados', href: '/admin/dashboard/aliados', icon: FiUsers },
        { name: 'Conductores', href: '/admin/dashboard/conductores', icon: FiUser },
        { name: 'Vehículos', href: '/admin/dashboard/vehiculos', icon: FiTruck },
    ];

    const isActive = (href: string) => {
        const [path, query] = href.split('?');
        if (pathname !== path) return false;
        if (!query) return !searchParams.get('payment');
        const [key, value] = query.split('=');
        return searchParams.get(key) === value;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed top-0 left-0 h-screen bg-[#0A0A0A] text-white z-50 flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${isMobile ? 'w-64' : (sidebarOpen ? 'w-64' : 'w-20')}
                    ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
            >
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-gray-800">
                    {(sidebarOpen || isMobile) && (
                        <div>
                            <h1 className="text-xl font-bold text-[#D6A75D]">Admin</h1>
                            <p className="text-xs text-gray-400">Transportes Medellín</p>
                        </div>
                    )}
                    {!isMobile && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                    {/* Main Navigation */}
                    <div>
                        {(sidebarOpen || isMobile) && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                                Principal
                            </p>
                        )}
                        <div className="space-y-1">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active
                                            ? 'bg-[#D6A75D] text-black font-semibold'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        title={!sidebarOpen && !isMobile ? item.name : undefined}
                                    >
                                        <Icon size={20} className="flex-shrink-0" />
                                        {(sidebarOpen || isMobile) && <span>{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resources */}
                    <div>
                        {(sidebarOpen || isMobile) && (
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                                Recursos
                            </p>
                        )}
                        <div className="space-y-1">
                            {resources.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active
                                            ? 'bg-[#D6A75D] text-black font-semibold'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                            }`}
                                        title={!sidebarOpen && !isMobile ? item.name : undefined}
                                    >
                                        <Icon size={20} className="flex-shrink-0" />
                                        {(sidebarOpen || isMobile) && <span>{item.name}</span>}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={() => signOut({ callbackUrl: '/admin/login' })}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-900/20 hover:text-red-400 transition-all w-full"
                    >
                        <FiLogOut size={20} className="flex-shrink-0" />
                        {(sidebarOpen || isMobile) && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`
                transition-all duration-300
                ${isMobile ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-20')}
            `}>
                {children}
            </main>

            {/* Mobile Menu Button - Fixed at top */}
            {isMobile && !sidebarOpen && (
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="fixed top-4 left-4 z-[60] p-3 bg-[#0A0A0A] text-white rounded-lg shadow-lg lg:hidden hover:bg-gray-800 transition-colors"
                    aria-label="Abrir menú"
                >
                    <FiMenu size={24} />
                </button>
            )}
        </div>
    );
}
