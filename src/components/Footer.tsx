import { useState, useEffect } from 'react';
import { Facebook, Instagram, MapPin, Phone, Mail, Clock } from 'lucide-react';
import { getSettings, type SystemSettings } from '../modules/admin/services/config.service';

export default function Footer() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Cargar la configuración global al montar el componente
  useEffect(() => {
    const loadConfig = async () => {
        const data = await getSettings();
        setSettings(data);
    };
    loadConfig();
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* COLUMNA 1: MARCA */}
          <div className="col-span-1 md:col-span-1">
            <span className="font-heading font-extrabold text-xl text-primary mb-4 block">
                {settings?.studioName || "Cuervo Rosa Studio"}
            </span>
            <p className="text-sm text-gray-500 leading-relaxed">
              Arte corporal seguro y personalizado. Transformamos ideas en arte con los más altos estándares de higiene.
            </p>
          </div>

          {/* COLUMNA 2: NAVEGACIÓN */}
          <div>
            <h3 className="font-heading font-bold text-dark-900 mb-4 uppercase text-sm">Navegación</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="/" className="hover:text-primary transition-colors text-gray-600">Inicio</a></li>
              <li><a href="/portafolio" className="hover:text-primary transition-colors text-gray-600">Portafolio</a></li>
              <li><a href="/servicios" className="hover:text-primary transition-colors text-gray-600">Servicios</a></li>
              <li><a href="/artistas" className="hover:text-primary transition-colors text-gray-600">Artistas</a></li>
            </ul>
          </div>

          {/* COLUMNA 3: CONTACTO DINÁMICO */}
          <div>
            <h3 className="font-heading font-bold text-dark-900 mb-4 uppercase text-sm">Contacto</h3>
            <ul className="space-y-3 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary flex-shrink-0 mt-0.5"/>
                  <span>{settings?.address || "Ubicación no definida"}</span>
              </li>
              <li className="flex items-center gap-2">
                  <Phone size={16} className="text-primary flex-shrink-0"/>
                  <span>{settings?.contactPhone || "Sin teléfono"}</span>
              </li>
              <li className="flex items-center gap-2">
                  <Mail size={16} className="text-primary flex-shrink-0"/>
                  <span>{settings?.contactEmail || "info@cuervorosa.studio"}</span>
              </li>
              <li className="flex items-center gap-2">
                  <Clock size={16} className="text-primary flex-shrink-0"/>
                  <span>{settings?.schedule || "Horario pendiente"}</span>
              </li>
            </ul>
          </div>

           {/* COLUMNA 4: REDES SOCIALES DINÁMICAS */}
           <div>
            <h3 className="font-heading font-bold text-dark-900 mb-4 uppercase text-sm">Conéctate</h3>
            <p className="text-sm text-gray-500 mb-4">Síguenos en nuestras redes</p>
            <div className="flex space-x-4">
              {settings?.instagramUrl && (
                  <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-dark-900 hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    <Instagram size={20}/>
                  </a>
              )}
              {settings?.facebookUrl && (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-dark-900 hover:bg-primary hover:text-white transition-colors cursor-pointer">
                    <Facebook size={20}/>
                  </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 text-center">
          <p className="text-xs text-gray-400">
            &copy; {currentYear} {settings?.studioName || "Cuervo Rosa Studio"}. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}