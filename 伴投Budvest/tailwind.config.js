/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#1e293b',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'width': 'width 2.5s ease-in-out forwards',
        'dropIn': 'dropIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        width: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        dropIn: {
          'to': {
            opacity: '1',
            transform: 'translateY(0) rotateX(0)'
          },
        },
      },
    },
  },
  plugins: [],
}
