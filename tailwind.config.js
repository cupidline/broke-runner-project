/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0E0E10',
        surface: '#17171A',
        accent: '#7DD3FC',
        'accent-dim': '#38BDF8',
        muted: '#52525B',
        'text-primary': '#F4F4F5',
        'text-secondary': '#A1A1AA',
        danger: '#F87171',
        warning: '#FBBF24',
        success: '#34D399',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
