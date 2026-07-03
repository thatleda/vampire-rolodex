import type { ExternalVisit } from './patients.ts'
import { prisma } from '../db.ts'
import {
  countPatients,
  extractResults,
  fetchVisitFromExternalApi,
  populateFromExternalApi,
  resetPatients,
  retrieveVisitsFromDb,
} from './patients.ts'

function visit(overrides: Partial<ExternalVisit> = {}): ExternalVisit {
  return {
    client_id: 'abc123',
    date_testing: '2020-01-01',
    date_birthdate: '1980-01-01',
    gender: 1,
    ethnicity: 1,
    ...overrides,
  }
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as Response
}

beforeEach(async () => {
  await prisma.observation.deleteMany()
  await prisma.patient.deleteMany()
})

afterEach(() => vi.unstubAllGlobals())

describe('extractResults', () => {
  it('pairs up any field with a matching _unit sibling, not just a fixed known list', () => {
    const results = extractResults(visit({
      creatine: 0.84,
      creatine_unit: 'mgdl',
      hemoglobin: 13.2,
      hemoglobin_unit: 'gdl',
    }))

    expect(results).toEqual({
      creatine: { value: 0.84, unit: 'mgdl' },
      hemoglobin: { value: 13.2, unit: 'gdl' },
    })
  })

  it('omits a lab value entirely when its unit is missing', () => {
    expect(extractResults(visit({ creatine: 0.84 }))).toEqual({})
  })

  it('omits a lab value when it is a non-numeric string', () => {
    expect(extractResults(visit({ creatine: 'unknown', creatine_unit: 'mgdl' }))).toEqual({})
  })

  it('returns an empty object when the visit has no lab fields at all', () => {
    expect(extractResults(visit())).toEqual({})
  })
})

describe('fetchVisitFromExternalApi', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns the parsed visits array on a successful response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([visit()])))

    expect(await fetchVisitFromExternalApi()).toEqual([visit()])
  })

  it('throws a friendly error when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null, false, 500)))

    await expect(fetchVisitFromExternalApi()).rejects.toThrow('HTTP 500')
  })

  it('throws a friendly error when the network request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))

    await expect(fetchVisitFromExternalApi()).rejects.toThrow('Could not reach the external lab data provider')
  })

  it('does not mask an unrelated error as a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new RangeError('something unrelated broke')))

    await expect(fetchVisitFromExternalApi()).rejects.toThrow('something unrelated broke')
  })
})

describe('populateFromExternalApi', () => {
  it('fetches and persists the requested number of patients', async () => {
    let callCount = 0
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => {
      callCount += 1
      return Promise.resolve(jsonResponse([visit({ client_id: `haha-patient-${callCount}` })]))
    }))

    await populateFromExternalApi(3)

    expect(await countPatients()).toBe(3)
  })

  it('drops a slot immediately if its response is empty, without retrying', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    await populateFromExternalApi(1)

    expect(await countPatients()).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('persists every visit for a patient as its own observation', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([
      visit({ client_id: 'haha-patient-a', date_testing: '2020-01-01' }),
      visit({ client_id: 'haha-patient-a', date_testing: '2020-02-01' }),
    ])))

    await populateFromExternalApi(1)

    const [patient] = await retrieveVisitsFromDb()
    expect(patient.observations).toHaveLength(2)
  })

  it('round-trips the exact extracted lab results through persistence and retrieval', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([
      visit({ client_id: 'haha-patient-a', creatine: 0.84, creatine_unit: 'mgdl' }),
    ])))

    await populateFromExternalApi(1)

    const [patient] = await retrieveVisitsFromDb()
    expect(patient.observations[0].results).toEqual({ creatine: { value: 0.84, unit: 'mgdl' } })
  })
})

describe('resetPatients', () => {
  it('deletes all patients and their observations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([visit({ client_id: 'haha-patient-a' })])))
    await populateFromExternalApi(1)
    vi.unstubAllGlobals()

    await resetPatients()

    expect(await countPatients()).toBe(0)
  })
})
