/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#D4580A',
        secondary: '#2D7D32',
        background: '#FFF8F0',
        gold: '#F59E0B',
        ink: '#1A1A1A',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
