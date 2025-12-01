import { useState, useEffect } from 'react';
import { 
  Save, Settings, Users, Search, ShieldCheck, ShieldAlert, 
  Smartphone, MapPin, Globe, Clock, Mail, Check, AlertCircle 
} from 'lucide-react';
import { getSettings, saveSettings, findUserByEmail, updateUserRole, type SystemSettings } from '../services/config.service';
import type { UserProfile } from '../../../types/db';

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // --- ESTADO DE CONFIGURACIÓN ---
  const [settings, setSettings] = useState<SystemSettings>({
    studioName: 'Cuervo Rosa Studio',
    contactPhone: '',
    contactEmail: '',
    address: '',
    schedule: '',
    googleMapsUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    depositAmount: 500
  });

  // --- ESTADO GESTIÓN DE EQUIPO ---
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);

  // Cargar datos al inicio
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getSettings();
    if (data) setSettings(data);
  };

  // --- FUNCIÓN INTELIGENTE PARA EL MAPA ---
  // Detecta si el usuario pegó todo el <iframe> y extrae solo la URL
  const handleMapInput = (value: string) => {
    if (value.includes('<iframe') && value.includes('src="')) {
      const match = value.match(/src="([^"]*)"/);
      if (match && match[1]) {
        return match[1]; // Devuelve solo la URL limpia
      }
    }
    return value; // Si ya era URL, la deja igual
  };

  // --- HANDLER: GUARDAR GENERAL ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveSettings(settings);
    
    if (res.success) {
        setMsg({ type: 'success', text: 'Configuración guardada y publicada.' });
    } else {
        setMsg({ type: 'error', text: 'Error al guardar la configuración.' });
    }
    
    setLoading(false);
    setTimeout(() => setMsg(null), 4000);
  };

  // --- HANDLER: BUSCAR USUARIO ---
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFoundUser(null); // Limpiar anterior
    
    const user = await findUserByEmail(searchEmail);
    
    if (user) {
        setFoundUser(user);
    } else {
        setMsg({ type: 'error', text: 'No se encontró ningún usuario con ese correo.' });
        setTimeout(() => setMsg(null), 3000);
    }
    setLoading(false);
  };

  // --- HANDLER: CAMBIAR ROL ---
  const handleChangeRole = async (uid: string, newRole: 'admin' | 'artist' | 'client') => {
    if(!confirm(`¿Estás seguro de cambiar el rol de este usuario a ${newRole.toUpperCase()}?`)) return;
    
    await updateUserRole(uid, newRole);
    
    setMsg({ type: 'success', text: `Rol actualizado a ${newRole.toUpperCase()} correctamente.` });
    setFoundUser(prev => prev ? ({...prev, role: newRole}) : null); // Actualizar vista local
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-heading font-bold text-dark-900">Configuración del Sistema</h2>
            <p className="text-dark-600 text-sm">Administra la información pública y los accesos de seguridad.</p>
        </div>
      </div>

      {/* TABS DE NAVEGACIÓN */}
      <div className="flex border-b border-gray-200">
        <button 
            onClick={() => setActiveTab('general')} 
            className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Settings size={18} /> General & Contacto
        </button>
        <button 
            onClick={() => setActiveTab('team')} 
            className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
            <Users size={18} /> Equipo y Permisos
        </button>
      </div>

      {/* MENSAJES FLOTANTES (TOAST) */}
      {msg && (
        <div className={`fixed top-24 right-8 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border animate-in slide-in-from-right duration-300 ${msg.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'}`}>
            {msg.type === 'success' ? <Check size={20}/> : <AlertCircle size={20}/>}
            <span className="font-bold text-sm">{msg.text}</span>
        </div>
      )}

      {/* =====================================================================================
          TAB 1: GENERAL (INFORMACIÓN PÚBLICA)
         ===================================================================================== */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-10 animate-in fade-in">
            
            {/* SECCIÓN 1: IDENTIDAD */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                    <Settings size={18} className="text-primary"/> Información del Estudio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Estudio</label>
                        <input required value={settings.studioName} onChange={e => setSettings({...settings, studioName: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Física</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Calle, Número, Ciudad" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CONTACTO */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                    <Smartphone size={18} className="text-primary"/> Contacto y Horarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp (Solo números)</label>
                        <input required type="number" value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="521999..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Público</label>
                        <div className="relative">
                             <Mail className="absolute left-3 top-3 text-gray-400" size={18}/>
                             <input required type="email" value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="info@estudio.com" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horario</label>
                        <div className="relative">
                             <Clock className="absolute left-3 top-3 text-gray-400" size={18}/>
                             <input value={settings.schedule} onChange={e => setSettings({...settings, schedule: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Lun-Vie: 10am - 8pm" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: MAPA Y REDES (CON CORRECCIÓN DE IFRAME) */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-6 flex items-center gap-2">
                    <Globe size={18} className="text-primary"/> Mapa y Redes Sociales
                </h3>
                
                <div className="space-y-6">
                    {/* MAPA INTELIGENTE */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Maps (Embed Link)</label>
                        <input 
                            value={settings.googleMapsUrl} 
                            onChange={e => setSettings({
                                ...settings, 
                                googleMapsUrl: handleMapInput(e.target.value) // <--- AQUÍ SE LIMPIA EL LINK AUTOMÁTICAMENTE
                            })} 
                            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 outline-none text-xs font-mono text-gray-600" 
                            placeholder="Pega aquí el código HTML <iframe> de Google Maps..." 
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">
                            Tip: Ve a Google Maps {'>'} Compartir {'>'} Insertar mapa {'>'} Copiar HTML. Pégalo aquí y nosotros extraemos el link.
                        </p>
                        
                        {/* Preview del Mapa para verificar */}
                        {settings.googleMapsUrl && (
                            <div className="mt-3 h-48 w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-inner">
                                <iframe 
                                    src={settings.googleMapsUrl} 
                                    width="100%" 
                                    height="100%" 
                                    style={{border:0}} 
                                    loading="lazy" 
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram URL</label>
                            <input value={settings.instagramUrl} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://instagram.com/..." />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Facebook URL</label>
                            <input value={settings.facebookUrl} onChange={e => setSettings({...settings, facebookUrl: e.target.value})} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none" placeholder="https://facebook.com/..." />
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER DE ACCIÓN */}
            <div className="flex justify-end pt-6 border-t border-gray-100">
                <button disabled={loading} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5">
                    <Save size={20} /> {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>
        </form>
      )}

      {/* =====================================================================================
          TAB 2: EQUIPO (GESTIÓN DE ROLES)
         ===================================================================================== */}
      {activeTab === 'team' && (
        <div className="max-w-3xl space-y-6 animate-in fade-in">
            
            {/* Panel de Búsqueda */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ShieldCheck size={24}/></div>
                    <div>
                        <h3 className="font-bold text-lg text-dark-900">Gestionar Roles y Permisos</h3>
                        <p className="text-sm text-gray-500">Busca un usuario registrado para promoverlo a Artista o Administrador.</p>
                    </div>
                </div>
                
                <form onSubmit={handleSearchUser} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20}/>
                        <input 
                            type="email" 
                            required 
                            placeholder="correo@usuario.com" 
                            className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                            value={searchEmail}
                            onChange={e => setSearchEmail(e.target.value)}
                        />
                    </div>
                    <button disabled={loading} className="bg-dark-900 text-white px-6 rounded-xl font-bold hover:bg-black transition-colors shadow-lg">
                        {loading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>
            </div>

            {/* Resultado de Búsqueda */}
            {foundUser && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-primary/20 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 overflow-hidden border-2 border-white shadow-sm">
                            {foundUser.photoURL ? <img src={foundUser.photoURL} className="w-full h-full object-cover"/> : foundUser.displayName?.[0]}
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-dark-900">{foundUser.displayName}</h4>
                            <p className="text-gray-500 text-sm">{foundUser.email}</p>
                            <div className="mt-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${
                                    foundUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                    foundUser.role === 'artist' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    Rol Actual: {foundUser.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Asignar Nuevo Rol</p>
                        <div className="grid grid-cols-3 gap-3">
                            <button 
                                onClick={() => handleChangeRole(foundUser.uid, 'client')}
                                className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'client' ? 'bg-gray-50 border-gray-300 opacity-50 cursor-default' : 'hover:bg-gray-50 hover:border-gray-300'}`}
                            >
                                <Users size={20} className="text-gray-500"/> Cliente
                            </button>
                            <button 
                                onClick={() => handleChangeRole(foundUser.uid, 'artist')}
                                className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'artist' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'hover:bg-pink-50 hover:border-pink-200 hover:text-pink-600'}`}
                            >
                                <ShieldCheck size={20}/> Artista
                            </button>
                            <button 
                                onClick={() => handleChangeRole(foundUser.uid, 'admin')}
                                className={`p-4 rounded-xl border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'}`}
                            >
                                <ShieldAlert size={20}/> Admin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

    </div>
  );
}