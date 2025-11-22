import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Shield, User, MoreVertical, Eye } from 'lucide-react';
import { getClients } from '../services/clients.service';
import type { UserProfile } from '../../../types/db';

export default function ClientsPage() {
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getClients();
    setClients(data);
    setLoading(false);
  };

  const filteredClients = clients.filter(client => {
    // Usamos "|| ''" para asegurarnos de que siempre sea texto, nunca undefined
    const name = (client.displayName || "").toLowerCase();
    const email = (client.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="space-y-6">
      
      {/* --- HEADER & BÚSQUEDA --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Directorio de Clientes</h2>
          <p className="text-dark-600 text-sm">Gestiona la información y accesos de tus usuarios.</p>
        </div>
        
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
                type="text"
                placeholder="Buscar por nombre o correo..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* --- TABLA DE DATOS --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Usuario</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Rol</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Registro</th>
                <th className="p-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                // Skeleton Loading Rows
                [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="p-5"><div className="h-10 bg-gray-100 rounded w-48"></div></td>
                        <td className="p-5"><div className="h-4 bg-gray-100 rounded w-32"></div></td>
                        <td className="p-5"><div className="h-6 bg-gray-100 rounded w-16"></div></td>
                        <td className="p-5"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
                        <td></td>
                    </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.uid} className="hover:bg-gray-50/80 transition-colors group">
                    
                    {/* Columna: Usuario */}
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-dark text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                            {client.photoURL ? (
                                <img src={client.photoURL} className="w-full h-full object-cover"/>
                            ) : (
                                client.displayName?.[0] || "U"
                            )}
                        </div>
                        <div>
                          <p className="font-bold text-dark-900">{client.displayName || "Sin Nombre"}</p>
                          <p className="text-xs text-gray-400 font-mono truncate max-w-[150px]">ID: {client.uid.slice(0,8)}...</p>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Contacto */}
                    <td className="p-5">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail size={14} className="text-gray-400"/> {client.email}
                            </div>
                            {client.phoneNumber && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone size={14} className="text-gray-400"/> {client.phoneNumber}
                                </div>
                            )}
                        </div>
                    </td>

                    {/* Columna: Rol */}
                    <td className="p-5">
                        {client.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                <Shield size={12}/> Admin
                            </span>
                        ) : client.role === 'artist' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">
                                <User size={12}/> Artista
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                Cliente
                            </span>
                        )}
                    </td>

                    {/* Columna: Fecha */}
                    <td className="p-5 text-sm text-gray-500">
                        {/* Manejo seguro de Timestamp de Firebase */}
                        {client.createdAt?.seconds 
                            ? new Date(client.createdAt.seconds * 1000).toLocaleDateString() 
                            : "N/A"}
                    </td>

                    {/* Columna: Acciones */}
                    <td className="p-5 text-right">
                        <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                            <Eye size={20} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                        No se encontraron usuarios con ese criterio.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginación (Placeholder visual) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
            <span>Mostrando {filteredClients.length} usuarios</span>
            <div className="flex gap-2">
                <button disabled className="px-3 py-1 bg-white border rounded opacity-50">Anterior</button>
                <button disabled className="px-3 py-1 bg-white border rounded opacity-50">Siguiente</button>
            </div>
        </div>
      </div>

    </div>
  );
}