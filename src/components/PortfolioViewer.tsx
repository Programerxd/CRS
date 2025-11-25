import { useState, useEffect } from 'react';
import { ArrowLeft, X, ZoomIn, GripHorizontal } from 'lucide-react';
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
    <section className="min-h-screen bg-white">
      
      {/* =========================================================
          VISTA 1: LISTADO DE ÁLBUMES (TARJETAS PRINCIPALES)
         ========================================================= */}
      {!selectedAlbum ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            
            <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="text-primary font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
                    Nuestro Trabajo
                </span>
                <h2 className="text-4xl md:text-6xl font-heading font-extrabold text-dark-900 mb-6 uppercase tracking-tight">
                    Nuestro <span className="text-primary">Portafolio</span>
                </h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                    Cada pieza es única. Explora nuestras colecciones especializadas y encuentra la inspiración para tu próximo proyecto.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {albums.map((album, idx) => (
                    <div 
                        key={album.id} 
                        onClick={() => setSelectedAlbum(album)}
                        className="group relative h-[450px] rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                        style={{ animationDelay: `${idx * 100}ms` }}
                    >
                        {/* Imagen Fondo */}
                        <img 
                            src={album.coverUrl} 
                            alt={album.title} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                        
                        {/* Overlay Gradiente Elegante */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500"></div>
                        
                        {/* Contenido Texto */}
                        <div className="absolute bottom-0 left-0 w-full p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                            <div className="w-12 h-1 bg-primary mb-4 w-0 group-hover:w-12 transition-all duration-500"></div>
                            
                            <h3 className="text-white text-3xl font-heading font-bold uppercase tracking-tight mb-2">
                                {album.title}
                            </h3>
                            <p className="text-white/70 text-sm font-medium mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                {album.subtitle || "Explorar colección completa"}
                            </p>
                            
                            <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-widest">
                                <span>Ver Galería</span>
                                <ArrowLeft className="rotate-180" size={14}/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      ) : (
        
        /* =========================================================
           VISTA 2: DETALLE DEL ÁLBUM
           ========================================================= */
        <div className="animate-in fade-in duration-500">
            
            {/* HEADER CINEMATOGRÁFICO */}
            <div className="relative h-[50vh] w-full overflow-hidden">
                {/* Imagen de fondo fija */}
                <img 
                    src={selectedAlbum.coverUrl} 
                    className="absolute inset-0 w-full h-full object-cover object-center blur-sm scale-105"
                />
                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>

                {/* Contenido Header */}
                <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center">
                    <h1 className="text-5xl md:text-7xl font-heading font-extrabold text-white mb-4 uppercase tracking-tighter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                        {selectedAlbum.title}
                    </h1>
                    {selectedAlbum.subtitle && (
                        <p className="text-xl text-white/80 font-light max-w-2xl mb-8">
                            {selectedAlbum.subtitle}
                        </p>
                    )}
                    
                    <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-xs font-bold uppercase tracking-widest">
                        <GripHorizontal size={14}/>
                        {selectedAlbum.galleryUrls?.length || 0} Fotografías
                    </div>
                </div>

                {/* Botón Regresar */}
                <button 
                    onClick={() => setSelectedAlbum(null)}
                    className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-lg px-4 py-2 rounded-lg transition-all duration-300 border border-white/30 group shadow-lg"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
                    <span className="text-sm font-semibold uppercase tracking-wider">Regresar</span>
                </button>
            </div>

            {/* GRID MASONRY (MOSAICO) */}
            <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 bg-white relative -mt-16 rounded-t-[2rem] z-20 shadow-2xl border-t-4 border-primary/20 min-h-[50vh]">
                
                {(!selectedAlbum.galleryUrls || selectedAlbum.galleryUrls.length === 0) ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                            <GripHorizontal className="text-gray-300" size={40}/>
                        </div>
                        <p className="text-gray-400 text-lg">Esta colección aún se está curando.</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 px-2 pb-12">
                        {selectedAlbum.galleryUrls.map((url, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedImage(url)}
                                className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-zoom-in shadow-md hover:shadow-xl transition-all duration-300 bg-gray-100"
                            >
                                <img 
                                    src={url} 
                                    alt={`Trabajo de ${selectedAlbum.title}`}
                                    className="w-full h-auto block transform transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy" 
                                />
                                
                                {/* Overlay al hacer hover */}
                                <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-90 transition-opacity duration-300 flex items-center justify-center">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <ZoomIn className="text-white w-10 h-10 mx-auto mb-2 drop-shadow-lg" />
                                        <span className="text-white font-bold uppercase tracking-widest text-xs">Ver Detalle</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* SE ELIMINÓ LA SECCIÓN DE "FIN DE LA COLECCIÓN" AQUÍ */}
                
            </div>
        </div>
      )}

      {/* =========================================================
          LIGHTBOX (MODAL PANTALLA COMPLETA)
         ========================================================= */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelectedImage(null)}
        >
            <button className="absolute top-6 right-6 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={32} />
            </button>
            
            <img 
                src={selectedImage} 
                className="max-h-[90vh] max-w-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300 select-none" 
                onClick={(e) => e.stopPropagation()} 
            />
            
            <p className="absolute bottom-6 text-white/50 text-xs uppercase tracking-widest font-bold pointer-events-none">
                Cuervo Rosa Studio
            </p>
        </div>
      )}

    </section>
  );
}