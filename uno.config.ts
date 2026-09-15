import { defineConfig, presetUno, presetAttributify } from 'unocss'

export default defineConfig({
  presets: [presetUno(), presetAttributify()],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
      },
      game: {
        DEFAULT: '#0f1923',
        card: '#1a2332',
        accent: '#e94560',
        gold: '#ffb800',
      },
    },
  },
  shortcuts: {
    'btn-primary': 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark active:scale-95 transition-all',
    'btn-ghost': 'inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white/10 text-white font-medium hover:bg-white/20 active:scale-95 transition-all',
    'card-base': 'bg-game-card rounded-xl p-4',
  },
})
