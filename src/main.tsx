import { SessionLifecycle } from '@/features/auth/queries'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '@/app/router/router'
import { QueryProvider } from '@/app/providers/query-provider'
import '@/app/styles/globals.css'

const root = createRoot(document.getElementById('root')!)

async function bootstrap() {
  // A rede simulada precisa estar pronta antes da primeira consulta.
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'false') {
    const [{ initializeMocks }, { worker }] = await Promise.all([import('@/mocks/initialize'), import('@/mocks/browser')])
    await initializeMocks()
    await worker.start({
      quiet: true,
      onUnhandledRequest(request, print) {
        if (new URL(request.url).pathname.startsWith('/api/')) print.error()
      },
    })
  }
  root.render(<StrictMode><QueryProvider><SessionLifecycle /><RouterProvider router={router} /></QueryProvider></StrictMode>)
}

bootstrap().catch(error => {
  console.error('Falha ao iniciar a aplicação', error)
  root.render(<main className="page-container py-16"><h1 className="text-xl font-bold">Não foi possível iniciar a aplicação</h1><p className="my-4 text-muted-foreground">Recarregue a página para tentar novamente.</p><button onClick={() => location.reload()} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">Recarregar página</button></main>)
})
