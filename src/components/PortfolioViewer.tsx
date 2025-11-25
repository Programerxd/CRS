import { useState, useEffect } from 'react';
import { ArrowLeft, X, ZoomIn, GripHorizontal, Layers } from 'lucide-react';
import { getAlbums } from '../modules/admin/services/cms.service';
import type { PortfolioAlbum } from '../types/db';

export default function PortfolioViewer() {
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
        const data = await getAlbums();
        setAlbums(data);
        setLoading(false);
    }
    load();
  }, []);

  // Scroll al top al cambiar de vista
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedAlbum]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-gray-400">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-heading tracking-widest text-xs uppercase">Cargando Galería...</p>
    </div>
  );

  return (
    <section className="min-h-screen bg-gray-50">
      
      {/* =========================================================
          VISTA 1: LISTADO DE ÁLBUMES (TARJETAS PRINCIPALES)
         ========================================================= */}
      {!selectedAlbum ? (
        <>
            {/* --- CORRECCIÓN AQUÍ --- 
               1. '-mt-20': Margen negativo para subir el bloque y eliminar la franja blanca del Layout.
               2. 'pt-32': Padding superior extra para que el texto baje y no quede tapado por el Navbar.
            */}
            <div className="relative bg-secondary-dark -mt-20 pt-32 pb-32 px-4 sm:px-6 lg:px-8 text-center overflow-hidden">
                
                {/* Fondo con textura sutil */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-secondary-dark/90"></div>

                <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-primary font-bold tracking-widest uppercase text-[10px] mb-6 backdrop-blur-md">
                        <Layers size={12} /> Nuestro Trabajo
                    </span>
                    <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-white mb-6 uppercase tracking-tight leading-tight">
                        Galería <span className="text-primary">Profesional</span>
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                        Explora nuestras colecciones especializadas. Desde realismo hasta tradicional, 
                        cada pieza refleja nuestra pasión por el detalle y la higiene.
                    </p>
                </div>
            </div>

            {/* --- GRID DE ÁLBUMES (FLOTANDO SOBRE EL HEADER OSCURO) --- */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {albums.map((album, idx) => (
                        <div 
                            key={album.id} 
                            onClick={() => setSelectedAlbum(album)}
                            className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl hover:shadow-primary/20 transition-all duration-500 transform hover:-translate-y-3 bg-dark-900"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Imagen Fondo */}
                            <img 
                                src={album.coverUrl} 
                                alt={album.title} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                            />
                            
                            {/* Overlay Gradiente Elegante */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-500"></div>
                            
                            {/* Contenido Texto */}
                            <div className="absolute bottom-0 left-0 w-full p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                                <div className="w-12 h-1 bg-primary mb-4 w-0 group-hover:w-12 transition-all duration-500"></div>
                                
                                <h3 className="text-white text-2xl md:text-3xl font-heading font-bold uppercase tracking-tight mb-2">
                                    {album.title}
                                </h3>
                                <p className="text-gray-300 text-sm font-medium mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 line-clamp-2">
                                    {album.subtitle || "Explorar colección completa"}
                                </p>
                                
                                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
                                    <span>Ver {album.galleryUrls?.length || 0} Fotos</span>
                                    <ArrowLeft className="rotate-180 transition-transform group-hover:translate-x-1" size={14}/>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {albums.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-gray-400">No hay álbumes públicos disponibles en este momento.</p>
                    </div>
                )}
            </div>
        </>
      ) : (
        
        /* =========================================================
           VISTA 2: DETALLE DEL ÁLBUM
           ========================================================= */
        <div className="animate-in fade-in duration-500 bg-white">
            
            {/* HEADER CINEMATOGRÁFICO - También ajustado con margen negativo por si acaso */}
            <div className="relative h-[60vh] w-full overflow-hidden -mt-20">
                <img 
                    src={selectedAlbum.coverUrl} 
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-secondary-dark/80 backdrop-blur-sm"></div>

                <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center pt-20">
                    <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-white mb-4 uppercase tracking-tighter">
                        {selectedAlbum.title}
                    </h1>
                    {selectedAlbum.subtitle && (
                        <p className="text-xl text-gray-300 font-light max-w-2xl mb-8">
                            {selectedAlbum.subtitle}
                        </p>
                    )}
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white/90 text-xs font-bold uppercase tracking-widest">
                        <GripHorizontal size={14}/>
                        {selectedAlbum.galleryUrls?.length || 0} Fotografías
                    </div>
                </div>

                <button 
                    onClick={() => setSelectedAlbum(null)}
                    className="absolute top-28 left-4 md:left-8 z-20 flex items-center gap-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-lg px-4 py-2 rounded-full transition-all duration-300 border border-white/10 group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="text-sm font-bold uppercase tracking-wider">Volver</span>
                </button>
            </div>

            {/* GRID DE FOTOS */}
            <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 relative -mt-20 rounded-t-[3rem] bg-white z-20 min-h-[50vh]">
                {(!selectedAlbum.galleryUrls || selectedAlbum.galleryUrls.length === 0) ? (
                    <div className="text-center py-20">
                        <GripHorizontal className="text-gray-300 w-16 h-16 mx-auto mb-4"/>
                        <p className="text-gray-400 text-lg">Esta colección se está actualizando.</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {selectedAlbum.galleryUrls.map((url, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedImage(url)}
                                className="break-inside-avoid relative group rounded-2xl overflow-hidden cursor-zoom-in bg-gray-100 mb-6 border border-gray-100 hover:shadow-lg transition-shadow"
                            >
                                <img 
                                    src={url} 
                                    alt="Detalle Portafolio"
                                    className="w-full h-auto block transform transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy" 
                                />
                                <div className="absolute inset-0 bg-primary/90 opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                                    <ZoomIn className="text-white w-10 h-10 drop-shadow-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* =========================================================
          LIGHTBOX (MODAL FULLSCREEN)
         ========================================================= */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-secondary-dark/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedImage(null)}
        >
            <button className="absolute top-6 right-6 text-white/60 hover:text-white p-2 transition-colors">
                <X size={32} />
            </button>
            <img 
                src={selectedImage} 
                className="max-h-[90vh] max-w-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none border-4 border-white/5" 
                onClick={(e) => e.stopPropagation()} 
            />
        </div>
      )}

    </section>
  );
}