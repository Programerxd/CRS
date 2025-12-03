import { collection, getDocs, query, where, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "../../../firebase/client";
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns";

// --- INTERFACES PARA TIPADO STRICTO ---
export interface DashboardStats {
  appointmentsToday: number;
  monthlyIncome: number;
  totalClients: number;
  lowStockCount: number;
  lowStockItems: string[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const now = new Date();
  
  // 1. CITAS DE HOY
  // Consultamos el rango exacto de 00:00 a 23:59 del día actual
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  
  const qAppts = query(
    collection(db, "appointments"),
    where("date", ">=", Timestamp.fromDate(todayStart)),
    where("date", "<=", Timestamp.fromDate(todayEnd))
  );
  
  // En un sistema real masivo usaríamos contadores distribuidos, 
  // pero para un estudio, contar los documentos es eficiente y preciso.
  const snapAppts = await getDocs(qAppts);
  const appointmentsToday = snapAppts.size;

  // 2. INGRESOS DEL MES (Ventas Tienda + Depósitos Citas)
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // A. Sumar Ventas de Productos
  const qSales = query(
    collection(db, "sales"),
    where("date", ">=", Timestamp.fromDate(monthStart)),
    where("date", "<=", Timestamp.fromDate(monthEnd))
  );
  const snapSales = await getDocs(qSales);
  const incomeSales = snapSales.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
  
  // B. Sumar Depósitos de Citas (Opcional: Si manejas anticipos)
  const qApptsMonth = query(
      collection(db, "appointments"),
      where("createdAt", ">=", Timestamp.fromDate(monthStart)),
      where("createdAt", "<=", Timestamp.fromDate(monthEnd))
  );
  const snapApptsMonth = await getDocs(qApptsMonth);
  // Asumimos que 'depositAmount' es el campo del anticipo
  const incomeDeposits = snapApptsMonth.docs.reduce((acc, doc) => acc + (doc.data().depositAmount || 0), 0);

  const monthlyIncome = incomeSales + incomeDeposits;

  // 3. TOTAL CLIENTES
  // Contamos usuarios con rol 'client'. 
  const qClients = query(collection(db, "users"), where("role", "==", "client"));
  const snapClients = await getDocs(qClients);
  const totalClients = snapClients.size;

  // 4. ALERTAS DE STOCK (Lógica de Negocio)
  // Obtenemos todo el inventario para filtrar en memoria (más rápido para catálogos < 1000 items)
  const qStock = query(collection(db, "inventory")); 
  const snapStock = await getDocs(qStock);
  
  let lowStockCount = 0;
  const lowStockItems: string[] = [];
  
  snapStock.forEach(doc => {
      const data = doc.data();
      // Regla de negocio: Si el stock actual es menor o igual al mínimo definido
      if (data.currentStock <= data.minStock) {
          lowStockCount++;
          // Guardamos los nombres de los primeros 3 para mostrar en el widget
          if (lowStockItems.length < 3) lowStockItems.push(data.name);
      }
  });

  return {
    appointmentsToday,
    monthlyIncome,
    totalClients,
    lowStockCount,
    lowStockItems
  };
};

// --- OBTENER AGENDA RECIENTE ---
export const getRecentAppointments = async () => {
    const now = new Date();
    // Traemos citas desde el inicio del día de hoy en adelante, ordenadas por hora
    const q = query(
        collection(db, "appointments"),
        where("date", ">=", Timestamp.fromDate(startOfDay(now))),
        orderBy("date", "asc"),
        limit(5) // Solo las próximas 5 para no saturar el dashboard
    );
    
    const snap = await getDocs(q);
    
    return snap.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            clientName: data.clientName,
            serviceType: data.serviceType || 'Servicio General',
            date: data.date.toDate(), // Convertimos Timestamp a Date nativo
            status: data.status,
            artistName: data.artistName || 'Sin asignar'
        };
    });
};