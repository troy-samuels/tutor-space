import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#1A1A2E',
        foreground: '#E0E0E0',
        card: '#2C2C40',
        'card-foreground': '#E0E0E0',
        primary: '#8B5CF6',
        'primary-foreground': '#ffffff',
        secondary: '#2DD4BF',
        'secondary-foreground': '#ffffff',
        muted: '#A0A0A0',
        accent: '#8B5CF6',
        destructive: '#EF4444',
        success: '#34D399',
        'game-gold': '#FBBF24',
        border: 'rgba(255, 255, 255, 0.08)',
        link: '#8B5CF6',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
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
