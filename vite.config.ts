import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      minify: 'esbuild',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('vite/preload-helper') || id.includes('vite/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules')) {
              // 1. Global Core: React & runtime scheduler (prevents React leaking into feature chunks)
              if (
                id.includes('node_modules/react/') ||
                id.includes('node_modules/react-dom/') ||
                id.includes('node_modules/scheduler/')
              ) {
                return 'vendor-react';
              }
              // 2. Heavy Route-Specific: PDF & Canvas (only loaded when exporting/printing slips)
              if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('canvg')) {
                return 'vendor-pdf';
              }
              // 3. Heavy Route-Specific: Recharts (only loaded when viewing dashboard charts)
              if (id.includes('recharts') || id.includes('d3-') || id.includes('internmap')) {
                return 'vendor-recharts';
              }
              // 4. Heavy Backend/Data: Firebase client SDK
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              // 5. Monitoring & Error Telemetry
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
            }
          },
        },
      },
    },
    esbuild: {
      legalComments: 'none',
    },
  };
});

