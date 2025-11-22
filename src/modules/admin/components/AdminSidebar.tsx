import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  MessageSquare, 
  Users, 
  Package, 
  Globe, 
  Settings, 
  LogOut, 
  Menu,
  X
} from 'lucide-react';
import { auth } from '../../../firebase/client';
import { signOut, onAuthStateChanged } from 'firebase/auth';

// DEFINICIÓN DE PROPS (Recibimos la ruta desde el servidor Astro)
interface AdminSidebarProps {
  currentPath: string;
}

export default function AdminSidebar({ currentPath }: AdminSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // ESTADO PARA EL USUARIO REAL
  const [userData, setUserData] = useState({
    name: 'Cargando...',
    email: '',
    initial: 'A',
    photoURL: null as string | null
  });

  useEffect(() => {
    // ESCUCHAR AL USUARIO REAL DE FIREBASE
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserData({
          name: currentUser.displayName || "Administrador",
          email: currentUser.email || "",
          initial: currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "A",
          photoURL: currentUser.photoURL
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // FUNCIONALIDAD DE CERRAR SESIÓN (Hard Refresh intencional)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Forzamos recarga completa para limpiar memoria y estado
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const menuItems = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={20} /> },
    { label: 'Agenda & Citas', href: '/admin/agenda', icon: <CalendarDays size={20} /> },
    { label: 'Cotizaciones', href: '/admin/cotizaciones', icon: <MessageSquare size={20} /> },
    { label: 'Clientes', href: '/admin/clientes', icon: <Users size={20} /> },
    { label: 'Inventario', href: '/admin/inventario', icon: <Package size={20} /> },
    { label: 'Sitio Web', href: '/admin/cms', icon: <Globe size={20} /> },
    { label: 'Configuración', href: '/admin/configuracion', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* --- BOTÓN MÓVIL --- */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-secondary-dark text-white rounded-lg shadow-lg"
      >
        <Menu size={24} />
      </button>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-64 transition-transform duration-300 ease-in-out
        bg-secondary-dark text-white flex flex-col
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* CABECERA */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <span className="font-heading font-bold text-xl tracking-wide text-white">
            Cuervo<span className="text-primary">Panel</span>
          </span>
          <button onClick={() => setIsMobileOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* MENÚ */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <p className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Principal</p>
          
          {menuItems.map((item) => {
            // LÓGICA DE ACTIVACIÓN OPTIMIZADA
            // Compara la ruta que vino del servidor (currentPath) con el href del item
            const isActive = currentPath === item.href || (item.href !== '/admin' && currentPath.startsWith(item.href));
            
            return (
              <a 
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary text-white shadow-glow translate-x-1' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-1'}
                `}
              >
                {item.icon}
                {item.label}
              </a>
            );
          })}
        </nav>

        {/* FOOTER: DATOS REALES */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold overflow-hidden border border-white/10">
              {userData.photoURL ? (
                  <img src={userData.photoURL} className="w-full h-full object-cover" />
              ) : (
                  userData.initial
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userData.name}</p>
              <p className="text-[10px] text-gray-400 truncate">{userData.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-400 text-sm transition-colors"
          >
            <LogOut size={16} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* OVERLAY MÓVIL */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
        ></div>
      )}
    </>
  );
}