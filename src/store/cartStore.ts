import { map, atom, computed } from 'nanostores';
import { persistentMap } from '@nanostores/persistent'; // <--- Nuevo
import type { Product } from '../types/db';

export interface CartItem extends Product {
  quantity: number;
}

// 1. CAMBIO CLAVE: Usamos persistentMap en lugar de map simple
// Esto guarda automáticamente en localStorage con la clave 'crs_cart'
// Como persistentMap guarda strings, necesitamos codificar/decodificar JSON automáticamente
export const $cart = persistentMap<Record<string, CartItem>>(
  'crs_cart', 
  {}, 
  {
    encode: JSON.stringify,
    decode: JSON.parse
  }
);

export const $isCartOpen = atom<boolean>(false);

// --- ACCIONES (Ligeros ajustes para persistentMap) ---

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
  // persistentMap tiene setKey para borrar si pasas undefined, pero para borrar del objeto:
  const cart = { ...$cart.get() };
  delete cart[productId];
  $cart.set(cart);
}

export function decreaseQuantity(productId: string) {
  const cart = $cart.get();
  const item = cart[productId];
  if (item && item.quantity > 1) {
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