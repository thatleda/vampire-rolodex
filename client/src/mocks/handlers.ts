import type { AppRouter } from '../../../server/src/router.ts'
import { createTRPCMsw, httpLink } from 'msw-trpc'
import { createInitialPatients } from './fixtures.ts'

export const trpcMsw = createTRPCMsw<AppRouter>({
  links: [httpLink({ url: '/trpc' })],
})

let patients = createInitialPatients()

export const handlers = [
  trpcMsw.patients.list.query(() => patients),
  trpcMsw.patients.reset.mutation(() => {
    patients = createInitialPatients()
  }),
  trpcMsw.patients.addNew.mutation(() => {
    patients = [
      ...patients,
      {
        id: `haha-patient-${patients.length + 1}`,
        birthdate: '1990-01-01T00:00:00.000Z',
        gender: 2,
        ethnicity: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        observations: [],
      },
    ]
  }),
]
