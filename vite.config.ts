import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY works in your code even after build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY),
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        external: ['@google/genai', 'canvas-confetti'],
        output: {
          paths: {
            '@google/genai': 'https://esm.run/@google/genai',
            'canvas-confetti': 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/+esm'
          }
        }
      }
    }
  };
});