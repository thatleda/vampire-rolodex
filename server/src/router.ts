import process from 'node:process'
import { z } from 'zod'
import { patientSchema } from './schemas.ts'
import { countPatients, populateFromExternalApi, resetPatients, retrieveVisitsFromDb } from './services/patients.ts'
import { publicProcedure, router } from './trpc.ts'

const DEFAULT_PATIENT_COUNT = Number(process.env.DEFAULT_PATIENT_COUNT) || 10

export const appRouter = router({
  patients: router({
    list: publicProcedure.output(z.array(patientSchema)).query(async () => {
      const existingCount = await countPatients()
      if (existingCount === 0) {
        await populateFromExternalApi(DEFAULT_PATIENT_COUNT)
      }
      return retrieveVisitsFromDb()
    }),
    reset: publicProcedure.mutation(async () => {
      await resetPatients()
      await populateFromExternalApi(DEFAULT_PATIENT_COUNT)
    }),
    addNew: publicProcedure.mutation(async () => {
      await populateFromExternalApi(1)
    }),
  }),
})

export type AppRouter = typeof appRouter
