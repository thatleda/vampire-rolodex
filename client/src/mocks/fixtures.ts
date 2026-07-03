import type { Patient } from '../../../server/src/schemas.ts'

function mockPatient(overrides: Partial<Patient> & Pick<Patient, 'id'>): Patient {
  const now = new Date().toISOString()
  return {
    birthdate: '1980-01-01T00:00:00.000Z',
    gender: 1,
    ethnicity: 1,
    createdAt: now,
    updatedAt: now,
    observations: [],
    ...overrides,
  }
}

export function createInitialPatients(): Patient[] {
  const now = new Date().toISOString()
  return [
    mockPatient({
      id: 'haha-patient-many-observations',
      observations: [
        {
          id: 'obs-1',
          testDate: '2019-10-11T00:00:00.000Z',
          results: {
            creatine: { value: 0.84, unit: 'mgdl' },
            chloride: { value: 95.68, unit: 'mmoll' },
          },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'obs-2',
          testDate: '2019-11-07T00:00:00.000Z',
          results: {
            creatine: { value: 0.6, unit: 'mgdl' },
            chloride: { value: 97.98, unit: 'mmoll' },
          },
          createdAt: now,
          updatedAt: now,
        },
        {
          id: 'obs-3',
          testDate: '2019-12-16T00:00:00.000Z',
          results: {
            creatine: { value: 0.57, unit: 'mgdl' },
            chloride: { value: 110.05, unit: 'mmoll' },
          },
          createdAt: now,
          updatedAt: now,
        },
      ],
    }),
    mockPatient({
      id: 'haha-patient-one-observation',
      observations: [
        {
          id: 'obs-4',
          testDate: '2021-05-18T00:00:00.000Z',
          results: {
            creatine: { value: 0.26, unit: 'mgdl' },
          },
          createdAt: now,
          updatedAt: now,
        },
      ],
    }),
    mockPatient({
      id: 'haha-patient-no-observations',
      observations: [],
    }),
  ]
}
