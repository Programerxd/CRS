// 1. Importamos 'atom' además de map y computed
import { map, atom, computed } from 'nanostores';
import type { Product } from '../types/db';

export interface CartItem extends Product {
  quantity: number;
}

// EL CARRITO (Es un objeto complejo, usa map)
export const $cart = map<Record<string, CartItem>>({});

// VISIBILIDAD DEL CARRITO (Es true/false, usa atom) -> CORRECCIÓN AQUÍ
export const $isCartOpen = atom<boolean>(false);

// --- ACCIONES ---

export function addToCart(product: Product) {
  const cart = $cart.get();
  const existingItem = cart[product.id!];

  if (existingItem) {
    if (existingItem.quantity < product.currentStock) {
      $cart.setKey(product.id!, { ...existingItem, quantity: existingItem.quantity + 1 });
    } else {
      alert("¡No hay más stock disponible!");
    }
  } else {
    $cart.setKey(product.id!, { ...product, quantity: 1 });
  }
  $isCartOpen.set(true); 
}

export function removeFromCart(productId: string) {
  const cart = $cart.get();
  const { [productId]: _, ...rest } = cart;
  $cart.set(rest);
}

export function decreaseQuantity(productId: string) {
  const cart = $cart.get();
  const item = cart[productId];
  if (item.quantity > 1) {
    $cart.setKey(productId, { ...item, quantity: item.quantity - 1 });
  } else {
    removeFromCart(productId);
  }
}

export function clearCart() {
  $cart.set({});
}

// --- CALCULADOS ---
export const $cartTotal = computed($cart, cart => 
  Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0)
);

export const $cartCount = computed($cart, cart => 
  Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
);