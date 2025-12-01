import { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase/client';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { LogOut, X } from 'lucide-react';
import { clearCart } from '../store/cartStore';

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Escuchar estado del usuario
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    clearCart();
    await signOut(auth);
    window.location.href = "/login";
  };

  if (loading) return <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse"></div>;

  // Si NO hay usuario, mostramos botón de Login simple
  if (!user) {
    return (
      <a href="/login" className="text-sm font-bold text-dark-600 hover:text-primary transition-colors font-heading uppercase">
        Login
      </a>
    );
  }

  // Lógica para las iniciales
  const initial = user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase();
  const userName = user.displayName || "Usuario";

  return (
    <div className="relative" ref={menuRef}>
      
      {/* --- TRIGGER (El circulito en el Navbar) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all border-2 overflow-hidden ${
          isOpen ? 'ring-2 ring-primary border-white' : 'border-transparent hover:bg-gray-100'
        } ${user.photoURL ? '' : 'bg-primary text-white'}`}
      >
        {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer" // <--- CLAVE: Para que Google permita cargar la imagen
            />
        ) : (
            initial
        )}
      </button>

      {/* --- POPUP ESTILO GOOGLE --- */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[350px] bg-white rounded-3xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Botón cerrar */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>

          {/* --- CABECERA CENTRADA --- */}
          <div className="flex flex-col items-center pt-8 pb-6 px-6 text-center">
            
            {/* Email pequeño arriba */}
            <p className="text-xs font-medium text-gray-500 mb-4">{user.email}</p>

            {/* Avatar Grande */}
            <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-bold mb-3 ring-4 ring-white shadow-lg relative">
               {user.photoURL ? (
                 <img 
                    src={user.photoURL} 
                    alt="Avatar" 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer" // <--- CLAVE TAMBIÉN AQUÍ
                 />
               ) : (
                 initial
               )}
               {/* Icono de estado */}
               <div className="absolute bottom-0 right-0 bg-white text-dark-900 p-1.5 rounded-full shadow-sm border border-gray-100">
                 <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               </div>
            </div>

            {/* Saludo */}
            <h3 className="text-xl font-heading font-bold text-dark-900 mb-6">
              ¡Hola, {userName.split(' ')[0]}!
            </h3>

            {/* --- BOTÓN "ADMINISTRAR TU CUENTA" --- */}
            <a 
              href="/perfil"
              className="w-full border border-gray-300 rounded-full py-3 px-6 text-sm font-bold text-primary hover:bg-primary/5 transition-colors mb-2 flex items-center justify-center gap-2"
            >
              Administrar tu Cuenta
            </a>
          </div>

          {/* --- SEPARADOR --- */}
          <div className="border-t border-gray-100"></div>

          {/* --- ACCIONES INFERIORES --- */}
          <div className="p-2 bg-gray-50/50">
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl hover:bg-gray-100 text-dark-600 text-sm font-medium transition-colors"
             >
                <LogOut size={18} />
                <span>Cerrar sesión</span>
             </button>
          </div>
          
          {/* Links legales */}
          <div className="py-3 text-center bg-gray-50 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                  Política de Privacidad • Términos de Servicio
              </p>
          </div>

        </div>
      )}
    </div>
  );
}