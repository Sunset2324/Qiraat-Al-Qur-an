/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF8F1",
          100: "#F6F1E4",
          200: "#EFE6D2",
          300: "#E7DFC9",
        },
        ink: {
          DEFAULT: "#211D16",
          muted: "#6B6558",
        },
        emerald: {
          50: "#EAF3EE",
          100: "#CFE6DA",
          500: "#2F7A5C",
          600: "#1F5C45",
          700: "#164A38",
          900: "#0E2E22",
        },
        tajweed: {
          madd: "#1F8F6B",
          "madd-bg": "#DFF3E9",
          idgham: "#D9714A",
          "idgham-bg": "#FBE7DE",
          qalqalah: "#3B6FA5",
          "qalqalah-bg": "#E1EDFB",
        },
      },
    },
  },
  plugins: [],
};
