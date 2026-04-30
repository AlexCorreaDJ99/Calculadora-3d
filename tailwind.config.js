/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7f4',
          100: '#d9ede3',
          200: '#b5dbc9',
          300: '#85c2a8',
          400: '#57a584',
          500: '#388968',
          600: '#2a6e53',
          700: '#235944',
          800: '#1e4737',
          900: '#1a3b2e',
          950: '#0d211a',
        },
        surface: {
          50: '#f8f9fa',
          100: '#f1f3f5',
          200: '#e9ecef',
          300: '#dee2e6',
          400: '#ced4da',
          500: '#adb5bd',
          600: '#868e96',
          700: '#495057',
          800: '#343a40',
          900: '#212529',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
