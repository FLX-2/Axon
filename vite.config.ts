import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  server: {
    port: 1421,
    strictPort: true,
    host: true,
    cors: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 1421,
    },
  },
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
