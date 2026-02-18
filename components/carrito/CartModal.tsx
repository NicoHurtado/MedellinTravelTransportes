'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartItem {
    id: string;
    servicioId: string;
    servicioNombre: string;
    servicioImagen?: string;
    fecha: string;
    hora: string;
    numeroPasajeros: number;
    nombreCliente: string;
    whatsappCliente: string;
    emailCliente: string;
    precioBase: number;
    precioAdicionales: number;
    recargoNocturno: number;
    tarifaMunicipio: number;
    descuentoAliado: number;
    precioTotal: number;
    municipio: string;
    // ... otros campos del formulario
    [key: string]: any;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartModal = ({ isOpen, onClose }: CartModalProps) => {
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'BOLD' | 'EFECTIVO'>('BOLD');

    useEffect(() => {
        if (isOpen) {
            loadCart();
        }
    }, [isOpen]);

    const loadCart = () => {
        try {
            const cart = localStorage.getItem('medellin-travel-cart');
            if (cart) {
                const items = JSON.parse(cart);
                const normalizedItems = Array.isArray(items) ? items : [];
                setCartItems(normalizedItems);
                const firstItemMethod = normalizedItems[0]?.metodoPago;
                if (firstItemMethod === 'EFECTIVO' || firstItemMethod === 'BOLD') {
                    setSelectedPaymentMethod(firstItemMethod);
                }
            } else {
                setCartItems([]);
                setSelectedPaymentMethod('BOLD');
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
            setSelectedPaymentMethod('BOLD');
        }
    };

    const removeItem = (itemId: string) => {
        const updatedCart = cartItems.filter(item => item.id !== itemId);
        setCartItems(updatedCart);
        localStorage.setItem('medellin-travel-cart', JSON.stringify(updatedCart));

        // Disparar evento para actualizar el contador
        window.dispatchEvent(new Event('cartUpdated'));
    };

    const clearCart = () => {
        if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
            setCartItems([]);
            localStorage.removeItem('medellin-travel-cart');
            window.dispatchEvent(new Event('cartUpdated'));
        }
    };

    const isCashPayment = selectedPaymentMethod === 'EFECTIVO';

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + item.precioTotal, 0);
    };

    const calculateCommission = () => {
        if (isCashPayment) return 0;
        const subtotal = calculateSubtotal();
        return Math.round(subtotal * 0.06);
    };

    const calculateTotal = () => {
        return calculateSubtotal() + calculateCommission();
    };

    const proceedToCheckout = async () => {
        if (cartItems.length === 0) {
            alert('El carrito está vacío');
            return;
        }

        setIsProcessing(true);

        try {
            // Crear el pedido
            const response = await fetch('/api/pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cartItems,
                    idioma: cartItems[0]?.idioma || 'ES',
                    metodoPago: selectedPaymentMethod,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear el pedido');
            }

            const { data: pedido } = await response.json();

            // Limpiar el carrito
            localStorage.removeItem('medellin-travel-cart');
            window.dispatchEvent(new Event('cartUpdated'));

            // Redirigir a la página de tracking del pedido
            router.refresh();
            router.push(`/tracking/${pedido.codigo}`);
        } catch (error) {
            console.error('Error creating pedido:', error);
            alert(error instanceof Error ? error.message : 'Error al procesar el pedido');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6" />
                        Carrito de Compras
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {cartItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                            <p className="text-lg font-medium">Tu carrito está vacío</p>
                            <p className="text-sm mt-2">Agrega servicios para comenzar</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cartItems.map((item) => {
                                // Helper logic to determine route details
                                const getRouteDetails = () => {
                                    // Airport logic
                                    if (item.aeropuertoTipo) {
                                        const airport = item.aeropuertoNombre?.replace(/_/g, ' ') || 'Aeropuerto';
                                        const place = item.lugarRecogida || 'Medellín';

                                        if (item.aeropuertoTipo === 'DESDE' || item.aeropuertoTipo === 'LLEGADA') {
                                            return { from: 'Aeropuerto ' + airport, to: place };
                                        } else {
                                            return { from: place, to: 'Aeropuerto ' + airport };
                                        }
                                    }

                                    // Transfer logic
                                    if (item.trasladoTipo) {
                                        const muni = item.municipio === 'OTRO' ? (item.otroMunicipio || 'Municipio') : item.municipio;
                                        if (item.trasladoTipo === 'DESDE_UBICACION') {
                                            return {
                                                from: item.lugarRecogida || 'Mi Ubicación',
                                                to: item.trasladoDestino || muni
                                            };
                                        } else if (item.trasladoTipo === 'DESDE_MUNICIPIO') {
                                            return {
                                                from: item.lugarRecogida || muni,
                                                to: item.trasladoDestino || 'Mi Ubicación'
                                            };
                                        }
                                    }

                                    // Default (Tours, etc)
                                    const destination = item.trasladoDestino || (item.municipio !== 'OTRO' ? item.municipio : item.otroMunicipio);
                                    return {
                                        from: item.lugarRecogida,
                                        to: destination
                                    };
                                };

                                const route = getRouteDetails();

                                return (
                                    <div
                                        key={item.id}
                                        className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 leading-tight mb-2">
                                                    {item.servicioNombre}
                                                </h3>

                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        📅 {new Date(item.fecha).toLocaleDateString('es-CO')} - {item.hora}
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                                        👥 {item.numeroPasajeros} pasajero{item.numeroPasajeros > 1 ? 's' : ''}
                                                    </p>

                                                    {/* Route Details */}
                                                    {(route.from || route.to) && (
                                                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                                                            {route.from && (
                                                                <p className="flex items-start gap-1">
                                                                    <span className="font-medium text-gray-700">De:</span>
                                                                    <span className="truncate flex-1">{route.from}</span>
                                                                </p>
                                                            )}
                                                            {route.to && (
                                                                <p className="flex items-start gap-1">
                                                                    <span className="font-medium text-gray-700">A:</span>
                                                                    <span className="truncate flex-1">{route.to}</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!route.from && !route.to && item.municipio && (
                                                        <p className="text-sm text-gray-600">
                                                            📍 {item.municipio}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors ml-2"
                                                title="Eliminar del carrito"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                            <span className="text-sm text-gray-600">Precio:</span>
                                            <span className="font-bold text-[#D6A75D]">
                                                ${item.precioTotal.toLocaleString('es-CO')} COP
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer - Summary and Actions */}
                {cartItems.length > 0 && (
                    <div className="border-t p-4 bg-gray-50">
                        {/* Payment Method */}
                        <div className="mb-4 bg-white border border-gray-200 rounded-lg p-3 space-y-2">
                            <p className="text-sm font-semibold text-gray-800">Método de pago</p>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod('EFECTIVO')}
                                    className={`text-left px-3 py-2 rounded-md border transition-colors ${
                                        selectedPaymentMethod === 'EFECTIVO'
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-green-300'
                                    }`}
                                >
                                    <span className="font-medium text-green-700">Efectivo</span>
                                    <p className="text-xs text-gray-600">Pago exacto al momento del servicio</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod('BOLD')}
                                    className={`text-left px-3 py-2 rounded-md border transition-colors ${
                                        selectedPaymentMethod === 'BOLD'
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <span className="font-medium text-blue-700">Tarjeta (BOLD)</span>
                                    <p className="text-xs text-gray-600">Incluye 6% adicional por pago con tarjeta</p>
                                </button>
                            </div>
                        </div>

                        {/* Price Summary */}
                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-medium">
                                    ${calculateSubtotal().toLocaleString('es-CO')} COP
                                </span>
                            </div>
                            {!isCashPayment && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">+ 6% Impuestos del pago:</span>
                                    <span className="font-medium text-orange-600">
                                        ${calculateCommission().toLocaleString('es-CO')} COP
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total:</span>
                                <span className="text-[#D6A75D]">
                                    ${calculateTotal().toLocaleString('es-CO')} COP
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                            <button
                                onClick={proceedToCheckout}
                                disabled={isProcessing}
                                className="w-full bg-[#D6A75D] text-white py-3 rounded-lg font-semibold hover:bg-[#c49850] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Procesando...' : (isCashPayment ? 'Confirmar pedido en efectivo' : 'Proceder al pago con tarjeta')}
                            </button>
                            <button
                                onClick={clearCart}
                                disabled={isProcessing}
                                className="w-full bg-white text-gray-700 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Vaciar Carrito
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
