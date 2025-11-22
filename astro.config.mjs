// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind'; // <--- Importamos la integración clásica

export default defineConfig({
  integrations: [
    react(),
    tailwind() // <--- La activamos aquí
  ],
});