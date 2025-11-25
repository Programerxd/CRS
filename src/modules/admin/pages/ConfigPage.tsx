import { useState, useEffect } from 'react';
import { Save, Settings, Users, Search, ShieldCheck, ShieldAlert, Smartphone, MapPin, Globe } from 'lucide-react';
import { getSettings, saveSettings, findUserByEmail, updateUserRole, type SystemSettings } from '../services/config.service';
import type { UserProfile } from '../../../types/db';

export default function ConfigPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Estado Configuración
  const [settings, setSettings] = useState<SystemSettings>({
    studioName: 'Cuervo Rosa Studio',
    contactPhone: '',
    address: '',
    instagramUrl: '',
    facebookUrl: '',
    depositAmount: 500,
    // --- AGREGA ESTOS CAMPOS QUE FALTABAN ---
    contactEmail: '', 
    schedule: '',
    googleMapsUrl: ''
  });

  // Estado Gestión de Equipo
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

  // --- HANDLER GUARDAR GENERAL ---
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await saveSettings(settings);
    if (res.success) setMsg({ type: 'success', text: 'Configuración guardada correctamente' });
    else setMsg({ type: 'error', text: 'Error al guardar' });
    setLoading(false);
    setTimeout(() => setMsg(null), 3000);
  };

  // --- HANDLER BUSCAR USUARIO ---
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const user = await findUserByEmail(searchEmail);
    setFoundUser(user);
    if (!user) setMsg({ type: 'error', text: 'Usuario no encontrado' });
    setLoading(false);
    setTimeout(() => setMsg(null), 3000);
  };

  // --- HANDLER CAMBIAR ROL ---
  const handleChangeRole = async (uid: string, newRole: 'admin' | 'artist' | 'client') => {
    if(!confirm(`¿Estás seguro de cambiar el rol a ${newRole.toUpperCase()}?`)) return;
    
    await updateUserRole(uid, newRole);
    setMsg({ type: 'success', text: 'Rol actualizado exitosamente' });
    setFoundUser(prev => prev ? ({...prev, role: newRole}) : null);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-heading font-bold text-dark-900">Configuración del Sistema</h2>
            <p className="text-dark-600 text-sm">Administra la información global y los accesos.</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('general')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <Settings size={18} /> General
        </button>
        <button onClick={() => setActiveTab('team')} className={`px-6 py-3 text-sm font-bold flex gap-2 border-b-2 transition-colors ${activeTab === 'team' ? 'border-primary text-primary' : 'border-transparent text-gray-500'}`}>
            <Users size={18} /> Equipo y Permisos
        </button>
      </div>

      {/* MENSAJES FLOTANTES */}
      {msg && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className="font-bold">{msg.text}</span>
        </div>
      )}

      {/* --- TAB 1: GENERAL --- */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="max-w-4xl bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-8">
            
            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <Settings size={18} className="text-primary"/> Información del Estudio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Estudio</label>
                        <input required value={settings.studioName} onChange={e => setSettings({...settings, studioName: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dirección Física</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                            <input value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full pl-10 p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: DATOS DE CONTACTO PÚBLICO */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <Smartphone size={18} className="text-primary"/> Contacto y Horarios
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">WhatsApp / Teléfono</label>
                        <input required value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" placeholder="5299..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email de Contacto</label>
                        <input required value={settings.contactEmail || ''} onChange={e => setSettings({...settings, contactEmail: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" placeholder="hola@estudio.com" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Horario de Atención</label>
                        <input value={settings.schedule || ''} onChange={e => setSettings({...settings, schedule: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" placeholder="Lun-Vie: 10am - 8pm" />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: MAPA Y REDES */}
            <div>
                <h3 className="font-bold text-lg text-dark-900 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                    <Globe size={18} className="text-primary"/> Mapa y Redes
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Google Maps Embed URL (src)</label>
                        <input value={settings.googleMapsUrl || ''} onChange={e => setSettings({...settings, googleMapsUrl: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20 text-xs font-mono text-gray-500" placeholder="https://www.google.com/maps/embed?..." />
                        <p className="text-[10px] text-gray-400 mt-1">Ve a Google Maps {'>'} Compartir {'>'} Insertar un mapa {'>'} Copia solo lo que está dentro de src="..."</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instagram URL</label>
                            <input value={settings.instagramUrl} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Facebook URL</label>
                            <input value={settings.facebookUrl} onChange={e => setSettings({...settings, facebookUrl: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button disabled={loading} className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-hover transition-all shadow-lg">
                    <Save size={20} /> Guardar Cambios
                </button>
            </div>
        </form>
      )}

      {/* --- TAB 2: EQUIPO --- */}
      {activeTab === 'team' && (
        <div className="max-w-3xl space-y-6">
            {/* Buscador */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4">Gestionar Roles</h3>
                <p className="text-sm text-gray-500 mb-4">Busca un usuario registrado por su correo para cambiarle el rol.</p>
                
                <form onSubmit={handleSearchUser} className="flex gap-2">
                    <input 
                        type="email" 
                        required 
                        placeholder="correo@usuario.com" 
                        className="flex-1 p-3 border rounded-lg"
                        value={searchEmail}
                        onChange={e => setSearchEmail(e.target.value)}
                    />
                    <button disabled={loading} className="bg-dark-900 text-white px-6 rounded-lg font-bold hover:bg-black">
                        {loading ? '...' : <Search size={20} />}
                    </button>
                </form>
            </div>

            {/* Resultado de Búsqueda */}
            {foundUser && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-primary/20 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500">
                            {foundUser.displayName?.[0]}
                        </div>
                        <div>
                            <h4 className="font-bold text-xl text-dark-900">{foundUser.displayName}</h4>
                            <p className="text-gray-500">{foundUser.email}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase mt-1 inline-block ${
                                foundUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                foundUser.role === 'artist' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                                Rol Actual: {foundUser.role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-6">
                        <button 
                            onClick={() => handleChangeRole(foundUser.uid, 'client')}
                            className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'client' ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-50'}`}
                        >
                            <Users size={20}/> Cliente
                        </button>
                        <button 
                            onClick={() => handleChangeRole(foundUser.uid, 'artist')}
                            className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'artist' ? 'bg-pink-50 border-pink-200 text-pink-700' : 'hover:bg-pink-50 hover:text-pink-600'}`}
                        >
                            <ShieldCheck size={20}/> Artista
                        </button>
                        <button 
                            onClick={() => handleChangeRole(foundUser.uid, 'admin')}
                            className={`p-3 rounded-lg border text-sm font-bold flex flex-col items-center gap-2 transition-all ${foundUser.role === 'admin' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:bg-purple-50 hover:text-purple-600'}`}
                        >
                            <ShieldAlert size={20}/> Admin
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}

    </div>
  );
}