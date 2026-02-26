import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: 'var(--bg-void)',
        deep: 'var(--bg-deep)',
        station: 'var(--bg-station)',
        room: 'var(--bg-room)',
        'room-hover': 'var(--bg-room-hover)',
        'border-dim': 'var(--border-dim)',
        'border-glow': 'var(--border-glow)',

        apex: 'var(--apex-color)',
        nova: 'var(--nova-color)',
        scout: 'var(--scout-color)',
        forge: 'var(--forge-color)',
        lens: 'var(--lens-color)',
        pulse: 'var(--pulse-color)',
        echo: 'var(--echo-color)',
        atlas: 'var(--atlas-color)',
        sage: 'var(--sage-color)',

        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          dim: 'var(--text-dim)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        mono: 'var(--font-mono)',
      },
    },
  },
  plugins: [],
};

export default config;
