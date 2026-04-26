/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        heading: ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        body: ['ui-sans-serif', 'system-ui', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: '#FF4F00',
          foreground: '#FFFFFF',
          hover: '#CC3F00',
        },
        secondary: {
          DEFAULT: '#0F172A',
          foreground: '#F8FAFC',
        },
        accent: {
          DEFAULT: '#F59E0B',
          foreground: '#0F172A',
        },
        background: '#F1F5F9',
        surface: '#FFFFFF',
        border: '#E2E8F0',
      },
      borderRadius: {
        sm: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}