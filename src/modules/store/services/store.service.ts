import { collection, query, where, getDocs, runTransaction, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/client";
import type { Product } from "../../../types/db";
import type { CartItem } from "../../../store/cartStore";
import { setDoc , getDoc} from "firebase/firestore";

// 1. OBTENER PRODUCTOS (Solo los de categoría 'venta')
export const getProductsForSale = async () => {
  try {
    const q = query(collection(db, "inventory"), where("category", "==", "venta"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error cargando productos:", error);
    return [];
  }
};

// 2. PROCESAR COMPRA (Descontar Stock + Guardar Pedido)
export const processOrder = async (cartItems: CartItem[], clientInfo: any) => {
  try {
    await runTransaction(db, async (transaction) => {
      
      // A. Verificar Stock de cada ítem en tiempo real
      for (const item of cartItems) {
        const productRef = doc(db, "inventory", item.id!);
        const sfDoc = await transaction.get(productRef);
        
        if (!sfDoc.exists()) throw "Producto no encontrado";
        
        const currentStock = sfDoc.data().currentStock;
        if (currentStock < item.quantity) {
          throw `Stock insuficiente para ${item.name}`;
        }

        // B. Descontar Stock
        transaction.update(productRef, { currentStock: currentStock - item.quantity });
      }

      // C. Crear Registro de Venta (Para el Admin)
      const orderRef = doc(collection(db, "sales"));
      transaction.set(orderRef, {
        client: clientInfo,
        items: cartItems,
        total: cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0),
        date: serverTimestamp(),
        status: 'pagado' // Aquí conectarías Stripe en el futuro
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error en transacción:", error);
    return { success: false, error };
  }
};

export const saveCartToCloud = async (userId: string, cartItems: Record<string, CartItem>) => {
    if (!userId) return;
    try {
        // Al enviar cartItems vacío {}, esto limpiará la lista en Firestore.
        await setDoc(doc(db, "users", userId, "cart", "active"), { 
            items: cartItems,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error("Error guardando carrito en nube:", error);
    }
};

// 2. Recuperar Carrito de la Nube
export const getCartFromCloud = async (userId: string) => {
    if (!userId) return {};
    try {
        const snap = await getDoc(doc(db, "users", userId, "cart", "active"));
        if (snap.exists()) {
            return snap.data().items as Record<string, CartItem>;
        }
    } catch (error) {
        console.error("Error recuperando carrito:", error);
    }
    return {};
};

