/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        navy: {
          50: '#f0f3f9',
          100: '#dae1f0',
          200: '#b9c7e3',
          300: '#8ba5d0',
          400: '#607db8',
          500: '#455fa0',
          600: '#364b85',
          700: '#2e3d6b',
          800: '#1e293b',
          900: '#151c2b',
          950: '#0d1219',
        },
      },
    },
  },
  plugins: [],
};
