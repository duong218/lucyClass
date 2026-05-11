/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lucy: {
          primary: '#1C695C',
          secondary: '#3FA48F',
          tealCyan: '#1C6970',
          orange: '#C96A3D',
          yellow: '#D9A441',
          purple: '#693D6A',
          body: '#4A4A4A',
          offwhite: '#F5F5F0',
          beige: '#E6DCCF',
          white: '#FFFFFF',
        },
        primary: {
          50: '#e9f4f1',
          100: '#d2e9e3',
          200: '#a6d3c8',
          300: '#79bcac',
          400: '#4da690',
          500: '#1C695C',
          600: '#17564c',
          700: '#12443c',
          800: '#0e312b',
          900: '#091f1b',
        },
        secondary: {
          50: '#eff9f6',
          100: '#d9f2ec',
          200: '#b4e4d9',
          300: '#8ed7c5',
          400: '#69c9b2',
          500: '#3FA48F',
          600: '#348474',
          700: '#276358',
          800: '#1b423b',
          900: '#0e211d',
        },
        pastel: {
          blue: '#D0EAF9',
          yellow: '#FDF0C6',
          green: '#D5F1D5',
          orange: '#FCD7C4',
          pink: '#FAD2E5',
          purple: '#E2D5F8',
        },
        text: {
          main: '#1F2937',
          light: '#4B5563',
        }
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans SC', 'sans-serif'],
        display: ['Outfit', 'Noto Sans', 'Noto Sans SC', 'sans-serif'],
        accent: ['Nunito', 'Noto Sans', 'Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      boxShadow: {
        'card': 'rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px',
        'card-hover': 'rgba(28,105,92,0.15) 0px 25px 50px -12px',
        'heavy': '0 10px 30px rgba(0,0,0,0.15)',
        'button': 'rgba(28,105,92,0.35) 0px 4px 14px 0px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-15px) rotate(3deg)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float-around': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'twinkle-slower': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        }
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.8s ease-out forwards',
        'slide-up-fade': 'slide-up-fade 0.8s ease-out forwards',
        'float-around': 'float-around 4s ease-in-out infinite',
        'twinkle-slower': 'twinkle-slower 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
