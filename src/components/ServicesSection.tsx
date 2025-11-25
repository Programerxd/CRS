import { useState, useEffect } from 'react';
import { Edit3, Shield, CheckCircle, Star, Loader2 } from "lucide-react";
import { getServices } from '../modules/admin/services/cms.service'; // Reusamos el servicio de lectura
import type { Service } from '../types/db';

export default function ServicesSection() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      const data = await getServices();
      setServices(data);
      setLoading(false);
    };
    fetchServices();
  }, []);

  // Helper para iconos dinámicos
  const getIcon = (key: string) => {
    switch(key) {
        case 'edit': return <Edit3 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />;
        case 'shield': return <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />;
        case 'star': return <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />;
        default: return <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />;
    }
  };

  if (loading) return <div className="py-20 text-center flex justify-center"><Loader2 className="animate-spin text-primary" size={40}/></div>;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Sección */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-dark-900 mb-6">
            Arte, Calidad y <span className="text-primary">Seguridad</span>
          </h2>
          <p className="text-lg text-dark-600 max-w-2xl mx-auto leading-relaxed">
            En Cuervo Rosa Studio, tu bienestar es tan importante como la calidad del arte. 
            Utilizamos equipo de vanguardia y seguimos estrictos protocolos.
          </p>
        </div>

        <div className="flex flex-col gap-24 md:gap-32">
          {services.map((service, index) => {
            // Alternar layout: Par = Imagen derecha, Impar = Imagen izquierda
            const isReversed = index % 2 !== 0;

            return (
              <div key={service.id} className={`flex flex-col ${isReversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-20`}>
                
                {/* Texto */}
                <div className="flex-1 space-y-8">
                  <div>
                    <h3 className="text-3xl md:text-4xl font-heading font-bold text-dark-900 mb-6">
                      {service.title}
                    </h3>
                    <p className="text-lg text-dark-600 leading-relaxed">
                      {service.mainDescription}
                    </p>
                  </div>

                  {/* Detalles Dinámicos */}
                  <div className="space-y-6">
                    {service.details.map((detail, idx) => (
                      <div key={idx} className="flex gap-4 items-start group">
                        <div className="p-2 bg-pink-50 rounded-lg group-hover:bg-pink-100 transition-colors">
                            {getIcon(detail.iconKey)}
                        </div>
                        <div>
                           <h4 className="text-lg font-bold text-dark-900 mb-1">
                             {detail.title}
                           </h4>
                           <p className="text-dark-600 text-sm leading-relaxed">
                             {detail.description}
                           </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4">
                    <a href="/agendar" className="inline-block bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-primary/30 transform hover:-translate-y-1">
                      Solicitar Cotización
                    </a>
                  </div>
                </div>

                {/* Imagen */}
                <div className="flex-1 w-full">
                  <div className="relative h-[400px] lg:h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl border border-gray-100 group">
                     <img 
                       src={service.imageUrl} 
                       alt={service.title}
                       className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                     />
                     {/* Overlay sutil */}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}