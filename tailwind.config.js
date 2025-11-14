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
          bg: 'var(--terminal-bg)',
          surface: 'var(--terminal-surface)',
          card: 'var(--terminal-card)',
          border: 'var(--terminal-border)',
          text: 'var(--terminal-text)',
          muted: 'var(--terminal-muted)',
          accent: 'var(--terminal-accent)',
          hover: 'var(--terminal-hover)',
        }
      }
    },
  },
  plugins: [],
}