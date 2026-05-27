import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E8670A',
          50: '#FEF3E8',
          100: '#FDE0C5',
          200: '#FABB8A',
          300: '#F7964F',
          400: '#F47A27',
          500: '#E8670A',
          600: '#C45508',
          700: '#9A4206',
          800: '#702F04',
          900: '#491F03',
        },
        sidebar: '#1e293b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
