import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--bg-base)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        border: {
          DEFAULT: 'var(--border-subtle)',
          subtle: 'var(--border-subtle)',
          hover: 'var(--border-hover)',
          active: 'var(--border-active)',
        },
        fg: {
          DEFAULT: 'var(--fg)',
          muted: 'var(--fg-muted)',
          subtle: 'var(--fg-subtle)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          fg: 'var(--accent-fg)',
          muted: 'var(--accent-muted)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          fg: 'var(--destructive-fg)',
        },
        agent: {
          claude: 'var(--agent-claude)',
          gemini: 'var(--agent-gemini)',
          deepseek: 'var(--agent-deepseek)',
          codex: 'var(--agent-codex)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
      },
      fontFamily: {
        sans: ['Inter', 'Vazirmatn', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        persian: ['Vazirmatn', 'sans-serif'],
      },
      transitionDuration: {
        fast: '150ms',
      },
    },
  },
  plugins: [],
}

export default config
