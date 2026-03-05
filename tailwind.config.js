/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['var(--font-montserrat)', 'sans-serif'],
      },
      colors: {
        sunshine: {
          50: '#f0f5fa',
          100: '#dae6f2',
          200: '#b5cde5',
          300: '#8fb4d8',
          400: '#4d87be',
          500: '#004681',
          600: '#003a6d',
          700: '#002e58',
          800: '#002244',
          900: '#001730',
        },
        gold: {
          50: '#fef9e7',
          100: '#fcefc3',
          200: '#f9df87',
          300: '#f2c94b',
          400: '#ebb420',
          500: '#E5A307',
          600: '#c48b06',
          700: '#a27205',
          800: '#815b04',
          900: '#604303',
        },
      },
    },
  },
  plugins: [],
}
