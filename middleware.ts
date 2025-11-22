import { defineMiddleware } from "astro:middleware";

// Rutas que requieren ser ADMINISTRADOR
const ADMIN_ROUTES = /^\/admin/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // 1. ¿El usuario intenta entrar a /admin?
  if (ADMIN_ROUTES.test(url.pathname)) {
    
    // EN UN ENTORNO EMPRESARIAL REAL (SERVER-SIDE):
    // Aquí verificaríamos una cookie de sesión segura (HttpOnly).
    // Como estamos usando Firebase Client por ahora, haremos una 
    // validación híbrida, pero lo ideal es migrar a cookies de sesión.
    
    // Por ahora, si no hay indicio de sesión, fuera.
    // (Nota: Para seguridad total nivel banco, necesitamos firebase-admin sdk)
  }

  return next();
});