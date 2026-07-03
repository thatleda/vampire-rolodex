import { formatDate } from './formatDate.ts'

describe('formatDate', () => {
  it('converts an ISO date string to DD.MM.YYYY', () => {
    expect(formatDate('2019-10-11T00:00:00.000Z')).toBe('11.10.2019')
  })

  it('handles single-digit days and months without losing zero-padding', () => {
    expect(formatDate('2021-05-08T00:00:00.000Z')).toBe('08.05.2021')
  })
})
