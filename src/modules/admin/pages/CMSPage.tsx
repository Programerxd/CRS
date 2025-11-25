import { useState, useEffect } from 'react';
import { 
  Users, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Upload, 
  Loader2, 
  Layers, 
  Edit3, 
  Shield, 
  CheckCircle, 
  Star, 
  ArrowLeft 
} from 'lucide-react';

// Asegúrate de que tus servicios exporten estas nuevas funciones
import { 
  getArtists, addArtist, deleteArtist, 
  getServices, addService, deleteService,
  getAlbums, createAlbum, deleteAlbum, addImagesToAlbum, removeImageFromAlbum // <--- NUEVOS
} from '../services/cms.service';

import type { Artist, PortfolioItem } from '../services/cms.service'; // Tipos viejos si aun los usas
import type { Service, ServiceDetail, PortfolioAlbum } from '../../../types/db'; // <--- Importamos PortfolioAlbum
import { uploadImage } from '../services/upload.service';

export default function CMSPage() {
  const [activeTab, setActiveTab] = useState<'artistas' | 'portafolio' | 'services'>('artistas');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // --- ESTADOS DE DATOS ---
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]); // <--- Nuevo estado para álbumes

  // --- ESTADOS DE MODALES ---
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false); // Modal para crear Álbum

  // --- ESTADOS DE FORMULARIOS ---
  
  // 1. Artistas
  const [newArtist, setNewArtist] = useState<Artist>({ name: '', specialty: '', bio: '', photoUrl: '', active: true });
  const [artistFile, setArtistFile] = useState<File | null>(null);

  // 2. Servicios
  const [newService, setNewService] = useState<Service>({ 
      title: '', mainDescription: '', imageUrl: '', active: true,
      details: [
          { title: 'Proceso', description: '', iconKey: 'edit' },
          { title: 'Materiales', description: '', iconKey: 'shield' },
          { title: 'Beneficios', description: '', iconKey: 'check' }
      ]
  });
  const [serviceFile, setServiceFile] = useState<File | null>(null);

  // 3. Portafolio (Álbumes)
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null); // ¿En qué álbum estamos?
  const [albumForm, setAlbumForm] = useState({ title: '', subtitle: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null); // Portada del álbum
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null); // Múltiples fotos para subir

  // --- CARGA INICIAL ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [artistsData, servicesData, albumsData] = await Promise.all([
        getArtists(), 
        getServices(),
        getAlbums() // <--- Cargamos los álbumes
    ]);
    setArtists(artistsData);
    setServices(servicesData);
    setAlbums(albumsData);
    setLoading(false);
  };

  // --- HANDLERS: ARTISTAS ---
  const handleSaveArtist = async (e: React.FormEvent) => {
      e.preventDefault(); setUploading(true);
      let finalUrl = newArtist.photoUrl;
      if (artistFile) { const url = await uploadImage(artistFile, 'artists'); if (url) finalUrl = url; }
      await addArtist({ ...newArtist, photoUrl: finalUrl });
      setUploading(false); setShowArtistModal(false); setArtistFile(null); loadData();
  };

  // --- HANDLERS: SERVICIOS ---
  const handleSaveService = async (e: React.FormEvent) => {
      e.preventDefault(); setUploading(true);
      let finalUrl = newService.imageUrl;
      if (serviceFile) { const url = await uploadImage(serviceFile, 'services'); if (url) finalUrl = url; }
      await addService({ ...newService, imageUrl: finalUrl });
      setUploading(false); setShowServiceModal(false); setServiceFile(null);
      setNewService({ title: '', mainDescription: '', imageUrl: '', active: true, details: [{ title: 'Proceso', description: '', iconKey: 'edit' }, { title: 'Materiales', description: '', iconKey: 'shield' }, { title: 'Beneficios', description: '', iconKey: 'check' }] });
      loadData();
  };

  const updateDetail = (index: number, field: keyof ServiceDetail, value: string) => {
      const updatedDetails = [...newService.details];
      // @ts-ignore
      updatedDetails[index][field] = value;
      setNewService({ ...newService, details: updatedDetails });
  };

  // --- HANDLERS: PORTAFOLIO (NUEVO SISTEMA) ---

  // 1. Crear un Álbum (Carpeta)
  const handleCreateAlbum = async (e: React.FormEvent) => {
      e.preventDefault();
      setUploading(true);
      let coverUrl = '';
      
      if (coverFile) {
          const url = await uploadImage(coverFile, 'portfolio_covers');
          if (url) coverUrl = url;
      }

      await createAlbum({
          title: albumForm.title,
          subtitle: albumForm.subtitle,
          coverUrl: coverUrl,
          galleryUrls: []
      });

      setUploading(false);
      setShowPortfolioModal(false);
      setAlbumForm({ title: '', subtitle: '' });
      setCoverFile(null);
      loadData();
  };

  // 2. Subir Múltiples Fotos al Álbum Seleccionado
  const handleUploadGallery = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAlbum?.id || !galleryFiles) return;
      setUploading(true);

      const newUrls: string[] = [];
      // Subimos foto por foto
      for (let i = 0; i < galleryFiles.length; i++) {
          const file = galleryFiles[i];
          const url = await uploadImage(file, `portfolio_gallery/${selectedAlbum.id}`);
          if (url) newUrls.push(url);
      }

      // Guardamos las URLs en el array del álbum en Firestore
      await addImagesToAlbum(selectedAlbum.id, newUrls);
      
      // Actualizamos la vista local sin recargar todo
      setSelectedAlbum({
          ...selectedAlbum,
          galleryUrls: [...(selectedAlbum.galleryUrls || []), ...newUrls]
      });
      
      setUploading(false);
      setGalleryFiles(null);
      loadData(); // Refrescamos la lista general por si acaso
  };

  // 3. Borrar una foto específica dentro de un álbum
  const handleDeletePhoto = async (url: string) => {
      if (!selectedAlbum?.id || !confirm("¿Borrar esta foto?")) return;
      await removeImageFromAlbum(selectedAlbum.id, url);
      
      setSelectedAlbum({
          ...selectedAlbum,
          galleryUrls: selectedAlbum.galleryUrls.filter(u => u !== url)
      });
      loadData();
  };

  // --- HANDLER GENERAL DE BORRADO ---
  const handleDelete = async (type: 'artist'|'album'|'service', id: string) => {
      if(!confirm('¿Seguro de eliminar este elemento y todo su contenido?')) return;
      
      if(type === 'artist') await deleteArtist(id);
      else if(type === 'service') await deleteService(id);
      else if(type === 'album') await deleteAlbum(id);
      
      loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-heading font-bold text-dark-900">Gestor de Contenido</h2>
            <p className="text-dark-600 text-sm">Administra el contenido público.</p>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab('artistas')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'artistas' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <Users size={18} /> Equipo
        </button>
        <button onClick={() => setActiveTab('portafolio')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'portafolio' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <ImageIcon size={18} /> Portafolio
        </button>
        <button onClick={() => setActiveTab('services')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'services' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <Layers size={18} /> Servicios
        </button>
      </div>

      {/* --- CONTENIDO: ARTISTAS --- */}
      {activeTab === 'artistas' && (
          <div>
             <div className="flex justify-end mb-4">
                <button onClick={() => setShowArtistModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2"><Plus size={18} /> Nuevo Artista</button>
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

      {/* --- CONTENIDO: PORTAFOLIO (ÁLBUMES) --- */}
      {activeTab === 'portafolio' && (
          <div>
            {/* VISTA 1: LISTADO DE ÁLBUMES */}
            {!selectedAlbum ? (
                <>
                    <div className="flex justify-end mb-6">
                        <button onClick={() => setShowPortfolioModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover shadow-md">
                            <Plus size={18} /> Crear Álbum
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {albums.map(album => (
                            <div key={album.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                <div className="h-48 overflow-hidden relative bg-gray-100">
                                    {album.coverUrl ? (
                                        <img src={album.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={40}/></div>
                                    )}
                                    {/* Overlay para entrar */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setSelectedAlbum(album)} className="bg-white text-dark-900 px-4 py-2 rounded-full font-bold text-sm hover:bg-gray-100">
                                            Gestionar Fotos
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-dark-900">{album.title}</h3>
                                        <p className="text-xs text-gray-500">{album.galleryUrls?.length || 0} fotos</p>
                                    </div>
                                    <button onClick={() => album.id && handleDelete('album', album.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        ))}
                        {albums.length === 0 && <p className="text-center col-span-3 text-gray-400 py-10">No hay álbumes. Crea uno para empezar.</p>}
                    </div>
                </>
            ) : (
                /* VISTA 2: DENTRO DE UN ÁLBUM */
                <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                        <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={20}/></button>
                        <div>
                            <h2 className="text-xl font-bold text-dark-900">Editando: {selectedAlbum.title}</h2>
                            <p className="text-sm text-gray-500">Gestiona las fotos de esta colección.</p>
                        </div>
                    </div>

                    {/* Área de Subida */}
                    <form onSubmit={handleUploadGallery} className="mb-8 bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 flex flex-col md:flex-row items-center gap-4 justify-center">
                        <input 
                            type="file" multiple accept="image/*" 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            onChange={e => setGalleryFiles(e.target.files)}
                        />
                        <button disabled={!galleryFiles || uploading} className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 whitespace-nowrap shadow-md">
                            {uploading ? 'Subiendo...' : 'Subir Fotos a Galería'}
                        </button>
                    </form>

                    {/* Grid de Fotos Internas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {selectedAlbum.galleryUrls?.map((url, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                <img src={url} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleDeletePhoto(url)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-md hover:bg-red-600 shadow-sm">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {(!selectedAlbum.galleryUrls || selectedAlbum.galleryUrls.length === 0) && <p className="text-gray-400 text-center py-10">Este álbum está vacío. Sube algunas fotos.</p>}
                </div>
            )}
          </div>
      )}

      {/* --- CONTENIDO: SERVICIOS --- */}
      {activeTab === 'services' && (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setShowServiceModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover shadow-md">
                    <Plus size={18} /> Nuevo Servicio
                </button>
            </div>
            <div className="grid grid-cols-1 gap-6">
                {services.map(s => (
                    <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-full md:w-48 h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                            <img src={s.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-heading font-bold text-dark-900">{s.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{s.mainDescription}</p>
                            
                            <div className="flex gap-4">
                                {s.details.map((d, i) => (
                                    <span key={i} className="text-xs bg-gray-50 px-2 py-1 rounded border border-gray-200 text-gray-600 flex items-center gap-1">
                                        {d.iconKey === 'edit' && <Edit3 size={10}/>}
                                        {d.iconKey === 'shield' && <Shield size={10}/>}
                                        {d.iconKey === 'check' && <CheckCircle size={10}/>}
                                        {d.title}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => s.id && handleDelete('service', s.id)} className="p-3 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
                            <Trash2 size={20}/>
                        </button>
                    </div>
                ))}
                {services.length === 0 && <p className="text-center text-gray-400 py-10">No hay servicios creados aún.</p>}
            </div>
        </div>
      )}

      {/* --- MODAL: CREAR ARTISTA --- */}
      {showArtistModal && ( 
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="mb-4 font-bold text-xl">Agregar Artista</h3>
                <form onSubmit={handleSaveArtist} className="space-y-4">
                    <input className="w-full border p-3 rounded-lg" placeholder="Nombre" value={newArtist.name} onChange={e=>setNewArtist({...newArtist, name:e.target.value})}/>
                    <input className="w-full border p-3 rounded-lg" placeholder="Especialidad" value={newArtist.specialty} onChange={e=>setNewArtist({...newArtist, specialty:e.target.value})}/>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                        <input type="file" className="w-full" onChange={e=>setArtistFile(e.target.files?.[0]||null)}/>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg font-bold text-sm" type="button" onClick={()=>setShowArtistModal(false)}>Cancelar</button>
                        <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm" type="submit" disabled={uploading}>{uploading ? 'Guardando...' : 'Guardar'}</button>
                    </div>
                </form>
            </div>
        </div> 
      )}

      {/* --- MODAL: CREAR SERVICIO --- */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in duration-200 my-8 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-xl text-dark-900">Crear Nuevo Servicio</h3>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form id="serviceForm" onSubmit={handleSaveService} className="space-y-6">
                        <div className="space-y-4">
                            <input required className="w-full p-3 border rounded-xl" placeholder="Título del Servicio" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})}/>
                            <textarea required className="w-full p-3 border rounded-xl h-24 resize-none" placeholder="Descripción..." value={newService.mainDescription} onChange={e => setNewService({...newService, mainDescription: e.target.value})}/>
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                <input type="file" accept="image/*" onChange={(e) => setServiceFile(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                            <h4 className="text-sm font-bold text-dark-900">Detalles</h4>
                            {newService.details.map((detail, index) => (
                                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                    <div className="md:col-span-2">
                                        <select className="w-full p-2 border rounded-lg" value={detail.iconKey} onChange={(e) => updateDetail(index, 'iconKey', e.target.value)}>
                                            <option value="edit">✏️</option><option value="shield">🛡️</option><option value="check">✅</option><option value="star">⭐</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-3"><input className="w-full p-2 border rounded-lg" placeholder="Título" value={detail.title} onChange={(e) => updateDetail(index, 'title', e.target.value)}/></div>
                                    <div className="md:col-span-7"><input className="w-full p-2 border rounded-lg" placeholder="Descripción" value={detail.description} onChange={(e) => updateDetail(index, 'description', e.target.value)}/></div>
                                </div>
                            ))}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowServiceModal(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-200 rounded-xl text-sm">Cancelar</button>
                    <button type="submit" form="serviceForm" disabled={uploading} className="px-8 py-3 bg-primary text-white rounded-xl font-bold text-sm">{uploading ? 'Guardando...' : 'Publicar'}</button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL: CREAR ÁLBUM --- */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                <h3 className="font-bold text-xl mb-4">Nuevo Portafolio (Álbum)</h3>
                <form onSubmit={handleCreateAlbum} className="space-y-4">
                    <input required placeholder="Título (ej. Tatuajes Realistas)" className="w-full p-3 border rounded-lg" value={albumForm.title} onChange={e => setAlbumForm({...albumForm, title: e.target.value})}/>
                    <input placeholder="Subtítulo (Opcional)" className="w-full p-3 border rounded-lg" value={albumForm.subtitle} onChange={e => setAlbumForm({...albumForm, subtitle: e.target.value})}/>
                    
                    <label className="block text-xs font-bold text-gray-500 uppercase">Imagen de Portada</label>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                        <input required type="file" accept="image/*" className="w-full" onChange={e => setCoverFile(e.target.files?.[0] || null)}/>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setShowPortfolioModal(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" disabled={uploading} className="px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-primary-hover">
                            {uploading ? 'Creando...' : 'Crear Álbum'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}