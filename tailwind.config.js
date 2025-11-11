/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      },
      colors: {
        // Surfaces
        surfacePrimary: 'var(--color-surface-primary)',
        surfaceSecondary: 'var(--color-surface-secondary)',
        surfaceHover: 'var(--color-surface-hover)',
        
        // Text
        textPrimary: 'var(--color-text-primary)',
        textSecondary: 'var(--color-text-secondary)',
        textPlaceholder: 'var(--color-text-placeholder)',
        
        // Icons
        iconDefault: 'var(--color-icon-default)',
        iconHover: 'var(--color-icon-hover)',
        
        // Interactive
        accent: 'var(--color-interactive-accent)',
        border: 'var(--color-interactive-border)',
        buttonHover: 'var(--color-interactive-buttonHover)',
        buttonSelected: 'var(--color-interactive-buttonSelected)',
        
        // Input
        inputBg: 'var(--color-input-background)',
        inputBorder: 'var(--color-input-border)',
        
        // Scrollbar
        scrollbar: 'var(--color-scrollbar-track)',
        scrollbarHover: 'var(--color-scrollbar-thumb)',
      },
    },
  },
  plugins: [],
};
