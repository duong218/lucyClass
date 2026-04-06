/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#c2e0f9', /* Sky blue from screenshot */
          400: '#8ab4f8',
          500: '#4A90E2', /* Button blue */
          600: '#357abd',
          700: '#2563eb',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#FDE047', /* Yellow from Join Us Today card */
          600: '#eab308',
          700: '#ca8a04',
          800: '#854d0e',
          900: '#713f12',
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
        sans: ['Quicksand', 'Nunito', 'sans-serif'],
        display: ['Fredoka One', 'Quicksand', 'cursive'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      boxShadow: {
        'card': '0 4px 15px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 25px rgba(0,0,0,0.1)',
        'heavy': '0 10px 30px rgba(0,0,0,0.15)',
        'button': '0 4px 0px rgba(0,0,0,0.2)',
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
