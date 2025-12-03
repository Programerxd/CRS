import { useState, useEffect } from 'react';
import { 
  Menu, X, ChevronRight, Phone, LogOut, User as UserIcon, LogIn, ShoppingBag 
} from 'lucide-react';
import { auth } from '../firebase/client';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { clearCart } from '../store/cartStore';
import UserMenu from './UserMenu'; // Versión Desktop
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
  
  // ESTADO DE AUTH LOCAL (Para manejar la UI móvil independientemente)
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuchar autenticación al cargar
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Bloquear scroll al abrir menú
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileOpen]);

  // 3. Función de Logout (Igual que en el UserMenu pero para móvil)
  const handleMobileLogout = async () => {
    await signOut(auth);
    clearCart();
    setIsMobileOpen(false); // Cerramos el menú
    window.location.href = "/login";
  };

  return (
    <>
      <header className={`sticky top-0 z-50 transition-all duration-300 ${isMobileOpen ? 'bg-white' : 'bg-white/90 backdrop-blur-md'} border-b border-gray-100 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* LOGO */}
            <a href="/" className="font-heading font-extrabold text-2xl text-primary tracking-tight z-50 relative">
              Cuervo Rosa Studio
            </a>

            {/* --- NAVEGACIÓN DESKTOP (MD+) --- */}
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

            {/* --- ACCIONES DESKTOP (MD+) --- */}
            <div className="hidden md:flex items-center space-x-4">
              <CartTrigger />
              {/* En escritorio usamos el Dropdown elegante */}
              <UserMenu /> 
              <a href="/agendar" className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all transform hover:scale-105">
                Agendar Cita
              </a>
            </div>

            {/* --- BOTÓN MÓVIL --- */}
            <div className="flex items-center gap-4 md:hidden z-50 relative">
              <CartTrigger />
              <button 
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="text-dark-900 focus:outline-none p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Menú"
              >
                {isMobileOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* --- MENÚ MÓVIL FULLSCREEN (DISEÑO EMPRESARIAL) --- */}
      <div 
        className={`fixed inset-0 bg-white z-40 flex flex-col pt-24 pb-safe px-6 transition-all duration-500 ease-in-out md:hidden overflow-y-auto ${
          isMobileOpen 
            ? 'opacity-100 translate-y-0 visible' 
            : 'opacity-0 -translate-y-5 invisible pointer-events-none'
        }`}
      >
        <div className="flex flex-col min-h-full justify-between pb-8">
          
          {/* 1. Lista de Navegación */}
          <nav className="flex flex-col space-y-1 mb-8">
            {links.map((link, idx) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileOpen(false)}
                style={{ transitionDelay: `${idx * 50}ms` }} 
                className={`flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 group border-b border-gray-50 ${
                   isMobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                }`}
              >
                <span className="text-lg font-heading font-bold text-dark-900 group-hover:text-primary transition-colors">
                  {link.name}
                </span>
                <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" size={20}/>
              </a>
            ))}
          </nav>

          {/* 2. Área de Usuario y Acciones (Lógica Diferenciada) */}
          <div className={`space-y-4 transition-all duration-700 delay-300 ${isMobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
             
             {/* TARJETA DE PERFIL O LOGIN */}
             {!loading && (
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm">
                    {user ? (
                        /* VISTA LOGUEADO: Tarjeta de Perfil Completa */
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-secondary-dark text-white flex items-center justify-center text-xl font-bold overflow-hidden border-2 border-white shadow-md">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        user.displayName?.[0] || "U"
                                    )}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-heading font-bold text-dark-900 text-lg truncate">
                                        {user.displayName || "Usuario"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <a 
                                    href="/perfil" 
                                    onClick={() => setIsMobileOpen(false)}
                                    className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-dark-600 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <UserIcon size={16} /> Mi Perfil
                                </a>
                                <button 
                                    onClick={handleMobileLogout}
                                    className="flex items-center justify-center gap-2 py-3 bg-white border border-red-100 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                >
                                    <LogOut size={16} /> Salir
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* VISTA NO LOGUEADO: Llamada a la acción clara */
                        <div className="flex flex-col gap-3 text-center">
                            <p className="text-sm text-gray-500 mb-1">Inicia sesión para gestionar tus citas</p>
                            <a 
                                href="/login" 
                                onClick={() => setIsMobileOpen(false)}
                                className="w-full bg-dark-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                            >
                                <LogIn size={18} /> Iniciar Sesión
                            </a>
                            <a 
                                href="/registro" 
                                onClick={() => setIsMobileOpen(false)}
                                className="w-full bg-white border border-gray-200 text-dark-900 py-3 rounded-xl font-bold hover:bg-gray-50"
                            >
                                Crear Cuenta
                            </a>
                        </div>
                    )}
                </div>
             )}

             {/* Botón Principal (CTA) */}
             <a 
               href="/agendar" 
               onClick={() => setIsMobileOpen(false)}
               className="block w-full bg-gradient-to-r from-primary to-pink-600 text-white text-center py-4 rounded-xl text-lg font-bold shadow-xl shadow-primary/30 active:scale-95 transition-transform"
             >
                Agendar Cita Ahora
             </a>
          </div>

        </div>
      </div>
    </>
  );
}