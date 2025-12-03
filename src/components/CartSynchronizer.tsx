import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/client';
import { $cart } from '../store/cartStore'; 
import { getCartFromCloud, saveCartToCloud } from '../modules/store/services/store.service';

export default function CartSynchronizer() {
  const cart = useStore($cart);
  // CORRECCIÓN: Nombre de variable correcto y tipado automático
  const [isSyncComplete, setIsSyncComplete] = useState(false);

  // 1. ESCUCHAR INICIO DE SESIÓN (Sincronización Inicial)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log(" Usuario detectado. Iniciando fusión de carritos...");
            
            try {
                // A. Traer carrito guardado en la nube
                const cloudCart = await getCartFromCloud(user.uid);
                
                // B. Obtener carrito local actual
                const localCart = $cart.get();
                
                // C. Fusionar: Lo local prevalece sobre lo viejo de la nube en caso de conflicto
                // (O puedes sumar cantidades si prefieres una lógica más compleja)
                const mergedCart = { ...cloudCart, ...localCart };
                
                // D. Actualizar estado local y nube
                $cart.set(mergedCart);
                await saveCartToCloud(user.uid, mergedCart);
                
            } catch (error) {
                console.error("Error en sincronización inicial:", error);
            } finally {
                // E. IMPORTANTE: Marcar que ya terminamos de cargar
                // Esto habilita el "escucha" en tiempo real del useEffect de abajo
                setIsSyncComplete(true); 
            }
        } else {
            // Si no hay usuario, apagamos la bandera de sincronización
            setIsSyncComplete(false);
        }
    });
    return () => unsubscribe();
  }, []);

  // 2. ESCUCHAR CAMBIOS EN EL CARRITO (Tiempo Real)
  useEffect(() => {
    const user = auth.currentUser;

    // LÓGICA EMPRESARIAL CORREGIDA:
    // Solo guardamos si hay un usuario Y si la carga inicial ya terminó.
    if (user && isSyncComplete) {
        
        const timeout = setTimeout(() => {
            // CAMBIO CLAVE: Quitamos la condición "if (Object.keys(cart).length > 0)"
            // Ahora, incluso si 'cart' está vacío {}, se enviará a Firebase.
            // Esto asegura que si borras el último producto, se borre también en la nube.
            saveCartToCloud(user.uid, cart);
        }, 500); // Debounce de 500ms para no saturar la base de datos

        return () => clearTimeout(timeout);
    }
  }, [cart, isSyncComplete]); // Dependencias correctas

  return null;
}