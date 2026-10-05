/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#7c6cff',
        'accent-2': '#5ddcff',
        'accent-glow': 'rgba(124, 108, 255, 0.35)',
        neu: {
          bg: '#0a1a63',
          light: '#1a2a7a',
          dark: '#06124a',
        },
        muted: '#c7d2fe',
        'muted-2': '#a0a7c0',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
      },
      boxShadow: {
        'neu-outset':
          '8px 8px 16px var(--neumorphic-shadow-dark), -8px -8px 16px var(--neumorphic-shadow-light)',
        'neu-inset':
          'inset 8px 8px 16px var(--neumorphic-shadow-dark), inset -8px -8px 16px var(--neumorphic-shadow-light)',
        'neu-pressed':
          'inset 4px 4px 8px var(--neumorphic-shadow-dark), inset -4px -4px 8px var(--neumorphic-shadow-light)',
        'neu-subtle':
          '4px 4px 8px var(--neumorphic-shadow-dark), -4px -4px 8px var(--neumorphic-shadow-light)',
      },
      transitionTimingFunction: {
        'spring-gentle': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      spacing: {
        'touch-min': '44px',
      },
      screens: {
        xs: '320px',
        sm: '480px',
        md: '768px',
        lg: '900px',
        xl: '1180px',
        '2xl': '1400px',
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      addUtilities({
        '.lift-hover': {
          transform: 'translateY(-6px)',
          boxShadow:
            '12px 12px 24px var(--neumorphic-shadow-dark), -12px -12px 24px var(--neumorphic-shadow-light)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        },
        '.neu-badge-step': {
          background: 'var(--neumorphic-bg)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '12px',
          boxShadow: theme('boxShadow.neu-inset'),
        },
        '.transition-gap': {
          transitionProperty: 'gap',
        },
      });
    },
  ],
};
