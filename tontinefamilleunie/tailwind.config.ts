import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Palette officielle Famille Unie ───────────────────────────
        primary: {
          DEFAULT: '#23347E',   // navy blue — bouton principal, nav active
          hover: '#2C3F96',
          dark: '#1A2660',
        },
        secondary: {
          DEFAULT: '#BD89B2',   // mauve rose — highlights, liens
          hover: '#CA9BC0',
          light: '#EDD9E9',   // fond badge secondaire
        },
        // Fond global et surfaces (charte claire)
        bg: {
          DEFAULT: '#F5F4FB',   // fond global — blanc lavande très léger
          card: '#FFFFFF',   // fond carte
          input: '#F0EFF8',   // fond champ de saisie
        },
        // Textes
        ink: {
          DEFAULT: '#1A1A2E',   // texte principal
          muted: '#69658F',   // texte secondaire / labels
          light: '#A09CC0',   // placeholders
        },
        // Bordures
        border: {
          DEFAULT: '#E3E1F2',   // bordure subtile
          strong: '#C6C3E0',   // bordure visible
        },
        // Navigation
        nav: {
          bg: '#23347E',    // fond barre de nav
          active: '#FFFFFF',    // onglet actif (blanc sur navy)
          idle: '#A0AED4',    // onglet inactif
        },
        // Compatibilité code existant
        brand: {
          DEFAULT: '#23347E',
          light: '#BD89B2',
          dark: '#1A2660',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          deep: '#F5F4FB',
          mid: '#F0EFF8',
          muted: '#69658F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        // Auth pages : garder le fond sombre (dark card sur fond clair)
        'auth-gradient': 'linear-gradient(160deg, #1E1F3B 0%, #13142A 55%, #0E0F22 100%)',
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(35,52,126,0.08)',
        'card-hover': '0 6px 24px 0 rgba(35,52,126,0.14)',
        'glow-primary': '0 0 20px 0 rgba(35,52,126,0.30)',
        'glow-card': '0 8px 40px 0 rgba(0,0,0,0.45)',
        'nav': '0 -2px 16px 0 rgba(35,52,126,0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};

export default config;
