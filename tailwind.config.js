/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F5F0',
        ink: '#17201C',
        forest: { DEFAULT: '#2F4A3D', dark: '#22372D' },
        moss: '#71816F',
        sand: { DEFAULT: '#D9C8AE', light: '#EBE1D0' },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        eyebrow: '0.26em',
      },
      keyframes: {
        'hero-in': {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        nudge: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(5px)' },
        },
      },
      animation: {
        'hero-in': 'hero-in 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        nudge: 'nudge 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
