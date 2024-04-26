import type { AppRouter } from '../app/api/trpc/trpc-router'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()
