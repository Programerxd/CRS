import { useState, useEffect } from 'react';
import { User, Calendar, HeartPulse, Shield, ChevronRight } from 'lucide-react';
import ProfileForm from '../auth/ProfileForm';
import { auth } from '../../firebase/client';
import { onAuthStateChanged } from 'firebase/auth';

export default function UserProfileLayout() {
    const [activeTab, setActiveTab] = useState<'datos' | 'citas' | 'historial' | 'seguridad'>('datos');
    
    // ESTADO LOCAL: Para guardar los datos del usuario y que React detecte cambios
    const [userData, setUserData] = useState({
        displayName: '',
        email: '',
        photoURL: '',
        initial: 'U'
    });
    const [loading, setLoading] = useState(true);

    // 1. ESCUCHAR CARGA INICIAL Y CAMBIOS DE SESIÓN
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserData({
                    displayName: currentUser.displayName || "Usuario",
                    email: currentUser.email || "",
                    photoURL: currentUser.photoURL || "",
                    initial: currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // 2. ESCUCHAR ACTUALIZACIONES DEL FORMULARIO (El truco para tiempo real)
    useEffect(() => {
        const handleProfileUpdate = () => {
            // Cuando el formulario avise que guardó, recargamos los datos locales
            if (auth.currentUser) {
                auth.currentUser.reload().then(() => {
                    const updatedUser = auth.currentUser;
                    if (updatedUser) {
                        setUserData({
                            displayName: updatedUser.displayName || "Usuario",
                            email: updatedUser.email || "",
                            photoURL: updatedUser.photoURL || "",
                            initial: updatedUser.displayName ? updatedUser.displayName[0].toUpperCase() : "U"
                        });
                    }
                });
            }
        };

        window.addEventListener('profileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
    }, []);

    if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
            
            {/* --- SIDEBAR PREMIUM --- */}
            <aside className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden sticky top-24">
                    
                    {/* Encabezado del Sidebar */}
                    <div className="bg-secondary-dark p-6 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                        
                        <div className="relative z-10">
                            <div className="w-20 h-20 mx-auto bg-white p-1 rounded-full mb-3 shadow-lg">
                                <div className="w-full h-full bg-primary text-white rounded-full flex items-center justify-center font-heading font-bold text-3xl">
                                    {userData.photoURL ? (
                                        <img src={userData.photoURL} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                                    ) : userData.initial}
                                </div>
                            </div>
                            {/* AQUÍ SE MUESTRA EL NOMBRE ACTUALIZADO */}
                            <h3 className="text-white font-heading font-bold text-lg">{userData.displayName}</h3>
                            <p className="text-gray-300 text-xs mt-1">{userData.email}</p>
                            
                            <span className="inline-block mt-3 px-3 py-1 bg-primary/20 border border-primary/50 text-primary-light text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-sm">
                                Cliente Verificado
                            </span>
                        </div>
                    </div>

                    {/* Navegación */}
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

                    {/* Footer del Sidebar (YA SIN EL ID VISIBLE) */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400">Cuervo Rosa Studio © 2025</p>
                    </div>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main className="flex-1">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10 h-full">
                    {activeTab === 'datos' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-end mb-8 border-b border-gray-100 pb-6">
                                <div>
                                    <h2 className="text-2xl font-heading font-bold text-dark-900">Datos Personales</h2>
                                    <p className="text-dark-600 mt-1 text-sm">Administra tu información pública y privada.</p>
                                </div>
                            </div>
                            <ProfileForm />
                        </div>
                    )}

                    {/* Otros Tabs... */}
                    {activeTab === 'citas' && (
                        <div className="text-center py-20">
                            <Calendar className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400">Módulo de Citas en Construcción</h3>
                        </div>
                    )}
                     {activeTab === 'historial' && (
                        <div className="text-center py-20">
                            <HeartPulse className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400">Historial Médico en Construcción</h3>
                        </div>
                    )}
                    {activeTab === 'seguridad' && (
                        <div className="text-center py-20">
                            <Shield className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                            <h3 className="text-lg font-bold text-gray-400">Seguridad en Construcción</h3>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function SidebarItem({ icon, label, description, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all group ${
                active 
                ? 'bg-primary/5 border-primary/20 shadow-sm' 
                : 'hover:bg-gray-50 border-transparent'
            } border`}
        >
            <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500 group-hover:text-dark-900'}`}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className={`text-sm font-bold ${active ? 'text-primary' : 'text-dark-900'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{description}</p>
                </div>
            </div>
            {active && <ChevronRight size={16} className="text-primary" />}
        </button>
    );
}