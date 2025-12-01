import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/client';
import { $cart, clearCart } from '../store/cartStore';
import { getCartFromCloud, saveCartToCloud } from '../modules/store/services/store.service';

export default function CartSynchronizer() {
  const cart = useStore($cart);

  // 1. ESCUCHAR CAMBIOS DE SESIÓN (Login / Logout)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- USUARIO INICIÓ SESIÓN ---
            console.log("Sincronizando carrito de:", user.email);
            
            // A. Traer carrito de la nube
            const cloudCart = await getCartFromCloud(user.uid);
            
            // B. Fusionar con el carrito local actual (si el usuario agregó cosas antes de loguearse)
            const localCart = $cart.get();
            const mergedCart = { ...cloudCart, ...localCart };
            
            // C. Actualizar ambos (Local y Nube) con la fusión
            $cart.set(mergedCart);
            await saveCartToCloud(user.uid, mergedCart);

        } else {
            // --- USUARIO CERRÓ SESIÓN ---
            // Regla de seguridad: Limpiar carrito local para no dejar rastros en el PC
            clearCart();
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHAR CAMBIOS EN EL CARRITO (Para guardar en tiempo real)
  useEffect(() => {
    const user = auth.currentUser;
    // Si hay usuario logueado y el carrito cambió, guardamos en la nube
    if (user && Object.keys(cart).length > 0) {
        // Usamos un pequeño timeout (debounce) para no saturar Firebase si el usuario clica muy rápido
        const timeout = setTimeout(() => {
            saveCartToCloud(user.uid, cart);
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [cart]); // Se ejecuta cada vez que cambia el carrito

  return null; // Este componente no renderiza nada visual
}