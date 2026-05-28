/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // enable dark mode via class
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          100: '#f0fdf4',
          200: '#dcfce7',
          300: '#bbf7d0',
          400: '#86efac',
          500: '#4ade80',
          600: '#22c55e',
          700: '#16a34a',
          800: '#15803d',
          900: '#166534',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 10px 40px -10px rgba(0,0,0,0.06)',
        'soft-lg': '0 20px 60px -15px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [],
};
