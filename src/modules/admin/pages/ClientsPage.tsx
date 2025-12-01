import { useState, useEffect } from 'react';
import { Search, Mail, Phone, Shield, User, Eye, Calendar } from 'lucide-react';
import { getClients, type ClientRow } from '../services/clients.service';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientRow[]>([]);
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
    const name = (client.displayName || "").toLowerCase();
    const email = (client.email || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-dark-900">Directorio de Clientes</h2>
          <p className="text-dark-600 text-sm">Base de datos unificada (Registros + Agenda).</p>
        </div>
        
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
                type="text"
                placeholder="Buscar cliente..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Origen</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Contacto</th>
                <th className="p-5 text-xs font-bold text-gray-400 uppercase tracking-wider">Actividad</th>
                <th className="p-5 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="p-5" colSpan={5}><div className="h-10 bg-gray-100 rounded w-full"></div></td>
                    </tr>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden ${client.source === 'registro' ? 'bg-secondary-dark text-white' : 'bg-orange-100 text-orange-600'}`}>
                            {client.photoURL ? <img src={client.photoURL} className="w-full h-full object-cover"/> : (client.displayName?.[0] || "U")}
                        </div>
                        <div>
                          <p className="font-bold text-dark-900">{client.displayName}</p>
                          <p className="text-xs text-gray-400 font-mono">ID: {client.uid.slice(0,6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                            client.source === 'registro' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                            {client.source === 'registro' ? <Shield size={12}/> : <Calendar size={12}/>} 
                            {client.source === 'registro' ? 'Cuenta Web' : 'Agenda/Manual'}
                        </span>
                    </td>
                    <td className="p-5">
                        <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400"/> {client.email}</div>
                            {client.phoneNumber && <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400"/> {client.phoneNumber}</div>}
                        </div>
                    </td>
                    <td className="p-5 text-sm">
                         <div className="flex flex-col">
                             <span className="font-bold text-dark-900">{client.totalAppointments || 0} Citas</span>
                             <span className="text-xs text-gray-400">Última: {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString() : 'N/A'}</span>
                         </div>
                    </td>
                    <td className="p-5 text-right">
                        <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                            <Eye size={20} />
                        </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                    <td colSpan={5} className="p-16 text-center text-gray-400">
                        No se encontraron clientes.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}