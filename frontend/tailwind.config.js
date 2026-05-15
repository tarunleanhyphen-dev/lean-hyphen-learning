/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#1A1426',
          700: '#2E2440',
          500: '#5B4A78',
          300: '#9C8FB7',
        },
        cream: {
          50: '#FFF8EE',
          100: '#FBEFDC',
          200: '#F5E1C0',
        },
        saffron: {
          400: '#FFB347',
          500: '#FF9F1C',
          600: '#E8870A',
        },
        coral: {
          400: '#FF7A6B',
          500: '#FF5A4A',
          600: '#E63E2E',
        },
        burgundy: {
          500: '#8B1E3F',
          600: '#6E1431',
        },
        teal: {
          400: '#3CC9B6',
          500: '#10A899',
        },
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        phone: '0 30px 60px -20px rgba(26, 20, 38, 0.45), 0 0 0 1px rgba(0,0,0,0.08)',
        bubble: '0 8px 20px -8px rgba(91, 74, 120, 0.4)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
