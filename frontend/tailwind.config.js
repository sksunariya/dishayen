/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme colors
        dark: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          elevated: '#2a2a2a',
          border: '#333333',
        },
        // Light theme colors
        light: {
          bg: '#ffffff',
          surface: '#f5f5f5',
          elevated: '#ffffff',
          border: '#e0e0e0',
        },
        // Neon accent colors
        neon: {
          blue: '#667eea',
          purple: '#764ba2',
          pink: '#f093fb',
          cyan: '#4facfe',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scroll': 'scroll 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(102, 126, 234, 0.5), 0 0 10px rgba(102, 126, 234, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(102, 126, 234, 0.8), 0 0 30px rgba(102, 126, 234, 0.5)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        scroll: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(-25%, 0, 0)' },
        },
      },
      boxShadow: {
        'neon': '0 0 5px theme("colors.neon.blue"), 0 0 20px theme("colors.neon.blue")',
        'neon-lg': '0 0 10px theme("colors.neon.blue"), 0 0 40px theme("colors.neon.blue"), 0 0 80px theme("colors.neon.blue")',
      }
    },
  },
  plugins: [],
}

