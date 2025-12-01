import { useStore } from '@nanostores/react';
import { $cartCount, $isCartOpen } from '../store/cartStore';
import { ShoppingBag } from 'lucide-react';

export default function CartTrigger() {
  const count = useStore($cartCount);

  return (
    <button 
      onClick={() => $isCartOpen.set(true)}
      className="relative p-2 text-dark-600 hover:text-primary transition-colors"
    >
      <ShoppingBag size={24} />
      {count > 0 && (
        <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white">
          {count}
        </span>
      )}
    </button>
  );
}