import { useState } from 'react';
import { loginUser, loginWithGoogle } from './auth.services';

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manejador genérico para Login con Correo
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await loginUser({ email, password });
    handleResult(result);
  };

  // Manejador para Google
  const handleGoogleLogin = async () => {
    const result = await loginWithGoogle();
    handleResult(result);
  };

  // Lógica común de redirección o error
  const handleResult = (result: any) => {
    if (result.success) {
      window.location.href = "/";
    } else {
      setLoading(false);
      if (result.error === 'auth/account-exists-with-different-credential') {
        setError("Ya existe una cuenta con este email usando otro método.");
      } else if (result.error === 'auth/popup-closed-by-user') {
        setError("Inicio de sesión cancelado.");
      } else {
        setError("Error al iniciar sesión. Verifica tus datos.");
      }
    }
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-dark-900">Bienvenido</h2>
        <p className="text-dark-600 mt-2">Inicia sesión para gestionar tus citas</p>
      </div>

      {/* --- BOTÓN GOOGLE ÚNICO --- */}
      <div className="space-y-3 mb-6">
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-dark-900 font-bold py-3 rounded-full transition-all shadow-sm"
        >
          {/* Icono Oficial de Google SVG */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>
      </div>

      {/* --- DIVISOR --- */}
      <div className="relative flex py-2 items-center mb-6">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest">O con correo</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-dark-900 mb-1">Correo Electrónico</label>
          <input 
            name="email" type="email" required placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-900 mb-1">Contraseña</label>
          <input 
            name="password" type="password" required placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            🚨 {error}
          </div>
        )}

        <button 
          type="submit" disabled={loading}
          className="w-full bg-dark-900 hover:bg-primary text-white font-bold py-3 rounded-full transition-colors shadow-lg disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Iniciar Sesión'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-dark-600">
        ¿No tienes cuenta?{' '}
        <a href="/registro" className="text-primary font-bold hover:underline">
          Regístrate aquí
        </a>
      </div>
    </div>
  );
}