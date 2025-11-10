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
        // Backgrounds
        surfacePrimary: 'var(--color-surfacePrimary)',
        surfaceSecondary: 'var(--color-surfaceSecondary)',
        surfaceHover: 'var(--color-surfaceHover)',
        
        // Text & Icons - Sidebar
        sidebarText: 'var(--color-sidebarText)',
        sidebarIcon: 'var(--color-sidebarIcon)',
        sidebarIconHover: 'var(--color-sidebarIconHover)',
        
        // Text & Icons - Main Content
        textPrimary: 'var(--color-textPrimary)',
        textSecondary: 'var(--color-textSecondary)',
        textPlaceholder: 'var(--color-textPlaceholder)',
        iconPrimary: 'var(--color-iconPrimary)',
        iconSecondary: 'var(--color-iconSecondary)',
        
        // UI Elements
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
        buttonHover: 'var(--color-buttonHover)',
        inputBg: 'var(--color-inputBg)',
        inputBorder: 'var(--color-inputBorder)',
        buttonSelected: 'var(--color-buttonSelected)',
      },
    },
  },
  plugins: [],
};
