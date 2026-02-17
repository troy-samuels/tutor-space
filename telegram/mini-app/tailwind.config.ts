import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hardcoded dark palette — no reliance on TG theme vars that can be white
        background: '#0a0a0b',
        foreground: '#fafafa',
        card: 'rgba(255, 255, 255, 0.06)',
        'card-foreground': '#fafafa',
        primary: 'var(--tg-theme-button-color, #6366f1)',
        'primary-foreground': '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.08)',
        'secondary-foreground': '#fafafa',
        muted: 'rgba(255, 255, 255, 0.5)',
        'muted-foreground': 'rgba(255, 255, 255, 0.5)',
        accent: 'var(--tg-theme-accent-text-color, #818cf8)',
        'accent-foreground': '#ffffff',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        success: '#22c55e',
        'game-gold': '#fbbf24',
        border: 'rgba(255, 255, 255, 0.1)',
        link: 'var(--tg-theme-link-color, #818cf8)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        '2.5xl': '20px',
        '4xl': '32px',
      },
      boxShadow: {
        'glow-sm': '0 0 8px rgba(var(--tg-theme-button-color-rgb, 99 102 241) / 0.5)',
        'glow-md': '0 0 16px rgba(var(--tg-theme-button-color-rgb, 99 102 241) / 0.7)',
        'card-soft': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shake': 'shake 0.6s ease-in-out',
        'pulsefast': 'pulsefast 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 8s linear infinite',
      },
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'pulsefast': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    plugin(function({ addBase }) {
      addBase({
        ':root': {
          '--tg-theme-button-color-rgb': '99 102 241',
        },
      });
    }),
  ],
} satisfies Config
