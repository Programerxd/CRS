import { defineMiddleware } from "astro:middleware";

// Rutas que requieren ser ADMINISTRADOR
const ADMIN_ROUTES = /^\/admin/;

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // 1. ¿El usuario intenta entrar a /admin?
  if (ADMIN_ROUTES.test(url.pathname)) {
    
  }

  return next();
});