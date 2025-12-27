import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isProduction = mode === 'production';
    
    return {
      server: {
        port: 3111,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI2_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        target: 'es2020',
        minify: isProduction ? 'terser' : false,
        sourcemap: !isProduction,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              router: ['react-router-dom'],
              query: ['@tanstack/react-query'],
              motion: ['framer-motion'],
              icons: ['lucide-react']
            }
          }
        }
      }
    };
});
