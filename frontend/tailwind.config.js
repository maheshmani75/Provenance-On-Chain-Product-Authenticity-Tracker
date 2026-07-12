/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#0E1116',
        panel: '#161A21',
        rule: '#252B35',
        verified: {
          DEFAULT: '#3DD68C',
          soft: '#0F2E22',
        },
        flagged: {
          DEFAULT: '#E5484D',
          soft: '#3A1518',
        },
        steel: '#8B95A6',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        seal: '0.75rem',
      },
      backgroundImage: {
        'diagonal-hatch': 'repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 8px)',
      },
    },
  },
  plugins: [],
};
