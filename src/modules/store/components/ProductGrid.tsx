import { useState, useEffect } from 'react';
import { ShoppingCart, MessageCircle } from 'lucide-react';
import { getProductsForSale } from '../services/store.service';
import { addToCart } from '../../../store/cartStore';
import type { Product } from '../../../types/db';

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getProductsForSale();
      setProducts(data);
      setLoading(false);
    }
    load();
  }, []);

  // Función para pedir directo por WhatsApp (Como en tus capturas)
  const handleWhatsAppOrder = (product: Product) => {
    const msg = `Hola Cuervo Rosa, me interesa ordenar: ${product.name} (Precio: $${product.price}).`;
    window.open(`https://wa.me/529971234567?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (loading) return <div className="text-center py-20">Cargando productos...</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
          
          {/* Imagen */}
          <div className="h-48 overflow-hidden bg-gray-50 relative">
            {product.currentStock === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold z-10">AGOTADO</div>
            )}
            <img 
              src={product.imageUrl || "https://via.placeholder.com/300"} 
              alt={product.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Info */}
          <div className="p-6 flex flex-col flex-1">
            <h3 className="font-heading font-bold text-dark-900 text-lg mb-2 line-clamp-2">{product.name}</h3>
            <p className="text-xs text-gray-500 mb-4 flex-1">Producto profesional certificado.</p>
            
            {/* Precio y Botones */}
            <div className="mt-auto">
                <div className="flex items-end gap-1 mb-4">
                    <span className="text-2xl font-bold text-dark-900">${product.price}</span>
                    <span className="text-xs text-gray-400 mb-1">MXN</span>
                </div>

                <div className="flex gap-2">
                    {/* Botón WhatsApp (Ordenar rápido) */}
                    <button 
                        onClick={() => handleWhatsAppOrder(product)}
                        disabled={product.currentStock === 0}
                        className="flex-1 bg-primary hover:bg-primary-hover text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <MessageCircle size={18} /> Ordenar
                    </button>

                    {/* Botón Carrito (Icono) */}
                    <button 
                        onClick={() => addToCart(product)}
                        disabled={product.currentStock === 0}
                        className="p-2.5 border-2 border-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-colors disabled:opacity-50"
                    >
                        <ShoppingCart size={20} />
                    </button>
                </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}