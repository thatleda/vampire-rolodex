import type { AppRouter } from '../../../server/src/router.ts'
import { createTRPCReact } from '@trpc/react-query'

export const trpc = createTRPCReact<AppRouter>()
