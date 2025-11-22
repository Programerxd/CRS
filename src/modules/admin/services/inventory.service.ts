import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy 
} from "firebase/firestore";
import { db } from "../../../firebase/client";
// IMPORTAMOS EL TIPO GLOBAL (En lugar de definirlo aquí)
import type { Product } from "../../../types/db";

const COLLECTION_NAME = "inventory";

// Exportamos el tipo para que InventoryPage lo pueda usar, pero viene del global
export type { Product }; 

// --- CREAR PRODUCTO ---
export const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...product,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error agregando producto:", error);
    return { success: false, error };
  }
};

// --- OBTENER TODOS LOS PRODUCTOS ---
export const getInventory = async () => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("name"));
    const snapshot = await getDocs(q);
    // Forzamos el tipado aquí para que TypeScript sepa que estos datos son Product
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  } catch (error) {
    console.error("Error obteniendo inventario:", error);
    return [];
  }
};

// --- BORRAR PRODUCTO ---
export const deleteProduct = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
}