/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0f0f0f',
          50: '#f7f6f3',
          100: '#eeece6',
          200: '#dddad0',
          300: '#c4bfb0',
          400: '#a89f8c',
          500: '#8a8070',
          600: '#6e6457',
          700: '#574f44',
          800: '#3d3830',
          900: '#242018',
          950: '#0f0f0f',
        },
        accent: {
          DEFAULT: '#e8622a',
          light: '#f5896a',
          dark: '#c44d1a',
        },
        surface: {
          DEFAULT: '#faf9f6',
          raised: '#ffffff',
          sunken: '#f0efe9',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
