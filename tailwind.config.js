/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // COLOR PRINCIPAL (El Rosa Magenta de la marca)
        // Ajustado basado en el botón "Agendar Cita" y el texto "Piel" / "Aguja"
        primary: {
          DEFAULT: '#D1105A', // Magenta profundo (Más fiel a las fotos)
          hover: '#A80C48',   // Un tono más oscuro para hover
          light: '#F85D98',   // Para brillos o fondos suaves
          /****************************************************
           * USO: bg-primary text-white (Botones)
           * USO: text-primary (Palabras destacadas)
           ****************************************************/
        },
        
        // COLOR SECUNDARIO (Los Morados Oscuros)
        // Basado en el fondo de la sección "Tu Próximo Proyecto Comienza Aquí"
        secondary: {
          DEFAULT: '#5B2468', // Morado medio
          dark: '#1A0520',    // El fondo CASI negro/morado de la sección de contacto/CTA
          light: '#9D4EDD',   // Morado más brillante para detalles
          /****************************************************
           * USO: bg-secondary-dark (Para secciones oscuras de fondo)
           ****************************************************/
        },

        // NEUTROS (Textos)
        dark: {
          900: '#111827', // Títulos en negro (Sección "Tatuajes", "Artistas")
          600: '#4B5563', // Texto de párrafo gris
          100: '#F3F4F6', // Fondos gris muy claro
        }
      },
      
      fontFamily: {
        // Las capturas muestran una fuente geométrica para títulos (parece Montserrat)
        heading: ['Montserrat', 'sans-serif'], 
        // Y una fuente limpia para lectura (parece Open Sans o Inter)
        body: ['Inter', 'sans-serif'],
      },
      
      backgroundImage: {
        // El degradado sutil para botones o fondos especiales
        'pink-gradient': 'linear-gradient(135deg, #D1105A 0%, #B00D4B 100%)',
        // El fondo oscuro con textura punteada (si quisieras replicarlo con CSS)
        'dark-overlay': 'linear-gradient(to bottom, rgba(26, 5, 32, 0.95), rgba(26, 5, 32, 0.95))',
      },
      
      boxShadow: {
        // Ese brillo rosado detrás de los iconos en "Por Qué Elegirnos"
        'glow': '0 0 20px rgba(209, 16, 90, 0.35)',
      }
    },
  },
  plugins: [],
}