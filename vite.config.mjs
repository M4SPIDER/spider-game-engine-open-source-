/*
 * ============================================================================
 * SPIDER GAME ENGINE (OPEN SOURCE)
 * ============================================================================
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 * Author: M4SPIDER (support@m4spider.com)
 * Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
 * ============================================================================
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'
import fs from 'fs'

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

const errorLogPlugin = () => ({
  name: 'client-error-logger',
  configureServer(server) {
    server.middlewares.use('/__client_error', (req, res) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          fs.appendFileSync('client_errors.log', `${new Date().toISOString()} ${body}\n`);
          console.log('\n🚨 [MOBILE ERROR DETECTED]:', body, '\n');
        } catch {}
        res.setHeader('Content-Type', 'text/plain');
        res.end('ok');
      });
    });

    server.middlewares.use('/__mobile_heartbeat', (req, res) => {
      let body = '';
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', () => {
        try {
          fs.writeFileSync('mobile_heartbeat.json', body, 'utf8');
        } catch {}
        res.setHeader('Content-Type', 'application/json');
        let patchCode = null;
        try {
          if (fs.existsSync('patch_mobile_code.jsx')) {
            patchCode = fs.readFileSync('patch_mobile_code.jsx', 'utf8');
            fs.unlinkSync('patch_mobile_code.jsx');
          }
        } catch {}
        res.end(JSON.stringify({ received: true, patchCode }));
      });
    });
  }
});

export default defineConfig({
  plugins: [react(), tailwindcss(), errorLogPlugin()],
  base: './',
  server: {
    host: true,
    watch: {
      ignored: ['**/dist/**', '**/dist-game/**', '**/*.log', '**/mobile_heartbeat.json', '**/client_errors.log', '**/patch_mobile_code.jsx', '**/scripts/**']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
      },
    },
  },
})
