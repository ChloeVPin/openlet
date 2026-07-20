import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface RouterContext {
  auth: AuthUser | null
}

export function getRouter(context?: RouterContext) {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    context: context ?? { auth: null },
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
