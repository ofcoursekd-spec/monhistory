import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette MonHistory — unisexe, premium, chaleureuse.
        // Wine/burgundy + amber gold : évoque le récit, le drame, l'émotion
        // sans le code "rose feminine" du premier brief.
        brand: {
          DEFAULT: '#7C1D3F',
          50: '#FDF2F4',
          100: '#FCE7EC',
          200: '#F9CCD6',
          500: '#7C1D3F',
          600: '#6B1840',
          700: '#5A1438',
        },
        accent: {
          DEFAULT: '#D97706',
          50: '#FFFBEB',
          500: '#D97706',
          600: '#B45309',
        },
        ink: '#1F1F1F',
        cream: '#FFFBF5',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
