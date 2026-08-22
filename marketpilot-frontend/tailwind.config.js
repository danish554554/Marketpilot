/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#165823',
          'green-dark': '#0d4820',
          'green-light': '#23834b',
          navy: '#101a2d',
          ink: '#17233a',
          muted: '#77849a',
          canvas: '#f5f8f7',
          line: '#e4eae8',
          pale: '#eaf5ee',
          blue: '#2867d7',
          'blue-pale': '#edf3ff',
        }
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 32px rgba(20,34,55,0.07)',
        card: '0 2px 4px rgba(16,26,45,0.02)',
      }
    },
  },
  plugins: [],
}
