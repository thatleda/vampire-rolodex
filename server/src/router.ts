import { z } from 'zod'
import { patientSchema } from './schemas.ts'
import { publicProcedure, router } from './trpc.ts'

export const appRouter = router({
  patients: router({
    list: publicProcedure.output(z.array(patientSchema)).query(() => {
      throw new Error('not implemented')
    }),
    reset: publicProcedure.mutation(() => {
      throw new Error('not implemented')
    }),
    addNew: publicProcedure.mutation(() => {
      throw new Error('not implemented')
    }),
  }),
})

export type AppRouter = typeof appRouter
