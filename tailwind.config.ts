import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1B3D',
        brand: { DEFAULT: '#1D3FA8', dark: '#142E80', soft: '#E8EDFB' },
        rouge: '#C8102E',
        paper: '#F5F7FB',
        line: '#DCE2EE',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
