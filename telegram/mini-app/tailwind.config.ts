import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080C14',
        foreground: '#F1F5F9',
        card: '#161D2E',
        'card-foreground': '#F1F5F9',
        primary: '#FCD34D',
        'primary-foreground': '#080C14',
        secondary: '#4ADE80',
        'secondary-foreground': '#080C14',
        muted: '#94A3B8',
        accent: '#FCD34D',
        destructive: '#F87171',
        success: '#4ADE80',
        warning: '#FBBF24',
        'game-gold': '#FCD34D',
        'game-surface': '#161D2E',
        'game-elevated': '#1E2740',
        'game-active': '#253050',
        border: 'rgba(255, 255, 255, 0.06)',
        link: '#60A5FA',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Inter Tight', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      borderRadius: {
        '2.5xl': '20px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0px 8px 20px rgba(0, 0, 0, 0.4), 0px 2px 5px rgba(0, 0, 0, 0.25)',
        'button': '0px 4px 10px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-teal': '0 0 20px rgba(45, 212, 191, 0.3)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'shake': 'shake 0.6s ease-in-out',
        'pulsefast': 'pulsefast 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 8s linear infinite',
        'float': 'float 6s ease-in-out infinite',
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
        'float': {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-10px) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
