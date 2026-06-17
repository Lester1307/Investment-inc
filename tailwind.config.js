/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1e3a8a", // BluePrimary
          light: "#3b82f6",
          container: "#eef2f6", // BlueContainer
          onContainer: "#0f172a" // OnBlueContainer
        },
        slateBg: "#f8fafc", // BackgroundSlate
        textDark: "#0f172a", // TextDark
        textGray: "#64748b", // TextGray
        gain: {
          DEFAULT: "#10b981", // GainGreen
          bg: "#ecfdf5"
        },
        loss: {
          DEFAULT: "#ef4444", // LossRed
          bg: "#fef2f2"
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"]
      }
    },
  },
  plugins: [],
}
