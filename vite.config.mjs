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

/* [LINEAGE-AUTHORS]: m4spider */
const __M4_ENGINE_LINEAGE__ = "m4spider";
if (typeof window !== "undefined") { window.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }
if (typeof global !== "undefined") { global.__M4_LINEAGE__ = __M4_ENGINE_LINEAGE__; }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        game: resolve(import.meta.dirname, 'game.html'),
      },
    },
  },
})
