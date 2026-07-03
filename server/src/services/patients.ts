import type { Observation, Patient } from '../schemas.ts'
import process from 'node:process'
import { prisma } from '../db.ts'

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL!

export interface ExternalVisit {
  client_id: string
  date_testing: string
  date_birthdate: string
  gender: number
  ethnicity: number
  [labField: string]: string | number
}

export function extractResults(visit: ExternalVisit): Record<string, { value: number, unit: string }> {
  const results: Record<string, { value: number, unit: string }> = {}
  for (const key of Object.keys(visit)) {
    if (key.endsWith('_unit')) {
      continue
    }
    const value = visit[key]
    const unit = visit[`${key}_unit`]
    if (typeof value === 'number' && typeof unit === 'string') {
      results[key] = { value, unit }
    }
  }
  return results
}

export async function fetchVisitFromExternalApi(): Promise<ExternalVisit[]> {
  let response: Response
  try {
    response = await fetch(EXTERNAL_API_URL)
  }
  catch (error) {
    if (!(error instanceof TypeError)) {
      throw error
    }
    console.error('Failed to reach the external lab data provider:', error)
    throw new Error('Could not reach the external lab data provider. Please try again shortly.')
  }
  if (!response.ok) {
    console.error(`External lab data provider returned HTTP ${response.status}:`, await response.text())
    throw new Error(`The external lab data provider returned an error (HTTP ${response.status}). Please try again shortly.`)
  }
  return response.json()
}

async function persistPatient(visits: ExternalVisit[]): Promise<void> {
  await prisma.patient.create({
    data: {
      id: visits[0].client_id,
      birthdate: new Date(visits[0].date_birthdate),
      gender: visits[0].gender,
      ethnicity: visits[0].ethnicity,
      observations: {
        create: visits.map(visit => ({
          testDate: new Date(visit.date_testing),
          results: extractResults(visit),
        })),
      },
    },
  })
}

export async function populateFromExternalApi(count: number): Promise<void> {
  const visitsList = await Promise.all(
    Array.from({ length: count }, () => fetchVisitFromExternalApi()),
  )
  await Promise.all(
    visitsList.filter(visits => visits.length > 0).map(persistPatient),
  )
}

export async function resetPatients(): Promise<void> {
  await prisma.observation.deleteMany()
  await prisma.patient.deleteMany()
}

export async function countPatients(): Promise<number> {
  return prisma.patient.count()
}

interface PatientWithObservations {
  id: string
  birthdate: Date
  gender: number
  ethnicity: number
  createdAt: Date
  updatedAt: Date
  observations: {
    id: string
    testDate: Date
    results: unknown
    createdAt: Date
    updatedAt: Date
  }[]
}

function toObservationDto(observation: PatientWithObservations['observations'][number]): Observation {
  return {
    id: observation.id,
    testDate: observation.testDate.toISOString(),
    results: observation.results as Observation['results'],
    createdAt: observation.createdAt.toISOString(),
    updatedAt: observation.updatedAt.toISOString(),
  }
}

function toPatientDto(patient: PatientWithObservations): Patient {
  return {
    id: patient.id,
    birthdate: patient.birthdate.toISOString(),
    gender: patient.gender,
    ethnicity: patient.ethnicity,
    createdAt: patient.createdAt.toISOString(),
    updatedAt: patient.updatedAt.toISOString(),
    observations: patient.observations.map(toObservationDto),
  }
}

export async function retrieveVisitsFromDb(): Promise<Patient[]> {
  const patients = await prisma.patient.findMany({
    include: { observations: true },
    orderBy: { createdAt: 'asc' },
  })
  return patients.map(toPatientDto)
}
