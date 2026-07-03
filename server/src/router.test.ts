import type { ExternalVisit } from './services/patients.ts'
import { prisma } from './db.ts'
import { appRouter } from './router.ts'

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
  return { ok, status, json: async () => body } as Response
}

function stubExternalApi() {
  let callCount = 0
  const fetchMock = vi.fn().mockImplementation(() => {
    callCount += 1
    return Promise.resolve(jsonResponse([
      visit({ client_id: `haha-patient-${callCount}`, creatine: 0.84, creatine_unit: 'mgdl' }),
    ]))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(async () => {
  await prisma.observation.deleteMany()
  await prisma.patient.deleteMany()
})

afterEach(() => vi.unstubAllGlobals())

describe('appRouter', () => {
  const caller = appRouter.createCaller({})

  it('is defined', () => {
    expect(appRouter).toBeDefined()
  })

  it('lazily populates the default patient count from the external api when the db is empty', async () => {
    stubExternalApi()

    const patients = await caller.patients.list()

    expect(patients).toHaveLength(10)
    expect(patients[0].observations[0].results).toEqual({ creatine: { value: 0.84, unit: 'mgdl' } })
  })

  it('does not re-populate when the db already has patients', async () => {
    const fetchMock = stubExternalApi()
    await caller.patients.list()
    fetchMock.mockClear()

    const patients = await caller.patients.list()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(patients).toHaveLength(10)
  })

  it('clears existing patients and repopulates on reset', async () => {
    stubExternalApi()
    await caller.patients.list()
    const idsBeforeReset = (await caller.patients.list()).map(p => p.id)

    await caller.patients.reset()

    const idsAfterReset = (await caller.patients.list()).map(p => p.id)
    expect(idsAfterReset).toHaveLength(10)
    expect(idsAfterReset).not.toEqual(idsBeforeReset)
  })

  it('appends exactly one patient on addNew', async () => {
    stubExternalApi()
    await caller.patients.list()

    await caller.patients.addNew()

    const patients = await caller.patients.list()
    expect(patients).toHaveLength(11)
  })
})
