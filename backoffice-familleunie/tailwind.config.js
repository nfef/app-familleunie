/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Palette officielle Famille Unie (identique à l'app membres) ──
        primary: {
          DEFAULT: '#23347E',
          hover: '#2C3F96',
          dark: '#1A2660',
        },
        secondary: {
          DEFAULT: '#BD89B2',
          hover: '#CA9BC0',
          light: '#EDD9E9',
        },
        bg: {
          DEFAULT: '#F5F4FB',
          card: '#FFFFFF',
          input: '#F0EFF8',
        },
        ink: {
          DEFAULT: '#1A1A2E',
          muted: '#69658F',
          light: '#A09CC0',
        },
        border: {
          DEFAULT: '#E3E1F2',
          strong: '#C6C3E0',
        },
        nav: {
          bg: '#23347E',
          active: '#FFFFFF',
          idle: '#A0AED4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(35,52,126,0.08)',
        'card-hover': '0 6px 24px 0 rgba(35,52,126,0.14)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
