import { useState, useEffect } from 'react';
import { loginUser } from '../../auth/auth.services';
import { AlertTriangle, Lock, UserCheck } from 'lucide-react';

export default function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para el bloqueo
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // 1. AL CARGAR: Checar si está bloqueado
  useEffect(() => {
    const storedAttempts = localStorage.getItem('admin_attempts');
    const blockTime = localStorage.getItem('admin_block_until');

    if (storedAttempts) setAttempts(parseInt(storedAttempts));

    if (blockTime) {
      const remaining = Math.ceil((parseInt(blockTime) - Date.now()) / 1000);
      if (remaining > 0) {
        setIsBlocked(true);
        setTimeLeft(remaining);
      } else {
        // Ya pasó el tiempo, limpiar bloqueo
        clearBlock();
      }
    }
  }, []);

  // 2. CONTADOR REGRESIVO (Si está bloqueado)
  useEffect(() => {
    if (!isBlocked) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearBlock();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked]);

  const clearBlock = () => {
    setIsBlocked(false);
    setAttempts(0);
    localStorage.removeItem('admin_block_until');
    localStorage.removeItem('admin_attempts');
    setError('');
  };

  const handleBlock = () => {
    const blockUntil = Date.now() + 60000; // 1 minuto desde ahora
    localStorage.setItem('admin_block_until', blockUntil.toString());
    setIsBlocked(true);
    setTimeLeft(60);
    setError("Has excedido los intentos. Bloqueado por seguridad.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    setLoading(true);
    setError('');

    // Intentamos loguear
    const result = await loginUser({ email, password });

    if (result.success) {
      // Si es éxito, limpiamos contadores
      clearBlock();
      // La redirección o recarga la manejará el componente padre (AdminGuard)
      window.location.reload(); 
    } else {
      // Si falla, aumentamos intentos
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('admin_attempts', newAttempts.toString());

      if (newAttempts >= 5) {
        handleBlock();
      } else {
        setError(`Credenciales incorrectas. Intentos restantes: ${5 - newAttempts}`);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-dark px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Cabecera Roja/Oscura */}
        <div className="bg-gray-900 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4 border-2 border-red-500/50">
            <Lock className="text-red-500 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white">Acceso Administrativo</h2>
          <p className="text-gray-400 text-sm mt-2">Área restringida. Se monitorean los accesos.</p>
        </div>

        <div className="p-8">
          {/* MENSAJE DE BLOQUEO */}
          {isBlocked ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-6 animate-pulse">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-600 w-6 h-6" />
                <div>
                  <h3 className="text-red-800 font-bold">Acceso Bloqueado</h3>
                  <p className="text-red-600 text-sm">Intenta de nuevo en <span className="font-mono font-bold text-lg">{timeLeft}</span> segundos.</p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-200 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Correo Corporativo</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
                  placeholder="admin@cuervorosa.studio"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 outline-none"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <button 
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-lg disabled:opacity-70"
              >
                {loading ? 'Verificando...' : 'Entrar al Panel'}
              </button>
            </form>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <a href="/" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
            ← Volver al Sitio Web
          </a>
        </div>
      </div>
    </div>
  );
}