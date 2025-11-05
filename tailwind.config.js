/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gigmate: {
          blue: '#1e1b6b',
          'blue-light': '#2a2690',
          red: '#d62828',
          'red-dark': '#c21f1f',
        },
      },
    },
  },
  plugins: [],
};
