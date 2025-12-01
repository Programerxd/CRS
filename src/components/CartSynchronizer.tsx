import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/client';
import { $cart } from '../store/cartStore'; // Ya no importamos clearCart aquí
import { getCartFromCloud, saveCartToCloud } from '../modules/store/services/store.service';

export default function CartSynchronizer() {
  const cart = useStore($cart);

  // 1. ESCUCHAR CAMBIOS DE SESIÓN (Solo Login)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- USUARIO INICIÓ SESIÓN (FUSIÓN) ---
            console.log("Sincronizando carrito de:", user.email);
            
            // A. Traer carrito de la nube
            const cloudCart = await getCartFromCloud(user.uid);
            
            // B. Fusionar con el carrito local actual 
            // (Prioridad: Lo que acaba de agregar localmente sobreescribe lo viejo de la nube si hay conflicto, o viceversa según prefieras)
            const localCart = $cart.get();
            
            // Estrategia de fusión: Sumar cantidades o mantener la local. 
            // Para simplicidad empresarial: Fusionamos objetos.
            const mergedCart = { ...cloudCart, ...localCart };
            
            // C. Actualizar ambos
            $cart.set(mergedCart);
            await saveCartToCloud(user.uid, mergedCart);
        } 
        // ELIMINAMOS EL ELSE. 
        // Si es guest (user es null), NO HACEMOS NADA. Dejamos que el persistentMap mantenga los datos.
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHAR CAMBIOS EN EL CARRITO (Para guardar en tiempo real si es usuario)
  useEffect(() => {
    const user = auth.currentUser;
    // Solo guardamos en nube si hay usuario autenticado
    if (user && Object.keys(cart).length > 0) {
        const timeout = setTimeout(() => {
            saveCartToCloud(user.uid, cart);
        }, 1000);
        return () => clearTimeout(timeout);
    }
  }, [cart]);

  return null;
}