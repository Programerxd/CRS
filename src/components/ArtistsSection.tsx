import { useState, useEffect } from 'react';
import { Instagram, Facebook, MessageCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { getArtists, getAlbums } from '../modules/admin/services/cms.service';
import type { Artist, PortfolioAlbum } from '../types/db';

export default function ArtistsSection() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
        const [artistsData, albumsData] = await Promise.all([
            getArtists(),
            getAlbums()
        ]);
        setArtists(artistsData);
        setAlbums(albumsData);
        setLoading(false);
    }
    load();
  }, []);

  const getPortfolioLink = (albumId?: string) => {
      if (!albumId) return null;
      return `/portafolio`; // O la lógica específica de navegación
  };

  if (loading) return (
    <div className="bg-secondary-dark min-h-[60vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="animate-spin text-primary" size={40}/>
        <p className="text-white/50 text-xs uppercase tracking-widest font-bold">Cargando Talento...</p>
    </div>
  );

  return (
    <section className="bg-secondary-dark py-24 md:py-32 relative overflow-hidden">
      
      {/* Elemento decorativo de fondo (Glow sutil) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- HEADER DE SECCIÓN --- */}
        <div className="text-center mb-32 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-6">
                <Sparkles size={14} className="text-primary" />
                <span className="text-white/90 text-[10px] font-bold uppercase tracking-widest">
                    Talento de Clase Mundial
                </span>
            </div>
            <h2 className="text-5xl md:text-7xl font-heading font-black text-white mb-6 uppercase tracking-tighter leading-none">
                Maestros de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-400">Tinta</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                No solo hacemos tatuajes, creamos piezas de arte. Conoce a los especialistas detrás de cada trazo.
            </p>
        </div>

        {/* --- LISTA DE ARTISTAS --- */}
        <div className="flex flex-col gap-40">
          {artists.map((artist, index) => {
            const isReversed = index % 2 !== 0;
            
            return (
              <div key={artist.id} className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 lg:gap-32 group`}>
                
                {/* COLUMNA IMAGEN (Premium Look) */}
                <div className="w-full lg:w-1/2 relative">
                    {/* Elemento decorativo detrás de la foto */}
                    <div className={`absolute top-10 ${isReversed ? '-left-10' : '-right-10'} w-full h-full border-2 border-primary/20 rounded-[2rem] z-0 transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-2`}></div>
                    
                    <div className="relative h-[500px] lg:h-[600px] w-full rounded-[2rem] overflow-hidden shadow-2xl z-10 bg-gray-800">
                        <img 
                            src={artist.photoUrl || 'https://via.placeholder.com/600x800?text=Artista'} 
                            alt={artist.name}
                            className="w-full h-full object-cover object-top filter grayscale transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-105"
                        />
                        {/* Overlay Gradiente Sutil */}
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary-dark/80 via-transparent to-transparent opacity-60"></div>
                    </div>
                </div>

                {/* COLUMNA TEXTO */}
                <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                  
                  <div className="space-y-2">
                    <h3 className="text-5xl md:text-6xl font-heading font-black text-white uppercase tracking-tighter leading-none">
                      {artist.name}
                    </h3>
                    <p className="text-xl text-primary font-bold tracking-[0.2em] uppercase">
                      {artist.specialty}
                    </p>
                  </div>

                  <div className={`w-16 h-1 bg-white/20 mx-auto lg:mx-0`}></div>

                  <p className="text-gray-300 text-lg leading-loose font-light max-w-lg mx-auto lg:mx-0">
                    {artist.bio}
                  </p>

                  {/* Redes Sociales (Minimalistas) */}
                  <div className="flex items-center justify-center lg:justify-start gap-4 pt-4">
                    {artist.instagramUrl && (
                        <a href={artist.instagramUrl} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-dark-900 transition-all duration-300">
                            <Instagram size={20} />
                        </a>
                    )}
                    {artist.facebookUrl && (
                        <a href={artist.facebookUrl} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-dark-900 transition-all duration-300">
                            <Facebook size={20} />
                        </a>
                    )}
                    {artist.whatsappNumber && (
                        <a href={`https://wa.me/${artist.whatsappNumber}`} target="_blank" className="w-12 h-12 flex items-center justify-center rounded-full border border-white/20 text-white hover:bg-white hover:text-dark-900 transition-all duration-300">
                            <MessageCircle size={20} />
                        </a>
                    )}
                  </div>

                  {/* Botón Portafolio (Call to Action) */}
                  {artist.portfolioAlbumId && (
                    <div className="pt-8">
                        <a 
                            href={getPortfolioLink(artist.portfolioAlbumId)!} 
                            className="inline-flex items-center gap-4 group/btn cursor-pointer"
                        >
                            <div className="h-14 px-8 bg-primary flex items-center justify-center rounded-full font-bold text-white tracking-widest text-sm uppercase hover:bg-primary-hover transition-colors shadow-[0_0_20px_rgba(209,16,90,0.4)]">
                                Ver Portafolio
                            </div>
                            <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white group-hover/btn:bg-white group-hover/btn:text-dark-900 transition-all duration-300">
                                <ArrowRight size={20} className="group-hover/btn:-rotate-45 transition-transform duration-300"/>
                            </div>
                        </a>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}