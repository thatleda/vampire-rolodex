import { screen } from '@testing-library/react'
import App from './App.tsx'
import { renderWithTrpc } from './test-utils.tsx'

describe('app', () => {
  it('renders the app heading', () => {
    renderWithTrpc(<App />)
    expect(screen.getByRole('heading', { name: /greetings.*your patients/i })).toBeInTheDocument()
  })
})
