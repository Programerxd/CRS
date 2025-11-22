import { useStore } from '@nanostores/react';
import { $cart, $isCartOpen, $cartTotal, removeFromCart, decreaseQuantity, addToCart, clearCart } from '../../../store/cartStore';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { processOrder } from '../services/store.service';
import { useState } from 'react';

export default function ShoppingCartDrawer() {
  const isOpen = useStore($isCartOpen);
  const cart = useStore($cart);
  const total = useStore($cartTotal);
  const cartItems = Object.values(cart);
  const [processing, setProcessing] = useState(false);

  const handleCheckout = async () => {
    setProcessing(true);
    
    // Simulamos datos de cliente (En producción tomarías esto del Auth)
    const clientInfo = { name: "Cliente Web", date: new Date() };

    const result = await processOrder(cartItems, clientInfo);

    if (result.success) {
      // Generar pedido de WhatsApp
      const itemsList = cartItems.map(i => `- ${i.quantity}x ${i.name}`).join('%0A');
      const msg = `Hola, quiero finalizar mi pedido web:%0A${itemsList}%0A*Total: $${total}*`;
      
      clearCart();
      $isCartOpen.set(false);
      window.open(`https://wa.me/529971234567?text=${msg}`, '_blank');
      alert("¡Pedido registrado! Se descontó del stock.");
    } else {
      alert("Error: " + result.error); // Probablemente falta de stock
    }
    setProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => $isCartOpen.set(false)}></div>

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-heading font-bold text-xl flex items-center gap-2">
                <ShoppingBag className="text-primary" /> Tu Carrito
            </h2>
            <button onClick={() => $isCartOpen.set(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
                <p className="text-center text-gray-400 mt-10">Tu carrito está vacío.</p>
            ) : (
                cartItems.map(item => (
                    <div key={item.id} className="flex gap-4">
                        <img src={item.imageUrl || "https://via.placeholder.com/80"} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                        <div className="flex-1">
                            <h4 className="font-bold text-dark-900 text-sm line-clamp-2">{item.name}</h4>
                            <p className="text-primary font-bold">${item.price}</p>
                            
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center border border-gray-200 rounded-lg">
                                    <button onClick={() => decreaseQuantity(item.id!)} className="p-1 hover:bg-gray-100"><Minus size={14}/></button>
                                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                                    <button onClick={() => addToCart(item)} className="p-1 hover:bg-gray-100"><Plus size={14}/></button>
                                </div>
                                <button onClick={() => removeFromCart(item.id!)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Checkout */}
        {cartItems.length > 0 && (
            <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-500 text-sm">Total a Pagar</span>
                    <span className="text-2xl font-heading font-bold text-dark-900">${total}</span>
                </div>
                <button 
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold shadow-lg disabled:opacity-70"
                >
                    {processing ? 'Procesando...' : 'Finalizar Compra por WhatsApp'}
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">Al finalizar, se verificará el stock automáticamente.</p>
            </div>
        )}
      </div>
    </div>
  );
}