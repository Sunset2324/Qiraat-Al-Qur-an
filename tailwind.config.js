/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FDFBF7',
          secondary: '#F5F1E8',
        },
        emerald: {
          DEFAULT: '#2D6A4F',
          light: '#52B788',
          dark: '#1B4332',
          muted: '#D8F3DC',
        },
      },
      fontFamily: {
        arabic: ['KFGQPCUthmanicScript-Regular', 'sans-serif'],
        arabicBold: ['Amiri-Bold', 'sans-serif'],
        sans: ['Amiri-Regular', 'sans-serif'],
      },
    },
  },
  plugins: [],
}