import { z } from 'zod'

export const labResultSchema = z.object({
  value: z.number(),
  unit: z.string(),
})

export const observationSchema = z.object({
  id: z.string(),
  testDate: z.string(),
  results: z.record(z.string(), labResultSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const patientSchema = z.object({
  id: z.string(),
  birthdate: z.string(),
  gender: z.number(),
  ethnicity: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  observations: z.array(observationSchema),
})

export type Observation = z.infer<typeof observationSchema>
export type Patient = z.infer<typeof patientSchema>
