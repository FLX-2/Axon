/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
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
