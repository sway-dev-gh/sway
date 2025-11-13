/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
        sans: ['SF Mono', 'Monaco', 'Menlo', 'Consolas', 'Liberation Mono', 'monospace'],
      },
      colors: {
        terminal: {
          bg: '#000000',
          surface: '#000000',
          card: '#080808',
          border: '#111111',
          text: '#ffffff',
          muted: '#666666',
          accent: '#111111',
          hover: '#0a0a0a',
        }
      }
    },
  },
  plugins: [],
}