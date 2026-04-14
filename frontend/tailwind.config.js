/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#1E293B',
        primary: '#3B82F6',
        success: '#10B981',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
}
