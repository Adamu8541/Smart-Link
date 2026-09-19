import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function nonBlockingCssPlugin(): Plugin {
  return {
    name: 'non-blocking-css-plugin',
    transformIndexHtml: {
      order: 'post',
      handler(html: string) {
        return html.replace(
          /<link\s+([^>]*?\s+)?(?:rel=["']stylesheet["']\s+[^>]*?href=["']([^"']+\.css)["']|href=["']([^"']+\.css)["']\s+[^>]*?rel=["']stylesheet["'])[^>]*>/gi,
          (_match, _prefix, href1, href2) => {
            const href = href1 || href2;
            return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
          }
        );
      },
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), nonBlockingCssPlugin()],
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
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      modulePreload: {
        polyfill: false,
        resolveDependencies(filename, deps) {
          return deps.filter(
            (dep) =>
              !dep.includes('vendor-recharts') &&
              !dep.includes('vendor-pdf') &&
              !dep.includes('vendor-motion') &&
              !dep.includes('vendor-sentry') &&
              !dep.includes('vendor-supabase') &&
              !dep.includes('vendor-qrcode')
          );
        },
      },
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
              // 4. Monitoring & Error Telemetry
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
              // 5. Supabase Auth & Client
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              // 6. QR Code generator
              if (id.includes('qrcode')) {
                return 'vendor-qrcode';
              }
              // 7. Animation Library
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              // 8. Vector Icons
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
            }
          },
        },
      },
    },
    esbuild: {
      legalComments: 'none',
      drop: ['console', 'debugger'],
    },
  };
});

