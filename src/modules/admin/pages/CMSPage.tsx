import { useState, useEffect } from "react";
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
  ArrowLeft,
  X,
  Check,
  AlertCircle
} from "lucide-react";

// Importamos Tipos
import type { 
  Artist, 
  Service, 
  ServiceDetail, 
  PortfolioAlbum 
} from '../../../types/db';

// Importamos Servicios
import {
  getArtists, addArtist, updateArtist, deleteArtist,
  getServices, addService, deleteService,
  getAlbums, createAlbum, deleteAlbum, addImagesToAlbum, removeImageFromAlbum,
} from "../services/cms.service";

import { uploadImage, deleteImageFromStorage } from "../services/upload.service"; // Asegúrate de tener deleteImageFromStorage

// --- COMPONENTE DE NOTIFICACIÓN (TOAST) ---
const Toast = ({ msg, type, onClose }: { msg: string, type: 'success' | 'error', onClose: () => void }) => (
    <div className={`fixed top-24 right-8 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-right duration-300 ${
        type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'
    }`}>
        {type === 'success' ? <Check size={18}/> : <AlertCircle size={18}/>}
        <span className="font-medium text-sm">{msg}</span>
        <button onClick={onClose}><X size={14} className="opacity-50 hover:opacity-100"/></button>
    </div>
);

export default function CMSPage() {
  // --- ESTADOS GLOBALES ---
  const [activeTab, setActiveTab] = useState<"artistas" | "portafolio" | "services">("artistas");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Notificaciones
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // --- DATOS ---
  const [artists, setArtists] = useState<Artist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);

  // --- MODALES ---
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);

  // --- FORMULARIO: ARTISTAS ---
  const [newArtist, setNewArtist] = useState<Artist>({ name: "", specialty: "", bio: "", photoUrl: "", active: true, instagramUrl: "", facebookUrl: "", whatsappNumber: "", portfolioAlbumId: "" });
  const [artistFile, setArtistFile] = useState<File | null>(null);
  const [editingArtistId, setEditingArtistId] = useState<string | null>(null);

  // --- FORMULARIO: SERVICIOS ---
  const [newService, setNewService] = useState<Service>({ title: "", mainDescription: "", imageUrl: "", active: true, details: [{ title: "Proceso", description: "", iconKey: "edit" }, { title: "Materiales", description: "", iconKey: "shield" }, { title: "Beneficios", description: "", iconKey: "check" }] });
  const [serviceFile, setServiceFile] = useState<File | null>(null);

  // --- FORMULARIO: PORTAFOLIO ---
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [albumForm, setAlbumForm] = useState({ title: "", subtitle: "" });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);

  // --- HELPERS ---
  const showToast = (msg: string, type: 'success'|'error') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 4000);
  };

  const validateFile = (file: File): boolean => {
      if (file.size > 5 * 1024 * 1024) { // 5MB
          showToast("La imagen es muy pesada (Máx 5MB)", "error");
          return false;
      }
      return true;
  };

  // --- CARGA INICIAL ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
        const [artistsData, servicesData, albumsData] = await Promise.all([
            getArtists(), getServices(), getAlbums(),
        ]);
        setArtists(artistsData);
        setServices(servicesData);
        setAlbums(albumsData);
    } catch (e) {
        showToast("Error cargando datos", "error");
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLERS ARTISTAS ---
  const handleEditArtistClick = (artist: Artist) => {
    setNewArtist(artist);
    setEditingArtistId(artist.id!);
    setArtistFile(null);
    setShowArtistModal(true);
  };

  const handleNewArtistClick = () => {
    setNewArtist({ name: "", specialty: "", bio: "", photoUrl: "", active: true, instagramUrl: "", facebookUrl: "", whatsappNumber: "", portfolioAlbumId: "" });
    setEditingArtistId(null);
    setArtistFile(null);
    setShowArtistModal(true);
  };

  const handleSaveArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
        let finalUrl = newArtist.photoUrl;
        
        if (artistFile) {
            if (!validateFile(artistFile)) { setUploading(false); return; }
            
            // Si editamos y ya había foto, intentamos borrar la vieja (Mejora Enterprise: Limpieza)
            // if (editingArtistId && newArtist.photoUrl) await deleteImageFromStorage(newArtist.photoUrl);

            const url = await uploadImage(artistFile, "artists");
            if (url) finalUrl = url;
        }
        
        const artistData = { ...newArtist, photoUrl: finalUrl };

        if (editingArtistId) {
            await updateArtist(editingArtistId, artistData);
            showToast("Artista actualizado correctamente", "success");
        } else {
            await addArtist(artistData);
            showToast("Artista creado correctamente", "success");
        }
        
        setShowArtistModal(false);
        loadData();
    } catch (error) {
        showToast("Error al guardar artista", "error");
    } finally {
        setUploading(false);
    }
  };

  // --- HANDLERS SERVICIOS ---
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
        let finalUrl = newService.imageUrl;
        if (serviceFile) {
            if (!validateFile(serviceFile)) { setUploading(false); return; }
            const url = await uploadImage(serviceFile, "services");
            if (url) finalUrl = url;
        }
        
        await addService({ ...newService, imageUrl: finalUrl });
        showToast("Servicio publicado", "success");
        setShowServiceModal(false);
        setServiceFile(null);
        // Reset
        setNewService({ title: "", mainDescription: "", imageUrl: "", active: true, details: [{ title: "Proceso", description: "", iconKey: "edit" }, { title: "Materiales", description: "", iconKey: "shield" }, { title: "Beneficios", description: "", iconKey: "check" }] });
        loadData();
    } catch (e) {
        showToast("Error al guardar servicio", "error");
    } finally {
        setUploading(false);
    }
  };

  const updateDetail = (index: number, field: keyof ServiceDetail, value: string) => {
    const updatedDetails = [...newService.details];
    // @ts-ignore
    updatedDetails[index][field] = value;
    setNewService({ ...newService, details: updatedDetails });
  };

  // --- HANDLERS PORTAFOLIO ---
  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
        let coverUrl = "";
        if (coverFile) {
            if (!validateFile(coverFile)) { setUploading(false); return; }
            const url = await uploadImage(coverFile, "portfolio_covers");
            if (url) coverUrl = url;
        }

        await createAlbum({
            title: albumForm.title,
            subtitle: albumForm.subtitle,
            coverUrl: coverUrl,
            galleryUrls: [],
        });

        showToast("Álbum creado", "success");
        setShowPortfolioModal(false);
        setAlbumForm({ title: "", subtitle: "" });
        setCoverFile(null);
        loadData();
    } catch(e) {
        showToast("Error creando álbum", "error");
    } finally {
        setUploading(false);
    }
  };

  const handleUploadGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlbum?.id || !galleryFiles) return;
    setUploading(true);

    try {
        const newUrls: string[] = [];
        for (let i = 0; i < galleryFiles.length; i++) {
            const file = galleryFiles[i];
            if (validateFile(file)) {
                const url = await uploadImage(file, `portfolio_gallery/${selectedAlbum.id}`);
                if (url) newUrls.push(url);
            }
        }

        await addImagesToAlbum(selectedAlbum.id, newUrls);
        setSelectedAlbum({ ...selectedAlbum, galleryUrls: [...(selectedAlbum.galleryUrls || []), ...newUrls] });
        
        showToast(`${newUrls.length} fotos subidas`, "success");
        setGalleryFiles(null);
        loadData();
    } catch (e) {
        showToast("Error al subir fotos", "error");
    } finally {
        setUploading(false);
    }
  };

  // Handler Genérico de Borrado
  const handleDelete = async (type: "artist" | "album" | "service", id: string) => {
    if (!confirm("¿Seguro de eliminar este elemento y todo su contenido? Esta acción no se puede deshacer.")) return;

    try {
        if (type === "artist") await deleteArtist(id);
        else if (type === "service") await deleteService(id);
        else if (type === "album") await deleteAlbum(id);
        
        showToast("Elemento eliminado", "success");
        loadData();
    } catch (e) {
        showToast("Error al eliminar", "error");
    }
  };

  const handleDeletePhoto = async (url: string) => {
    if (!selectedAlbum?.id || !confirm("¿Borrar esta foto?")) return;
    try {
        await removeImageFromAlbum(selectedAlbum.id, url);
        // Opcional: Borrar también de Storage para limpiar
        // await deleteImageFromStorage(url); 

        setSelectedAlbum({ ...selectedAlbum, galleryUrls: selectedAlbum.galleryUrls.filter((u) => u !== url) });
        showToast("Foto eliminada", "success");
        loadData();
    } catch (e) {
        showToast("Error al eliminar foto", "error");
    }
  };


  // --- RENDER ---
  return (
    <div className="space-y-6 relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Gestor de Contenido</h2>
          <p className="text-dark-600 text-sm">Administra el contenido público.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button onClick={() => setActiveTab("artistas")} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === "artistas" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Users size={18} /> Equipo</button>
        <button onClick={() => setActiveTab("portafolio")} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === "portafolio" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}><ImageIcon size={18} /> Portafolio</button>
        <button onClick={() => setActiveTab("services")} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === "services" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}><Layers size={18} /> Servicios</button>
      </div>

      {/* CONTENIDO: ARTISTAS */}
      {activeTab === "artistas" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-end mb-4">
            <button onClick={handleNewArtistClick} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm inline-flex items-center gap-2 hover:bg-primary-hover transition-colors shadow-sm">
              <Plus size={18} /> Nuevo Artista
            </button>
          </div>
          {loading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary"/></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {artists.map((a) => (
                <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 items-center group hover:shadow-md transition-all hover:border-gray-200">
                    <img src={a.photoUrl || "https://via.placeholder.com/150"} className="w-16 h-16 rounded-full object-cover bg-gray-100 border-2 border-white shadow-sm" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-dark-900 truncate">{a.name}</h3>
                        <p className="text-xs text-primary font-bold uppercase">{a.specialty}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditArtistClick(a)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit3 size={18} /></button>
                        <button onClick={() => a.id && handleDelete("artist", a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                </div>
                ))}
                {artists.length === 0 && <div className="col-span-3 text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">No hay artistas registrados.</div>}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO: PORTAFOLIO */}
      {activeTab === "portafolio" && (
        <div className="animate-in fade-in duration-300">
          {!selectedAlbum ? (
            <>
              <div className="flex justify-end mb-6">
                <button onClick={() => setShowPortfolioModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover shadow-sm">
                  <Plus size={18} /> Crear Álbum
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                  <div key={album.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-all hover:-translate-y-1">
                    <div className="h-48 overflow-hidden relative bg-gray-100">
                      {album.coverUrl ? (
                        <img src={album.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300"><ImageIcon size={40} /></div>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={() => setSelectedAlbum(album)} className="bg-white text-dark-900 px-5 py-2 rounded-full font-bold text-sm hover:bg-gray-100 shadow-lg transform hover:scale-105 transition-all">
                          Gestionar Fotos
                        </button>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-dark-900">{album.title}</h3>
                        <p className="text-xs text-gray-500">{album.galleryUrls?.length || 0} fotos</p>
                      </div>
                      <button onClick={() => album.id && handleDelete("album", album.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {albums.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">No hay álbumes. Crea uno para empezar a subir fotos.</div>}
              </div>
            </>
          ) : (
            /* VISTA DENTRO DE ÁLBUM */
            <div className="bg-white p-6 rounded-2xl border border-gray-100 animate-in slide-in-from-right-8 duration-300 shadow-sm">
              <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <button onClick={() => setSelectedAlbum(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-dark-900">
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-dark-900">Editando: {selectedAlbum.title}</h2>
                  <p className="text-sm text-gray-500">Gestiona las fotos de esta colección.</p>
                </div>
              </div>

              <form onSubmit={handleUploadGallery} className="mb-8 bg-gray-50 p-8 rounded-xl border-2 border-dashed border-gray-300 flex flex-col md:flex-row items-center gap-6 justify-center hover:border-primary/30 transition-colors">
                <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-dark-900 mb-1">Subir nuevas fotos</p>
                    <p className="text-xs text-gray-500">Selecciona múltiples archivos a la vez</p>
                </div>
                <input type="file" multiple accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" onChange={(e) => setGalleryFiles(e.target.files)} />
                <button disabled={!galleryFiles || uploading} className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm disabled:opacity-50 whitespace-nowrap shadow-md hover:bg-primary-hover transition-all flex items-center gap-2">
                  {uploading ? <><Loader2 className="animate-spin" size={16}/> Subiendo...</> : <><Upload size={16}/> Subir Fotos</>}
                </button>
              </form>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {selectedAlbum.galleryUrls?.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                    <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <button onClick={() => handleDeletePhoto(url)} className="bg-white text-red-600 p-2 rounded-full hover:bg-red-50 shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {(!selectedAlbum.galleryUrls || selectedAlbum.galleryUrls.length === 0) && (
                <p className="text-gray-400 text-center py-10">Este álbum está vacío. ¡Sube tus mejores trabajos!</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- CONTENIDO: SERVICIOS --- */}
      {activeTab === "services" && (
        <div className="animate-in fade-in duration-300">
          <div className="flex justify-end mb-4">
            <button onClick={() => setShowServiceModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-primary-hover shadow-sm">
              <Plus size={18} /> Nuevo Servicio
            </button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {services.map((s) => (
              <div key={s.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center hover:shadow-md transition-shadow">
                <div className="w-full md:w-48 h-32 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={s.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-heading font-bold text-dark-900">{s.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{s.mainDescription}</p>
                  <div className="flex gap-3 flex-wrap">
                    {s.details.map((d, i) => (
                      <span key={i} className="text-xs bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 text-gray-600 flex items-center gap-1.5 font-medium">
                        {d.iconKey === "edit" && <Edit3 size={12} className="text-primary"/>}
                        {d.iconKey === "shield" && <Shield size={12} className="text-primary"/>}
                        {d.iconKey === "check" && <CheckCircle size={12} className="text-primary"/>}
                        {d.title}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => s.id && handleDelete("service", s.id)} className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors self-start md:self-center">
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            {services.length === 0 && <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">No hay servicios creados aún.</div>}
          </div>
        </div>
      )}

      {/* -------------------------------------------- */}
      {/* MODALES DE EDICIÓN              */}
      {/* -------------------------------------------- */}

      {/* MODAL ARTISTA (Versión Enterprise) */}
      {showArtistModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in duration-200 border border-gray-100">
                
                {/* HEADER FIJO */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white rounded-t-2xl">
                    <div>
                        <h3 className="font-heading font-bold text-xl text-dark-900">
                            {editingArtistId ? 'Editar Perfil' : 'Nuevo Artista'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Complete la información profesional del talento.</p>
                    </div>
                    <button onClick={() => setShowArtistModal(false)} className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-dark-900 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* CUERPO CON SCROLL */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <form id="artistForm" onSubmit={handleSaveArtist} className="space-y-8">
                        {/* ... (Aquí va el mismo contenido del form de artista que ya tenías, asegurando usar newArtist) ... */}
                        {/* Reuso tu estructura de inputs pero con estilos mejorados */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-bold text-gray-600 mb-1 block">Nombre Artístico</label>
                                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" value={newArtist.name} onChange={e => setNewArtist({ ...newArtist, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-gray-600 mb-1 block">Especialidad</label>
                                <input required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none" value={newArtist.specialty} onChange={e => setNewArtist({ ...newArtist, specialty: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-600 mb-1 block">Biografía</label>
                            <textarea required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none h-28 resize-none" value={newArtist.bio} onChange={e => setNewArtist({ ...newArtist, bio: e.target.value })} />
                        </div>
                        
                        {/* Imagen y Redes (Resumido para brevedad, usa tu lógica anterior) */}
                        <div className="border-t border-gray-100 pt-6">
                             <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Foto y Redes</h4>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
                                    <p className="text-xs text-gray-400 mb-2">Foto Vertical</p>
                                    <input type="file" onChange={e => setArtistFile(e.target.files?.[0] || null)} />
                                </div>
                                <div className="space-y-3">
                                    <input className="w-full p-2 border rounded-lg text-sm" placeholder="Instagram URL" value={newArtist.instagramUrl} onChange={e => setNewArtist({...newArtist, instagramUrl: e.target.value})} />
                                    <input className="w-full p-2 border rounded-lg text-sm" placeholder="Facebook URL" value={newArtist.facebookUrl} onChange={e => setNewArtist({...newArtist, facebookUrl: e.target.value})} />
                                    <input className="w-full p-2 border rounded-lg text-sm" placeholder="WhatsApp #" value={newArtist.whatsappNumber} onChange={e => setNewArtist({...newArtist, whatsappNumber: e.target.value})} />
                                </div>
                             </div>
                             <div className="mt-4">
                                <label className="text-xs font-bold text-gray-500">Vincular Portafolio</label>
                                <select className="w-full p-3 bg-gray-50 border rounded-xl mt-1" value={newArtist.portfolioAlbumId} onChange={e => setNewArtist({...newArtist, portfolioAlbumId: e.target.value})}>
                                    <option value="">-- Ninguno --</option>
                                    {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                                </select>
                             </div>
                        </div>
                    </form>
                </div>

                {/* FOOTER FIJO */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl flex justify-end gap-3">
                    <button className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-200 transition-colors" onClick={() => setShowArtistModal(false)}>Cancelar</button>
                    <button className="bg-dark-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-primary transition-all shadow-lg flex items-center gap-2" type="submit" form="artistForm" disabled={uploading}>
                        {uploading ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : (editingArtistId ? 'Actualizar' : 'Guardar')}
                    </button>
                </div>
            </div>
        </div> 
      )}

      {/* MODAL SERVICIO (Simplificado visualmente) */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-xl">Nuevo Servicio</h3>
                    <button onClick={() => setShowServiceModal(false)}><X size={20}/></button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <form id="serviceForm" onSubmit={handleSaveService} className="space-y-6">
                        <input required className="w-full p-3 border rounded-xl" placeholder="Título" value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})}/>
                        <textarea required className="w-full p-3 border rounded-xl h-24" placeholder="Descripción" value={newService.mainDescription} onChange={e => setNewService({...newService, mainDescription: e.target.value})}/>
                        <input type="file" onChange={e => setServiceFile(e.target.files?.[0] || null)} />
                        
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                            <h4 className="font-bold text-xs text-gray-500 uppercase">Puntos Clave</h4>
                            {newService.details.map((d, i) => (
                                <div key={i} className="flex gap-2">
                                    <select className="p-2 border rounded-lg" value={d.iconKey} onChange={e => updateDetail(i, 'iconKey', e.target.value)}><option value="edit">✏️</option><option value="shield">🛡️</option><option value="check">✅</option></select>
                                    <input className="flex-1 p-2 border rounded-lg" value={d.title} onChange={e => updateDetail(i, 'title', e.target.value)} placeholder="Título punto" />
                                    <input className="flex-1 p-2 border rounded-lg" value={d.description} onChange={e => updateDetail(i, 'description', e.target.value)} placeholder="Desc." />
                                </div>
                            ))}
                        </div>
                    </form>
                </div>
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                    <button className="px-6 py-2 rounded-xl hover:bg-gray-100" onClick={()=>setShowServiceModal(false)}>Cancelar</button>
                    <button type="submit" form="serviceForm" disabled={uploading} className="bg-primary text-white px-6 py-2 rounded-xl font-bold">{uploading ? '...' : 'Publicar'}</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL ÁLBUM (Simplificado visualmente) */}
      {showPortfolioModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="font-bold text-xl mb-6">Nuevo Álbum</h3>
                <form onSubmit={handleCreateAlbum} className="space-y-4">
                    <input required className="w-full p-3 border rounded-lg" placeholder="Título" value={albumForm.title} onChange={e => setAlbumForm({...albumForm, title: e.target.value})}/>
                    <input className="w-full p-3 border rounded-lg" placeholder="Subtítulo" value={albumForm.subtitle} onChange={e => setAlbumForm({...albumForm, subtitle: e.target.value})}/>
                    <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg text-center">
                        <p className="text-xs mb-2">Portada</p>
                        <input type="file" required onChange={e => setCoverFile(e.target.files?.[0] || null)}/>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setShowPortfolioModal(false)} className="px-4 py-2 rounded-lg hover:bg-gray-100">Cancelar</button>
                        <button type="submit" disabled={uploading} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">{uploading ? '...' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}