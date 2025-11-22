import { useState, useEffect } from 'react';
import { auth } from '../../firebase/client';
import { onAuthStateChanged } from 'firebase/auth'; // Lógica corregida
import { updateUserProfile } from './auth.services';

export default function ProfileForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true); // Para evitar el parpadeo blanco
    const [msg, setMsg] = useState('');

    // 1. LÓGICA ROBUSTA: Esperamos a Firebase antes de mostrar nada
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setName(user.displayName || '');
                setEmail(user.email || '');
            }
            setInitializing(false);
        });
        return () => unsubscribe();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        
        const res = await updateUserProfile(name);
        
        if (res.success) {
            setMsg("✅ Perfil actualizado correctamente");
            
            // 2. LÓGICA ROBUSTA: Avisamos al Sidebar que hubo cambios
            window.dispatchEvent(new Event('profileUpdated'));
            
            setTimeout(() => setMsg(''), 3000);
        } else {
            setMsg("❌ Error al actualizar");
        }
        setLoading(false);
    };

    // Skeleton Loader simple mientras carga Firebase
    if (initializing) {
        return <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded-lg"></div>
            <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>;
    }

    // --- DISEÑO ANTERIOR (Vertical y Limpio) ---
    return (
        <form onSubmit={handleUpdate} className="space-y-6 max-w-lg">
            
            {/* Campo: Email (Primero, como en el diseño original) */}
            <div>
                <label className="block text-sm font-bold text-dark-900 mb-2">Correo Electrónico</label>
                <input 
                    disabled 
                    value={email} 
                    className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed" 
                />
                <p className="text-xs text-gray-400 mt-1">El correo no se puede cambiar por seguridad.</p>
            </div>

            {/* Campo: Nombre */}
            <div>
                <label className="block text-sm font-bold text-dark-900 mb-2">Nombre Completo</label>
                <input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all" 
                    placeholder="Tu nombre completo"
                />
            </div>

            {/* Mensaje de Feedback */}
            {msg && (
                <div className={`text-center font-bold p-3 rounded-lg ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {msg}
                </div>
            )}

            {/* Botón (Diseño Original) */}
            <button 
                disabled={loading} 
                className="w-full bg-primary text-white font-bold py-3 rounded-full hover:bg-primary-hover transition-all shadow-md disabled:opacity-70"
            >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
        </form>
    );
}