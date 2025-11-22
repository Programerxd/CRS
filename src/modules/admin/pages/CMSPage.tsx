import { useState, useEffect } from 'react';
import { Users, Image as ImageIcon, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { getArtists, addArtist, deleteArtist, getPortfolio, addPortfolioItem, deletePortfolioItem, type Artist, type PortfolioItem } from '../services/cms.service';
import { uploadImage } from '../services/upload.service'; // <--- IMPORTAMOS EL SERVICIO

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState<'artistas' | 'portafolio'>('artistas');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // Estado de carga para la imagen
  
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  // Estados del Formulario
  const [newArtist, setNewArtist] = useState<Artist>({ name: '', specialty: '', bio: '', photoUrl: '', active: true });
  const [artistFile, setArtistFile] = useState<File | null>(null); // Archivo real

  const [newItem, setNewItem] = useState<PortfolioItem>({ title: '', imageUrl: '', category: 'tatuaje' });
  const [portfolioFile, setPortfolioFile] = useState<File | null>(null); // Archivo real

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [artistsData, portfolioData] = await Promise.all([getArtists(), getPortfolio()]);
    setArtists(artistsData);
    setPortfolio(portfolioData);
    setLoading(false);
  };

  // --- HANDLER ARTISTA ---
  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalUrl = newArtist.photoUrl;

    // 1. Si seleccionó un archivo, lo subimos primero
    if (artistFile) {
        const url = await uploadImage(artistFile, 'artists');
        if (url) finalUrl = url;
    }

    // 2. Guardamos en BD con la URL generada
    await addArtist({ ...newArtist, photoUrl: finalUrl });
    
    // 3. Limpieza
    setUploading(false);
    setShowArtistModal(false);
    setNewArtist({ name: '', specialty: '', bio: '', photoUrl: '', active: true });
    setArtistFile(null);
    loadData();
  };

  // --- HANDLER PORTAFOLIO ---
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalUrl = newItem.imageUrl;

    if (portfolioFile) {
        const url = await uploadImage(portfolioFile, 'portfolio');
        if (url) finalUrl = url;
    }

    await addPortfolioItem({ ...newItem, imageUrl: finalUrl });
    
    setUploading(false);
    setShowPortfolioModal(false);
    setNewItem({ title: '', imageUrl: '', category: 'tatuaje' });
    setPortfolioFile(null);
    loadData();
  };

  // --- BORRAR ---
  const handleDelete = async (type: 'artist'|'item', id: string) => {
      if(!confirm('¿Seguro de eliminar?')) return;
      if(type === 'artist') await deleteArtist(id);
      else await deletePortfolioItem(id);
      loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-heading font-bold text-dark-900">Gestor de Contenido</h2>
            <p className="text-dark-600 text-sm">Sube fotos reales de tu trabajo.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('artistas')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'artistas' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <Users size={18} /> Equipo
        </button>
        <button onClick={() => setActiveTab('portafolio')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'portafolio' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <ImageIcon size={18} /> Portafolio
        </button>
      </div>

      {/* --- VISTA ARTISTAS --- */}
      {activeTab === 'artistas' && (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowArtistModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover">
                    <Plus size={18} /> Nuevo Artista
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {artists.map(a => (
                    <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-center">
                        <img src={a.photoUrl || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full object-cover bg-gray-100" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-dark-900 truncate">{a.name}</h3>
                            <p className="text-xs text-primary font-bold uppercase">{a.specialty}</p>
                        </div>
                        <button onClick={() => a.id && handleDelete('artist', a.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- VISTA PORTAFOLIO --- */}
      {activeTab === 'portafolio' && (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowPortfolioModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover">
                    <Plus size={18} /> Nueva Foto
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {portfolio.map(item => (
                    <div key={item.id} className="group relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
                        <img src={item.imageUrl} className="w-full h-full object-cover" />
                        <button onClick={() => item.id && handleDelete('item', item.id)} className="absolute top-2 right-2 p-1.5 bg-white/80 rounded-full hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                        <div className="absolute bottom-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                            <p className="text-white text-xs font-bold truncate">{item.title}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* --- MODAL ARTISTA CON UPLOAD --- */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                <h3 className="font-bold text-xl mb-4">Agregar Artista</h3>
                <form onSubmit={handleSaveArtist} className="space-y-4">
                    <input required placeholder="Nombre" className="w-full p-2 border rounded" value={newArtist.name} onChange={e => setNewArtist({...newArtist, name: e.target.value})}/>
                    <input required placeholder="Especialidad" className="w-full p-2 border rounded" value={newArtist.specialty} onChange={e => setNewArtist({...newArtist, specialty: e.target.value})}/>
                    <textarea placeholder="Biografía" className="w-full p-2 border rounded" value={newArtist.bio} onChange={e => setNewArtist({...newArtist, bio: e.target.value})}/>
                    
                    {/* INPUT DE ARCHIVO PERSONALIZADO */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors relative">
                        <input 
                            type="file" accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setArtistFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center text-gray-500">
                            <Upload size={24} className="mb-2"/>
                            <span className="text-xs font-bold">{artistFile ? artistFile.name : "Click para subir Foto de Perfil"}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowArtistModal(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                        <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary text-white rounded font-bold flex items-center gap-2">
                            {uploading ? <><Loader2 size={16} className="animate-spin"/> Subiendo...</> : "Guardar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL PORTAFOLIO CON UPLOAD --- */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md animate-in zoom-in duration-200">
                <h3 className="font-bold text-xl mb-4">Subir al Portafolio</h3>
                <form onSubmit={handleSaveItem} className="space-y-4">
                    <input required placeholder="Título del Tatuaje" className="w-full p-2 border rounded" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})}/>
                    <select className="w-full p-2 border rounded" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as any})}>
                        <option value="tatuaje">Tatuaje</option>
                        <option value="piercing">Piercing</option>
                        <option value="micro">Micropigmentación</option>
                    </select>

                    {/* INPUT DE ARCHIVO PERSONALIZADO */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative bg-gray-50/50">
                        <input 
                            type="file" accept="image/*" required
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => setPortfolioFile(e.target.files?.[0] || null)}
                        />
                        <div className="flex flex-col items-center text-gray-500">
                            <Upload size={32} className="mb-2 text-primary"/>
                            <span className="text-sm font-bold text-dark-900">{portfolioFile ? portfolioFile.name : "Arrastra o Click para subir foto"}</span>
                            <span className="text-xs text-gray-400 mt-1">JPG, PNG hasta 5MB</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={() => setShowPortfolioModal(false)} className="px-4 py-2 text-gray-500 font-bold">Cancelar</button>
                        <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary text-white rounded font-bold flex items-center gap-2">
                            {uploading ? <><Loader2 size={16} className="animate-spin"/> Subiendo...</> : "Publicar Foto"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}