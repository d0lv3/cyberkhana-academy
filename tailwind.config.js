import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        // Small phones (iPhone SE and the 360px Android tier) are a real slice
        // of the audience here, and a two-up card grid leaves ~130px per card
        // at that width — narrower than the card's own content.
        xs: '400px',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        zinc: {
          850: '#1C1C20',
          925: '#0C0C0D',
        }
      },
      spacing: {
        // Notch / home-indicator insets. Zero everywhere that has no cutout,
        // so these are safe to use unconditionally.
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)',
      },
      minHeight: {
        // WCAG 2.2 target size (minimum) is 24px; Apple asks for 44pt and
        // Material for 48dp. 44 is the number that satisfies all three.
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // Pointer type, not screen width. A tablet in landscape is wider than a
      // laptop but still gets fingers, and a phone in landscape is still a
      // phone — neither is something `md:` can tell you.
      addVariant('touch', '@media (pointer: coarse)');
      addVariant('fine', '@media (pointer: fine)');
    }),
  ],
}
