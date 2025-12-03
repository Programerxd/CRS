import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { getDashboardStats, getRecentAppointments, type DashboardStats } from '../services/dashboard.service';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    appointmentsToday: 0,
    monthlyIncome: 0,
    totalClients: 0,
    lowStockCount: 0,
    lowStockItems: []
  });
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Carga inicial de datos
  useEffect(() => {
    async function load() {
        try {
            // Ejecutamos ambas consultas en paralelo para mayor velocidad
            const [statsData, apptsData] = await Promise.all([
                getDashboardStats(),
                getRecentAppointments()
            ]);
            setStats(statsData);
            setAppointments(apptsData);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setLoading(false);
        }
    }
    load();
  }, []);

  if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        
        {/* --- KPI CARDS (Tarjetas de Indicadores) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Citas Hoy */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Citas Hoy</p>
                        <h3 className="text-3xl font-heading font-bold text-dark-900 mt-2">{stats.appointmentsToday}</h3>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Agenda del día
                </div>
            </div>

            {/* Ingresos */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ingresos Mes</p>
                        <h3 className="text-3xl font-heading font-bold text-dark-900 mt-2">
                            ${stats.monthlyIncome.toLocaleString('es-MX')}
                        </h3>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600">
                    <TrendingUp size={14}/> 
                    <span className="text-gray-400 font-medium">Acumulado actual</span>
                </div>
            </div>

            {/* Clientes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Clientes</p>
                        <h3 className="text-3xl font-heading font-bold text-dark-900 mt-2">{stats.totalClients}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-4 text-xs font-medium text-gray-400">
                    Base de datos total
                </div>
            </div>

            {/* Alertas Stock */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border relative overflow-hidden transition-shadow hover:shadow-md ${stats.lowStockCount > 0 ? 'border-red-100' : 'border-gray-100'}`}>
                {/* Decoración de fondo si hay alerta */}
                {stats.lowStockCount > 0 && <div className="absolute right-0 top-0 w-20 h-20 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>}
                
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${stats.lowStockCount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            Alertas Stock
                        </p>
                        <h3 className="text-3xl font-heading font-bold text-dark-900 mt-2">{stats.lowStockCount}</h3>
                    </div>
                    <div className={`p-3 rounded-xl ${stats.lowStockCount > 0 ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>
                <div className="mt-4">
                    {stats.lowStockItems.length > 0 ? (
                        <p className="text-xs text-red-500 font-bold truncate">
                            Bajo: <span className="font-medium text-gray-500">{stats.lowStockItems.join(', ')}...</span>
                        </p>
                    ) : (
                        <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                            Todo en orden
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* --- PRÓXIMAS CITAS (Tabla de Actividad) --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <h3 className="font-heading font-bold text-lg text-dark-900">Agenda Inminente</h3>
                <a href="/admin/agenda" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-colors">
                    Ver Calendario <ArrowRight size={14}/>
                </a>
            </div>
            
            <div className="p-2">
                {appointments.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay citas programadas para hoy.</p>
                        <a href="/admin/agenda" className="text-primary font-bold text-sm mt-2 inline-block hover:underline">Agendar una manualmente</a>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-gray-400 border-b border-gray-50">
                                    <th className="px-6 py-4 font-bold uppercase">Horario</th>
                                    <th className="px-6 py-4 font-bold uppercase">Cliente</th>
                                    <th className="px-6 py-4 font-bold uppercase">Servicio</th>
                                    <th className="px-6 py-4 font-bold uppercase">Artista</th>
                                    <th className="px-6 py-4 font-bold uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {appointments.map((appt) => (
                                    <tr key={appt.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                                        <td className="px-6 py-4 font-bold text-dark-900 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-heading">{format(appt.date, 'HH:mm')}</span>
                                                <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                                                    {format(appt.date, 'dd MMM', { locale: es })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-700 block">{appt.clientName}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                                                {appt.serviceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                    {appt.artistName[0]}
                                                </div>
                                                <span className="text-sm">{appt.artistName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                appt.status === 'confirmada' ? 'bg-green-50 text-green-700 border-green-100' :
                                                appt.status === 'pendiente' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                'bg-gray-50 text-gray-600 border-gray-100'
                                            }`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                    appt.status === 'confirmada' ? 'bg-green-500' :
                                                    appt.status === 'pendiente' ? 'bg-yellow-500' : 'bg-gray-400'
                                                }`}></span>
                                                {appt.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}