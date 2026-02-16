import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Telegram theme colours (will be overridden by JS at runtime)
        background: 'var(--tg-theme-bg-color, #212121)',
        foreground: 'var(--tg-theme-text-color, #ffffff)',
        card: 'var(--tg-theme-secondary-bg-color, #2c2c2c)',
        'card-foreground': 'var(--tg-theme-text-color, #ffffff)',
        primary: 'var(--tg-theme-button-color, #8774e1)',
        'primary-foreground': 'var(--tg-theme-button-text-color, #ffffff)',
        secondary: 'var(--tg-theme-secondary-bg-color, #2c2c2c)',
        'secondary-foreground': 'var(--tg-theme-text-color, #ffffff)',
        muted: 'var(--tg-theme-hint-color, #7a7a7a)',
        'muted-foreground': 'var(--tg-theme-hint-color, #7a7a7a)',
        accent: 'var(--tg-theme-accent-text-color, #8774e1)',
        'accent-foreground': 'var(--tg-theme-button-text-color, #ffffff)',
        destructive: '#ef4444',
        'destructive-foreground': '#ffffff',
        border: 'var(--tg-theme-secondary-bg-color, #2c2c2c)',
        link: 'var(--tg-theme-link-color, #8774e1)',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shake': 'shake 0.4s ease-in-out',
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
      },
    },
  },
  plugins: [],
} satisfies Config
