import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'preload-mock-runtime',
    enforce: 'post',
    generateBundle(_options, bundle) {
      if (process.env.VITE_ENABLE_MOCKS === 'false') return
      const html = bundle['index.html']
      const runtime = Object.values(bundle).find(item => item.type === 'chunk' && item.name === 'browser')
      if (html?.type === 'asset' && runtime?.type === 'chunk') html.source = String(html.source).replace('</head>', `<link rel="modulepreload" crossorigin href="/${runtime.fileName}">\n  </head>`)
    },
  }],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
