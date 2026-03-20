import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pm: {
          bg: '#0f0f1a',
          surface: '#1a1a2e',
          card: '#16213e',
          accent: '#0f3460',
          blue: '#533483',
          cyan: '#00b4d8',
          green: '#06d6a0',
          yellow: '#ffd166',
          red: '#ef476f',
          orange: '#ff6b35',
          text: '#e0e0e0',
          muted: '#888899',
        }
      },
      fontFamily: {
        sans: ['Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'pulse-red': 'pulse 0.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
