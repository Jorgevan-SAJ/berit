/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1F3A5F",
        gold: "#D9A441",
        cream: "#FAF6EF",
        graphite: "#2E2E2E",
        gray2: "#8A8A8A",
        bege: "#F4F1EA",
        borda: "#E4DED2",
        green: "#4C8C6E",
        red: "#B71C1C",
        purple: "#6A3FA0",
      },
    },
  },
  plugins: [],
};
