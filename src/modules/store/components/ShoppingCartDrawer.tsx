import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { $cart, $isCartOpen, $cartTotal, removeFromCart, decreaseQuantity, addToCart, clearCart } from '../../../store/cartStore';
import { X, Plus, Minus, Trash2, ShoppingBag, Loader2 } from 'lucide-react';
import { processOrder } from '../services/store.service';
import { auth } from '../../../firebase/client'; // Importar auth para saber quién compra

export default function ShoppingCartDrawer() {
  const isOpen = useStore($isCartOpen);
  const cart = useStore($cart);
  const total = useStore($cartTotal);
  const cartItems = Object.values(cart);
  
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Configuración inicial de PayPal
  const paypalOptions = {
    "clientId": "AQjDDDQr8qY4GHW0gppyVbXZwjcZnHBpWHGjZmDye-g5fwwu_nqR1VTq8vgCDwd--AUTPvqWrYgQHceb", // <--- IMPORTANTE: Pon tu ID de prueba (Sandbox) o Producción aquí
    currency: "MXN",
    intent: "capture"
  };

  const handleApprove = async (data: any, actions: any) => {
    setProcessing(true);
    
    // 1. Capturar el dinero
    const order = await actions.order.capture();
    
    if (order.status === 'COMPLETED') {
        // 2. Si PayPal dice OK, descontamos inventario y guardamos en Firebase
        const currentUser = auth.currentUser;
        
        const clientInfo = {
            name: currentUser?.displayName || order.payer.name.given_name,
            email: currentUser?.email || order.payer.email_address,
            paypalOrderId: order.id
        };

        const result = await processOrder(cartItems, clientInfo);

        if (result.success) {
            clearCart();
            setSuccessMsg(true);
            setTimeout(() => {
                setSuccessMsg(false);
                $isCartOpen.set(false);
            }, 3000);
        } else {
            alert("Pago exitoso, pero hubo un error guardando el pedido: " + result.error);
        }
    }
    setProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => $isCartOpen.set(false)}></div>

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="font-heading font-bold text-xl flex items-center gap-2 text-dark-900">
                <ShoppingBag className="text-primary" /> Tu Carrito
            </h2>
            <button onClick={() => $isCartOpen.set(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20}/></button>
        </div>

        {/* Success Message */}
        {successMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={40} />
                </div>
                <h3 className="text-2xl font-bold text-dark-900">¡Compra Exitosa!</h3>
                <p className="text-gray-500">Gracias por tu compra. Hemos enviado la confirmación a tu correo.</p>
            </div>
        ) : (
            <>
                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cartItems.length === 0 ? (
                        <div className="text-center text-gray-400 mt-20 flex flex-col items-center">
                            <ShoppingBag size={48} className="opacity-20 mb-4"/>
                            <p>Tu carrito está vacío.</p>
                            <button onClick={() => $isCartOpen.set(false)} className="mt-4 text-primary font-bold text-sm hover:underline">Ir a comprar productos</button>
                        </div>
                    ) : (
                        cartItems.map(item => (
                            <div key={item.id} className="flex gap-4">
                                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                    <img src={item.imageUrl || "https://via.placeholder.com/80"} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-dark-900 text-sm line-clamp-2">{item.name}</h4>
                                        <button onClick={() => removeFromCart(item.id!)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <p className="text-primary font-bold text-lg mt-1">${item.price}</p>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                                            <button onClick={() => decreaseQuantity(item.id!)} className="p-1.5 hover:bg-white rounded-l-lg transition-colors"><Minus size={14}/></button>
                                            <span className="px-3 text-xs font-bold text-dark-900">{item.quantity}</span>
                                            <button onClick={() => addToCart(item)} className="p-1.5 hover:bg-white rounded-r-lg transition-colors"><Plus size={14}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer & Checkout */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50">
                        <div className="flex justify-between items-end mb-6">
                            <span className="text-gray-500 font-medium">Total a Pagar</span>
                            <span className="text-3xl font-heading font-bold text-dark-900">${total}</span>
                        </div>
                        
                        {/* BOTONES DE PAYPAL */}
                        <div className="relative z-0">
                            {processing && (
                                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm rounded-lg">
                                    <Loader2 className="animate-spin text-primary" />
                                    <span className="ml-2 text-sm font-bold text-dark-900">Procesando pago...</span>
                                </div>
                            )}
                            
                            <PayPalScriptProvider options={paypalOptions}>
                                <PayPalButtons 
                                    style={{ layout: "vertical", shape: "rect", borderRadius: 12 }} 
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            intent: "CAPTURE",
                                            purchase_units: [{
                                                description: "Compra en Cuervo Rosa Studio",
                                                amount: {
                                                    currency_code: "MXN",
                                                    value: total.toString()
                                                }
                                            }]
                                        });
                                    }}
                                    onApprove={handleApprove}
                                    onError={(err) => {
                                        console.error("Error PayPal:", err);
                                        alert("Hubo un error con el pago. Intenta de nuevo.");
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                        
                        <p className="text-[10px] text-center text-gray-400 mt-4">
                            Pagos seguros encriptados por PayPal. El stock se reservará al confirmar.
                        </p>
                    </div>
                )}
            </>
        )}
      </div>
    </div>
  );
}