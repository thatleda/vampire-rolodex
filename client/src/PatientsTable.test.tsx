import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { trpcMsw } from './mocks/handlers.ts'
import { server } from './mocks/server.ts'
import { PatientsTable } from './PatientsTable.tsx'
import { renderWithTrpc } from './test-utils.tsx'

function trpcError(message: string) {
  return Object.assign(new Error(message), { code: 'INTERNAL_SERVER_ERROR' })
}

function manyPatientsWithNoObservations(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `haha-patient-page-test-${index + 1}`,
    birthdate: '1980-01-01T00:00:00.000Z',
    gender: 1,
    ethnicity: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    observations: [],
  }))
}

describe('patientsTable', () => {
  it('renders one row per observation for a patient with many', async () => {
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('11.10.2019')
    expect(screen.getByText('07.11.2019')).toBeInTheDocument()
    expect(screen.getByText('16.12.2019')).toBeInTheDocument()
  })

  it('renders a single row for a patient with exactly one observation', async () => {
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('18.05.2021')
    expect(screen.getAllByText('haha-patient-one-observation')).toHaveLength(1)
  })

  it('renders a placeholder row for a patient with no observations, instead of crashing', async () => {
    renderWithTrpc(<PatientsTable />)

    await expect(screen.findByText('No observations recorded')).resolves.toBeInTheDocument()
  })

  it('shows a dash for lab values missing on a given observation', async () => {
    renderWithTrpc(<PatientsTable />)

    const row = await screen.findByRole('row', { name: /18\.05\.2021/ })
    expect(within(row).getByText('0.26 mgdl')).toBeInTheDocument()
    expect(within(row).getAllByText('-')).toHaveLength(6)
  })

  it('resets the table back to the initial fixtures after adding new data', async () => {
    const user = userEvent.setup()
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('No observations recorded')

    await user.click(screen.getByRole('button', { name: 'Add new data' }))
    await screen.findByText('haha-patient-4')

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.queryByText('haha-patient-4')).not.toBeInTheDocument()
    expect(screen.getByText('No observations recorded')).toBeInTheDocument()
  })

  it('paginates instead of rendering every row when the list grows large', async () => {
    server.use(trpcMsw.patients.list.query(() => manyPatientsWithNoObservations(15)))
    const user = userEvent.setup()
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('haha-patient-page-test-1')
    expect(screen.getAllByText('No observations recorded')).toHaveLength(10)
    expect(screen.queryByText('haha-patient-page-test-11')).not.toBeInTheDocument()
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('haha-patient-page-test-11')).toBeInTheDocument()
    expect(screen.queryByText('haha-patient-page-test-1')).not.toBeInTheDocument()
    expect(screen.getAllByText('No observations recorded')).toHaveLength(5)
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('shows the server error message when the initial load fails', async () => {
    server.use(trpcMsw.patients.list.query(() => {
      throw trpcError('The external lab data provider returned an error (HTTP 403). Please try again shortly.')
    }))
    renderWithTrpc(<PatientsTable />)

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent('HTTP 403')
  })

  it('shows the server error message when adding new data fails, without wiping the table', async () => {
    server.use(trpcMsw.patients.addNew.mutation(() => {
      throw trpcError('Could not reach the external lab data provider. Please try again shortly.')
    }))
    const user = userEvent.setup()
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('No observations recorded')
    await user.click(screen.getByRole('button', { name: 'Add new data' }))

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent('Could not reach the external lab data provider')
    expect(screen.getByText('No observations recorded')).toBeInTheDocument()
  })

  it('shows the server error message when reset fails', async () => {
    server.use(trpcMsw.patients.reset.mutation(() => {
      throw trpcError('Could not reach the external lab data provider. Please try again shortly.')
    }))
    const user = userEvent.setup()
    renderWithTrpc(<PatientsTable />)

    await screen.findByText('No observations recorded')
    await user.click(screen.getByRole('button', { name: 'Reset' }))

    await expect(screen.findByRole('alert')).resolves.toHaveTextContent('Could not reach the external lab data provider')
  })
})
