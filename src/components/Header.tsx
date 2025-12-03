import { useState, useEffect } from 'react';
import { Menu, X, ChevronRight, Phone } from 'lucide-react'; // Iconos adicionales para toque pro
import UserMenu from './UserMenu';
import CartTrigger from './CartTrigger';

const links = [
  { name: "Inicio", href: "/" },
  { name: "Productos", href: "/productos" },
  { name: "Servicios", href: "/servicios" },
  { name: "Portafolio", href: "/portafolio" },
  { name: "Artistas", href: "/artistas" },
  { name: "Contacto", href: "/contacto" },
];

export default function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // LÓGICA EMPRESARIAL: Bloquear el scroll del body cuando el menú está abierto
  // Esto evita que el usuario deslice la página de fondo por error.
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileOpen]);

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isMobileOpen ? 'bg-white' : 'bg-white/90 backdrop-blur-md'} border-b border-gray-100 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO */}
            <a href="/" className="font-heading font-extrabold text-2xl text-primary tracking-tight z-50 relative">
              Cuervo Rosa Studio
            </a>

            {/* NAVEGACIÓN DE ESCRITORIO (Hidden en móvil) */}
            <nav className="hidden md:flex space-x-8">
              {links.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm font-medium text-dark-600 hover:text-primary transition-colors font-heading uppercase tracking-wide"
                >
                  {link.name}
                </a>
              ))}
            </nav>

            {/* ACCIONES DE ESCRITORIO */}
            <div className="hidden md:flex items-center space-x-4">
              <CartTrigger />
              <UserMenu />
              <a href="/agendar" className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105">
                Agendar Cita
              </a>
            </div>

            {/* BOTÓN DE MENÚ MÓVIL (HAMBURGUESA) */}
            <div className="flex items-center gap-4 md:hidden z-50 relative">
              <CartTrigger />
              
              <button 
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="text-dark-900 focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Abrir menú"
              >
                {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MENÚ DESPLEGABLE MÓVIL (FULLSCREEN PREMIUM) --- */}
      <div 
        className={`fixed inset-0 bg-white z-40 flex flex-col pt-24 pb-10 px-6 transition-all duration-500 ease-in-out md:hidden ${
          isMobileOpen 
            ? 'opacity-100 translate-y-0 visible' 
            : 'opacity-0 -translate-y-5 invisible pointer-events-none'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          
          {/* Enlaces de Navegación */}
          <nav className="flex flex-col space-y-2">
            {links.map((link, idx) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileOpen(false)}
                // Animación escalonada para cada link (Staggered animation)
                style={{ transitionDelay: `${idx * 50}ms` }} 
                className={`flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 group border-b border-gray-50 ${
                   isMobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
              >
                <span className="text-xl font-heading font-bold text-dark-900 group-hover:text-primary transition-colors">
                  {link.name}
                </span>
                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20}/>
              </a>
            ))}
          </nav>

          {/* Footer del Menú (Acciones Principales) */}
          <div className={`space-y-4 transition-all duration-700 delay-300 ${isMobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             
             {/* Barra de Usuario y Contacto */}
             <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div onClick={() => setIsMobileOpen(false)}>
                   <UserMenu />
                </div>
                <a href="tel:+521234567890" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-primary shadow-sm border border-gray-100">
                   <Phone size={20} />
                </a>
             </div>

             {/* Botón Principal (CTA) */}
             <a 
               href="/agendar" 
               onClick={() => setIsMobileOpen(false)}
               className="block w-full bg-primary text-white text-center py-4 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 active:scale-95 transition-transform"
             >
                Agendar Cita Ahora
             </a>
          </div>

        </div>
      </div>
    </>
  );
}