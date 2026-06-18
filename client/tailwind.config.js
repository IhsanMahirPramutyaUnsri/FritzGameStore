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
          50: '#fdf8e8',
          100: '#faefc5',
          200: '#f5de8a',
          300: '#edc94f',
          400: '#d4a843',
          500: '#b8892e',
          600: '#9a6d22',
          700: '#7c531b',
          800: '#674319',
          900: '#57381a',
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
