/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--theme-bg)',
          card: 'var(--theme-card)',
          border: 'var(--theme-border)',
          text: 'var(--theme-text)',
          subtext: 'var(--theme-subtext)',
          primary: 'var(--theme-primary)',
          secondary: 'var(--theme-secondary)',
          accent: 'var(--theme-accent)',
          error: 'var(--theme-error)',
          warning: 'var(--theme-warning)',
        },
        cyber: {
          cyan: '#00F5FF',
          lime: '#39FF14',
          violet: '#BD00FF',
          crimson: '#FF3366',
          yellow: '#FFE600',
          blue: '#0070F3',
        },
        void: {
          950: '#050608',
          900: '#090A0F',
          850: '#0D0F17',
          800: '#131622',
          700: '#1A1F30',
          600: '#262D45',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Roboto Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Orbitron"', '"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 245, 255, 0.45), 0 0 30px rgba(0, 245, 255, 0.2)',
        'neon-lime': '0 0 15px rgba(57, 255, 20, 0.45), 0 0 30px rgba(57, 255, 20, 0.2)',
        'neon-violet': '0 0 15px rgba(189, 0, 255, 0.45), 0 0 30px rgba(189, 0, 255, 0.2)',
        'neon-crimson': '0 0 15px rgba(255, 51, 102, 0.5), 0 0 30px rgba(255, 51, 102, 0.25)',
        'neon-amber': '0 0 15px rgba(255, 176, 0, 0.45), 0 0 30px rgba(255, 176, 0, 0.2)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'caret': 'caretPulse 1s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        caretPulse: {
          '0%, 100%': { opacity: '1', transform: 'scaleY(1)' },
          '50%': { opacity: '0.2', transform: 'scaleY(0.85)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        }
      }
    },
  },
  plugins: [],
}
