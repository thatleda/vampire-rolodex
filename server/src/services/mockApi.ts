export interface MockVisit {
  client_id: string
  date_testing: string
  date_birthdate: string
  gender: number
  ethnicity: number
  [labField: string]: string | number
}

export async function fetchPatientVisits(): Promise<MockVisit[]> {
  throw new Error('not implemented')
}

export async function fetchPatients(): Promise<MockVisit[][]> {
  throw new Error('not implemented')
}
