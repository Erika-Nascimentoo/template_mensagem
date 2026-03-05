/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7622e2',
        'primary-dark': '#5a1ab0',
        'primary-light': '#F4EEFD',
        'bggrayborder': '#808C97',
        'graycolor': '#808C97',
        'blackcolor': '#252A34',
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
