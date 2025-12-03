import { useState, useEffect, useRef } from 'react';
import { 
  User, Calendar, HeartPulse, Shield, ChevronRight, Camera, 
  Save, Loader2, Mail, Phone, MapPin, LogOut, AlertCircle, CheckCircle
} from 'lucide-react';
import { auth, db } from '../../firebase/client';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { uploadImage } from '../admin/services/upload.service'; // Reutilizamos tu servicio de subida

// --- TIPO DE DATOS DEL PERFIL ---
interface UserData {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  photoURL: string;
  address?: string; // Campo opcional extra
  role?: string;
}

export default function UserProfileLayout() {
    const [activeTab, setActiveTab] = useState<'datos' | 'citas' | 'historial' | 'seguridad'>('datos');
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);

    // Estado del formulario (separado para detectar cambios)
    const [formData, setFormData] = useState({
        displayName: '',
        phoneNumber: '',
        address: ''
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. CARGA DE DATOS (AUTH + FIRESTORE)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // A. Datos básicos de Auth
                    const baseData = {
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || '',
                        email: currentUser.email || '',
                        photoURL: currentUser.photoURL || '',
                        phoneNumber: ''
                    };

                    // B. Datos extendidos de Firestore
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    
                    if (docSnap.exists()) {
                        const firestoreData = docSnap.data();
                        setUser({ ...baseData, ...firestoreData } as UserData);
                        // Inicializar formulario
                        setFormData({
                            displayName: firestoreData.displayName || currentUser.displayName || '',
                            phoneNumber: firestoreData.phoneNumber || '',
                            address: firestoreData.address || ''
                        });
                    } else {
                        setUser(baseData);
                        setFormData({
                            displayName: baseData.displayName,
                            phoneNumber: '',
                            address: ''
                        });
                    }
                } catch (error) {
                    console.error("Error al cargar perfil:", error);
                }
            } else {
                // Si no hay usuario, redirigir (Seguridad básica)
                window.location.href = "/login";
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. MANEJO DE IMAGEN DE PERFIL
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        // Validación de tamaño (Máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'La imagen es muy pesada (Máx 2MB).' });
            return;
        }

        setSaving(true);
        try {
            // A. Subir imagen
            const url = await uploadImage(file, `avatars/${user.uid}`);
            
            if (url) {
                // B. Actualizar Auth
                if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
                
                // C. Actualizar Firestore
                await updateDoc(doc(db, "users", user.uid), { photoURL: url });
                
                // D. Actualizar UI Local
                setUser(prev => prev ? ({ ...prev, photoURL: url }) : null);
                setMessage({ type: 'success', text: 'Foto de perfil actualizada.' });
            }
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Error al subir la imagen.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    // 3. GUARDAR CAMBIOS DE TEXTO
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setMessage(null);

        try {
            // A. Actualizar Auth (Nombre)
            if (auth.currentUser && formData.displayName !== user.displayName) {
                await updateProfile(auth.currentUser, { displayName: formData.displayName });
            }

            // B. Actualizar Firestore (Todo)
            await updateDoc(doc(db, "users", user.uid), {
                displayName: formData.displayName,
                phoneNumber: formData.phoneNumber,
                address: formData.address
            });

            // C. Reflejar en estado local
            setUser(prev => prev ? ({ ...prev, ...formData }) : null);
            setMessage({ type: 'success', text: 'Información guardada correctamente.' });

        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'No se pudieron guardar los cambios.' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
            <p className="text-gray-400 font-medium">Cargando tu perfil...</p>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] animate-in fade-in duration-500">
            
            {/* --- SIDEBAR DE NAVEGACIÓN --- */}
            <aside className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                    
                    {/* Tarjeta de Usuario (Resumen) */}
                    <div className="bg-secondary-dark p-8 text-center relative overflow-hidden group">
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent"></div>
                        
                        <div className="relative z-10 flex flex-col items-center">
                            {/* Avatar con botón de cámara */}
                            <div className="relative mb-4">
                                <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-200 relative">
                                        {user?.photoURL ? (
                                            <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-primary text-white text-3xl font-bold">
                                                {user?.displayName?.[0] || 'U'}
                                            </div>
                                        )}
                                        {/* Overlay al hacer hover */}
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera className="text-white w-8 h-8" />
                                        </div>
                                    </div>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg" 
                                    onChange={handleImageUpload}
                                />
                            </div>

                            <h3 className="text-white font-heading font-bold text-lg">{user?.displayName}</h3>
                            <p className="text-gray-400 text-xs mt-1 font-mono">{user?.email}</p>
                            
                            <div className="mt-3 flex gap-2">
                                <span className="px-3 py-1 bg-white/10 border border-white/20 text-white/80 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    Cliente
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Menú */}
                    <nav className="p-4 space-y-1">
                        <SidebarItem 
                            icon={<User size={18}/>} label="Datos Personales" 
                            description="Información básica y contacto"
                            active={activeTab === 'datos'} onClick={() => setActiveTab('datos')} 
                        />
                        <SidebarItem 
                            icon={<Calendar size={18}/>} label="Mis Citas" 
                            description="Próximas sesiones y agenda"
                            active={activeTab === 'citas'} onClick={() => setActiveTab('citas')} 
                        />
                        <SidebarItem 
                            icon={<HeartPulse size={18}/>} label="Historial & Cuidados" 
                            description="Tatuajes pasados y guías"
                            active={activeTab === 'historial'} onClick={() => setActiveTab('historial')} 
                        />
                         <SidebarItem 
                            icon={<Shield size={18}/>} label="Seguridad" 
                            description="Contraseña y privacidad"
                            active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} 
                        />
                    </nav>

                    {/* === CAMBIO DE DISEÑO: BOTÓN DE CERRAR SESIÓN MEJORADO === */}
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 text-center">
                        <button 
                            onClick={() => auth.signOut()} 
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-100 bg-white text-red-500 font-bold text-xs uppercase tracking-wider hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all shadow-sm group"
                        >
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform duration-300"/> 
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10 h-full relative">
                    
                    {/* Feedback Flotante (Toast) */}
                    {message && (
                        <div className={`absolute top-6 right-6 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-top-2 z-20 ${
                            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                            {message.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                            <span className="text-sm font-bold">{message.text}</span>
                        </div>
                    )}

                    {/* VISTA 1: DATOS PERSONALES */}
                    {activeTab === 'datos' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="border-b border-gray-100 pb-6 mb-8">
                                <h2 className="text-2xl font-heading font-bold text-dark-900">Datos Personales</h2>
                                <p className="text-dark-600 mt-1 text-sm">Mantén tu información actualizada para un mejor contacto.</p>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 text-gray-400" size={18}/>
                                            <input 
                                                type="text" 
                                                required
                                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                value={formData.displayName}
                                                onChange={e => setFormData({...formData, displayName: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 text-gray-400" size={18}/>
                                            <input 
                                                type="tel" 
                                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="Para contactarte"
                                                value={formData.phoneNumber}
                                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                                        <input 
                                            type="email" 
                                            disabled
                                            className="w-full pl-10 p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                                            value={user?.email}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Shield size={10}/> El correo es tu identificador único y no se puede cambiar.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Dirección (Opcional)</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={18}/>
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Ciudad, Estado"
                                            value={formData.address}
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 flex justify-end">
                                    <button 
                                        type="submit" 
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-dark-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* VISTA 2: CITAS (Placeholder Mejorado) */}
                    {activeTab === 'citas' && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in">
                            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6">
                                <Calendar size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-dark-900">Historial de Citas</h3>
                            <p className="text-gray-500 max-w-sm mt-2 mb-6">
                                Aquí podrás ver el estado de tus citas pasadas y futuras una vez que empieces a reservar.
                            </p>
                            <a href="/agendar" className="text-primary font-bold hover:underline">Agendar una nueva cita</a>
                        </div>
                    )}

                    {/* OTROS TABS */}
                    {(activeTab === 'historial' || activeTab === 'seguridad') && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in">
                            <div className="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-6">
                                {activeTab === 'historial' ? <HeartPulse size={40}/> : <Shield size={40}/>}
                            </div>
                            <h3 className="text-xl font-bold text-gray-400">Próximamente</h3>
                            <p className="text-gray-400 text-sm mt-2">Esta sección está en desarrollo.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Componente auxiliar para el Sidebar (Estética Limpia)
function SidebarItem({ icon, label, description, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all group border text-left ${
                active 
                ? 'bg-primary/5 border-primary/20 shadow-sm' 
                : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
            }`}
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:text-dark-900'}`}>
                    {icon}
                </div>
                <div>
                    <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-dark-900'}`}>{label}</p>
                    <p className="text-[10px] text-gray-400 hidden lg:block">{description}</p>
                </div>
            </div>
            {active && <ChevronRight size={16} className="text-primary" />}
        </button>
    );
}