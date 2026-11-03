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
        scada: {
          bg: '#020617',        // slate-950
          panel: '#090d16',     // elevated slate panel
          card: '#0f172a',      // slate-900
          border: '#1e293b',    // slate-800
          accent: '#06b6d4',    // cyan-500
          telemetry: '#22d3ee', // cyan-400
          healthy: '#10b981',   // emerald-500
          warning: '#f59e0b',   // amber-500
          critical: '#e11d48',  // rose-600
          text: '#f8fafc',      // slate-50
          muted: '#94a3b8',     // slate-400
        }
      },
    },
  },
  plugins: [],
}
