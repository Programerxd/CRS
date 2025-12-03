import { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { getServices } from '../modules/admin/services/cms.service';
import type { Service } from '../types/db';

export default function HomeServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getServices();
        // Opcional: Si quieres mostrar solo los primeros 3, usa .slice(0, 3)
        // setServices(data.slice(0, 3)); 
        setServices(data);
      } catch (error) {
        console.error("Error al cargar servicios", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  if (services.length === 0) {
    return <div className="text-center py-10 text-gray-400">No hay servicios disponibles por el momento.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {services.map((service) => (
        <div
          key={service.id}
          className="group bg-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col"
        >
          {/* Imagen del servicio */}
          <div className="h-64 overflow-hidden relative">
            <img
              src={service.imageUrl || "https://via.placeholder.com/400x300"}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Overlay opcional al hacer hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Contenido */}
          <div className="p-8 flex flex-col flex-1">
            <h3 className="text-2xl font-heading font-bold text-dark-900 mb-3">
              {service.title}
            </h3>
            
            {/* Descripción truncada para que no rompa el diseño */}
            <p className="text-dark-600 text-sm mb-6 leading-relaxed line-clamp-3 flex-1">
              {service.mainDescription}
            </p>

            <a 
              href="/servicios" 
              className="inline-flex items-center text-primary font-bold hover:underline mt-auto"
            >
              Ver más <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}