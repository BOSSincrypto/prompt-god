import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import type { Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

/** Hosts the BYOK client is allowed to reach. Nothing else may be contacted. */
const PROVIDER_ORIGINS = [
  'https://api.anthropic.com',
  'https://api.openai.com',
  'https://generativelanguage.googleapis.com',
  'https://openrouter.ai',
]

/**
 * Injects a Content-Security-Policy meta tag, hashing whatever inline scripts
 * the final HTML contains so no `unsafe-inline` is needed for scripts.
 *
 * GitHub Pages cannot set response headers, so a meta tag is the only delivery
 * mechanism available. Per the CSP spec `frame-ancestors`, `report-uri` and
 * `sandbox` are ignored in a meta tag, so they are omitted rather than
 * included for show.
 *
 * The point of this policy is not XSS — the app never injects HTML — it is
 * `connect-src`: a compromised dependency cannot ship a user's API key to an
 * arbitrary host.
 */
function cspPlugin(): Plugin {
  return {
    name: 'prompt-god:csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const hashes: string[] = []
        for (const match of html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
          const body = match[1] ?? ''
          const digest = createHash('sha256').update(body, 'utf8').digest('base64')
          hashes.push(`'sha256-${digest}'`)
        }

        const policy = [
          `default-src 'self'`,
          `script-src 'self' ${hashes.join(' ')}`.trim(),
          // React writes inline style attributes for the score dial and
          // progress bars, which style-src hashes cannot cover.
          `style-src 'self' 'unsafe-inline'`,
          `img-src 'self' data:`,
          `font-src 'self'`,
          `connect-src 'self' ${PROVIDER_ORIGINS.join(' ')}`,
          `worker-src 'self'`,
          `manifest-src 'self'`,
          `base-uri 'self'`,
          `form-action 'none'`,
          `object-src 'none'`,
        ].join('; ')

        return html.replace(
          '<meta charset="UTF-8" />',
          `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        )
      },
    },
  }
}

/**
 * The site is served from a custom apex-style subdomain
 * (prompt-god.bossincrypto.dev), so the base path is always "/".
 * `BASE_PATH` exists purely as an escape hatch for project-pages previews.
 */
const base = process.env.BASE_PATH ?? '/'

/** Read from package.json at config time so the About screen cannot drift. */
const { version } = JSON.parse(
  readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8'),
) as { version: string }

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssTarget: 'chrome111',
    sourcemap: false,
    // Content chunks are large-ish text blobs; inlining them would defeat
    // the per-locale lazy loading that keeps the initial payload small.
    assetsInlineLimit: 2048,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Vite 8 runs Rolldown, which replaced `manualChunks` with declarative
        // code-splitting groups. A stable React chunk keeps the framework
        // cached across deploys while every route and locale stays in its own
        // lazily fetched chunk.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler)[\\/]/,
              priority: 10,
            },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/, priority: 0 },
          ],
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    cspPlugin(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: {
        // Derived from `base`, not hardcoded: a subpath build
        // (`BASE_PATH=/prompt-god/`) rewrites every asset path, and a manifest
        // still claiming the domain root would scope the installed app to a
        // place its files are not.
        id: base,
        name: 'Prompt God — Prompt Engineering Trainer',
        short_name: 'Prompt God',
        description:
          'Learn to write prompts that actually work — for Claude, GPT, Gemini, Llama and more. Offline-first, private, free.',
        lang: 'en',
        dir: 'ltr',
        start_url: base,
        scope: base,
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'any',
        background_color: '#08080c',
        theme_color: '#08080c',
        categories: ['education', 'productivity', 'developer'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          { name: 'Prompt Lab', url: `${base}lab`, description: 'Analyze and improve a prompt' },
          { name: 'Learn', url: `${base}learn`, description: 'Continue the course' },
          { name: 'Patterns', url: `${base}patterns`, description: 'Browse the pattern library' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        // Content chunks are small; precaching everything makes the whole
        // course work offline after the first visit.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: `${base}index.html`,
        // Anything with a file extension is a file, not a route. Without this
        // the fallback answers a navigation to a real file that was never
        // precached — SERVING.md, robots.txt, anything dropped next to the
        // app later — with the app shell, so the user gets a working-looking
        // page instead of the 404 that would tell them it is missing. Every
        // route in this app is a bare slug, so nothing legitimate is caught.
        navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        runtimeCaching: [
          {
            // BYOK provider calls must never be cached or served stale.
            urlPattern:
              /^https:\/\/(api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com|openrouter\.ai)\//,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts', 'src/lib/**/*.ts'],
      reporter: ['text-summary', 'lcov'],
    },
  },
})
