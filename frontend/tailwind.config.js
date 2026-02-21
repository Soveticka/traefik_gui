/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          950: '#060a14',
          900: '#0a0f1e',
          800: '#0c1222',
          700: '#111a2e',
          600: '#162038',
          500: '#1a2744',
        },
        accent: {
          teal: '#00d4aa',
          'teal-hover': '#00e8bb',
          cyan: '#0ea5e9',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          red: '#ef4444',
          yellow: '#f59e0b',
          green: '#22c55e',
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px var(--glow-color, #22c55e)' },
          '50%': { boxShadow: '0 0 12px var(--glow-color, #22c55e)' },
        },
      },
    },
  },
  plugins: [],
}