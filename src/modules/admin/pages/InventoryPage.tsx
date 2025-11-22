import { useState, useEffect } from 'react';
import { Plus, Search, Package, Trash2, Edit, Filter, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { getInventory, addProduct, deleteProduct, type Product } from '../services/inventory.service';
import { uploadImage } from '../services/upload.service'; // Usamos el mismo servicio del CMS

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false); // Estado de carga de imagen
  
  // ESTADO DEL FORMULARIO (Usamos strings para los números para evitar el problema del "0")
  const [form, setForm] = useState({
    name: '',
    category: 'venta',
    sku: '',
    price: '',        // String vacío inicial
    currentStock: '', // String vacío inicial
    minStock: '5',
    unit: 'pza',
    description: ''   // Nuevo campo
  });

  const [imageFile, setImageFile] = useState<File | null>(null); // Archivo de imagen

  // Cargar datos
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getInventory();
    setProducts(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalUrl = '';

    // 1. Subir Imagen si existe
    if (imageFile) {
        const url = await uploadImage(imageFile, 'inventory'); // Guardar en carpeta 'inventory'
        if (url) finalUrl = url;
    }

    // 2. Convertir strings a números y guardar
    // @ts-ignore 
    await addProduct({
        name: form.name,
        category: form.category as any,
        sku: form.sku,
        unit: form.unit,
        description: form.description,
        imageUrl: finalUrl,
        // Conversión numérica segura
        price: Number(form.price) || 0,
        currentStock: Number(form.currentStock) || 0,
        minStock: Number(form.minStock) || 0,
    });

    setUploading(false);
    setIsModalOpen(false);
    
    // Resetear formulario
    setForm({ name: '', category: 'venta', sku: '', price: '', currentStock: '', minStock: '5', unit: 'pza', description: '' });
    setImageFile(null);
    
    await loadData();
  };

  const handleDelete = async (id: string) => {
      if(confirm('¿Estás seguro de borrar este producto?')) {
          await deleteProduct(id);
          loadData();
      }
  }

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Inventario General</h2>
          <p className="text-dark-600 text-sm">Gestiona insumos y productos de venta.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-bold shadow-lg transition-all"
        >
          <Plus size={20} /> Nuevo Producto
        </button>
      </div>

      {/* TABLA (Visualización mejorada con imagen) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Producto</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase">SKU</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Stock</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Precio</th>
                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Miniatura de imagen */}
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {item.imageUrl ? (
                            <img src={item.imageUrl} className="w-full h-full object-cover"/>
                        ) : (
                            <Package size={20} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-dark-900 text-sm">{item.name}</p>
                        <p className="text-[10px] text-gray-400 max-w-[150px] truncate">{item.description || item.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.category === 'venta' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                        {item.category}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-500">{item.sku}</td>
                  <td className="p-4 text-right">
                    <span className={`font-bold text-sm ${item.currentStock <= item.minStock ? 'text-red-500' : 'text-dark-900'}`}>
                        {item.currentStock}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-dark-600 text-sm">${item.price}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button onClick={() => item.id && handleDelete(item.id!)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      {/* --- MODAL DE CREACIÓN (DISEÑO EMPRESARIAL) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-secondary-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-300">
            <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-white/20 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header del Modal */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-2xl font-heading font-bold text-dark-900">Nuevo Producto</h3>
                        <p className="text-sm text-gray-500 mt-1">Ingresa los detalles para el control de inventario.</p>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                </div>
                
                {/* Cuerpo Scrollable */}
                <div className="overflow-y-auto p-8">
                    <form onSubmit={handleSave} className="space-y-8">
                        
                        {/* Sección 1: Información Básica */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Información General</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark-900">Nombre del Producto</label>
                                    <input 
                                        required 
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium" 
                                        placeholder="Ej. Tinta Negra Dinámica"
                                        value={form.name} 
                                        onChange={e => setForm({...form, name: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark-900">SKU (Código Único)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3.5 text-gray-400 font-mono text-sm">#</span>
                                        <input 
                                            required 
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono text-sm" 
                                            placeholder="INK-001"
                                            value={form.sku} 
                                            onChange={e => setForm({...form, sku: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-dark-900">Descripción</label>
                                <textarea 
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none h-24"
                                    placeholder="Detalles técnicos, marca, presentación..."
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Sección 2: Clasificación y Precio */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Ventas y Categoría</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark-900">Categoría</label>
                                    <div className="relative">
                                        <select 
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer" 
                                            value={form.category} 
                                            onChange={e => setForm({...form, category: e.target.value as any})}
                                        >
                                            <option value="venta">🛍️ Venta al Público</option>
                                            <option value="insumo">📦 Insumo Interno</option>
                                        </select>
                                        <div className="absolute right-4 top-4 pointer-events-none text-gray-400">▼</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-dark-900">Precio Unitario</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-3 text-gray-500 font-bold">$</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-lg" 
                                            value={form.price} 
                                            onChange={e => setForm({...form, price: e.target.value})} 
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Control de Stock */}
                        <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Stock Inicial</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                                        value={form.currentStock} 
                                        onChange={e => setForm({...form, currentStock: e.target.value})} 
                                        placeholder="0" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                        Alerta Mínima 
                                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Aviso</span>
                                    </label>
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" 
                                        value={form.minStock} 
                                        onChange={e => setForm({...form, minStock: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección 4: Imagen */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-dark-900">Imagen del Producto</label>
                            <div 
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer relative group
                                ${imageFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-primary/5'}`}
                            >
                                <input 
                                    type="file" accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                                <div className="flex flex-col items-center justify-center pointer-events-none">
                                    {imageFile ? (
                                        <>
                                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                            </div>
                                            <span className="text-sm font-bold text-green-700 truncate max-w-[200px]">{imageFile.name}</span>
                                            <span className="text-xs text-green-600 mt-1">Listo para subir</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-gray-100 text-gray-400 group-hover:text-primary group-hover:bg-white rounded-full flex items-center justify-center mb-3 transition-colors">
                                                <ImageIcon size={24} />
                                            </div>
                                            <span className="text-sm font-bold text-dark-900 group-hover:text-primary transition-colors">
                                                Haz clic o arrastra una imagen aquí
                                            </span>
                                            <span className="text-xs text-gray-400 mt-1">JPG, PNG (Máx 5MB)</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer / Acciones */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors text-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} // Movemos el submit aquí para que esté fuera del scroll
                        disabled={uploading}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                        {uploading ? <><Loader2 size={18} className="animate-spin"/> Guardando...</> : "Guardar Producto"}
                    </button>
                </div>

            </div>
        </div>
      )}
    </div>
  );
}