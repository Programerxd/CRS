// src/modules/auth/RegisterForm.tsx
import { useState } from 'react';
import { registerUser } from './auth.services';

export default function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Validar contraseña mínima
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const result = await registerUser({ name, email, password });

    if (result.success) {
      // Si se registra con éxito, lo mandamos al inicio
      window.location.href = "/";
    } else {
      if (result.error === 'auth/email-already-in-use') {
        setError("Este correo ya está registrado.");
      } else {
        setError("Error al registrarse. Intenta de nuevo.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-8">
        <h2 className="font-heading text-3xl font-bold text-dark-900">Crear Cuenta</h2>
        <p className="text-dark-600 mt-2">Únete a Cuervo Rosa Studio</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo Nombre */}
        <div>
          <label className="block text-sm font-medium text-dark-900 mb-1">Nombre Completo</label>
          <input 
            name="name" type="text" required placeholder="Juan Pérez"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Campo Email */}
        <div>
          <label className="block text-sm font-medium text-dark-900 mb-1">Correo Electrónico</label>
          <input 
            name="email" type="email" required placeholder="tu@email.com"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>

        {/* Campo Password */}
        <div>
          <label className="block text-sm font-medium text-dark-900 mb-1">Contraseña</label>
          <input 
            name="password" type="password" required placeholder="••••••••"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
            🚨 {error}
          </div>
        )}

        <button 
          type="submit" disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-full transition-colors shadow-lg disabled:opacity-50"
        >
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-dark-600">
        ¿Ya tienes cuenta?{' '}
        <a href="/login" className="text-primary font-bold hover:underline">
          Inicia sesión
        </a>
      </div>
    </div>
  );
}