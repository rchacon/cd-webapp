import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LookupForm } from '../../src/components/LookupForm'
import { CdServerError, getDistrict, getRepresentatives, getSenators, getStates } from '../../src/lib/cdServer'

vi.mock('../../src/lib/cdServer', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/cdServer')>('../../src/lib/cdServer')
  return {
    ...actual,
    getStates: vi.fn(),
    getDistrict: vi.fn(),
    getRepresentatives: vi.fn(),
    getSenators: vi.fn(),
  }
})

const STATES = [
  { abbr: 'CA', name: 'California', seats: 52, votingSeats: true },
  { abbr: 'PR', name: 'Puerto Rico', seats: 1, votingSeats: false },
]

const REP = {
  bioguideId: 'A000000',
  firstName: 'Jane',
  middleName: null,
  lastName: 'Doe',
  nickname: null,
  suffix: null,
  role: 'Representative',
  district: 12,
  party: 'Independent',
  phone: null,
  website: null,
  photoUrl: null,
}

const SENATOR = {
  bioguideId: 'B000000',
  firstName: 'John',
  middleName: null,
  lastName: 'Smith',
  nickname: null,
  suffix: null,
  party: 'Independent',
  phone: null,
  website: null,
  photoUrl: null,
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getStates).mockResolvedValue(STATES)
})

describe('address lookup availability regression', () => {
  it('keeps the address flow usable while getStates() is still pending', async () => {
    vi.mocked(getStates).mockReturnValue(new Promise(() => {}))
    const user = userEvent.setup()
    render(<LookupForm />)

    await user.click(screen.getByRole('button', { name: /enter your address instead/i }))

    expect(screen.getByPlaceholderText(/street address/i)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /^search$/i })).not.toBeDisabled()
  })

  it('keeps the address flow usable after getStates() rejects', async () => {
    vi.mocked(getStates).mockRejectedValue(new CdServerError('states unavailable'))
    const user = userEvent.setup()
    render(<LookupForm />)

    await screen.findByText(/couldn't load the list of states/i)
    await user.click(screen.getByRole('button', { name: /enter your address instead/i }))

    expect(screen.getByPlaceholderText(/street address/i)).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /^search$/i })).not.toBeDisabled()
  })
})

describe('chamber/mode switching regression', () => {
  it('disables chamber radios and the mode toggle while a search is in flight, and re-enables them after', async () => {
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.type(screen.getByPlaceholderText(/district number/i), '12')

    const { promise, resolve } = deferred<typeof REP[]>()
    vi.mocked(getRepresentatives).mockReturnValueOnce(promise)

    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(screen.getByRole('radio', { name: 'Representatives' })).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Senators' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /enter your address instead/i })).toBeDisabled()

    resolve([REP])

    await waitFor(() => expect(screen.getByRole('radio', { name: 'Representatives' })).not.toBeDisabled())
    expect(screen.getByRole('radio', { name: 'Senators' })).not.toBeDisabled()
    expect(screen.getByRole('button', { name: /enter your address instead/i })).not.toBeDisabled()
  })

  it('clears a selected state that is not senate-eligible when switching to Senators', async () => {
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'Puerto Rico')

    await user.click(screen.getByRole('radio', { name: 'Senators' }))

    expect(screen.getByRole('combobox')).toHaveValue('')
  })
})

describe('district number input constraints', () => {
  it('constrains to 1..seats and hints the range for a multi-seat state', async () => {
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')

    const districtInput = screen.getByPlaceholderText('District number (1–52)')
    expect(districtInput).toHaveAttribute('min', '1')
    expect(districtInput).toHaveAttribute('max', '52')
  })

  it('constrains to exactly 0 and hints at-large for a single-seat state', async () => {
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'Puerto Rico')

    const districtInput = screen.getByPlaceholderText('District number (0 for at-large)')
    expect(districtInput).toHaveAttribute('min', '0')
    expect(districtInput).toHaveAttribute('max', '0')
  })

  it('clears a stale district value when the selected state changes', async () => {
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.type(screen.getByPlaceholderText('District number (1–52)'), '45')

    await user.selectOptions(stateSelect, 'Puerto Rico')

    expect(screen.getByPlaceholderText('District number (0 for at-large)')).toHaveValue(null)
  })

  it('has no min/max constraint before a state is selected', async () => {
    render(<LookupForm />)

    const districtInput = await screen.findByPlaceholderText('District number')
    expect(districtInput).toHaveAttribute('min', '0')
    expect(districtInput).not.toHaveAttribute('max')
  })

  it('rejects an empty district value at the JS level, not just via the required attribute', async () => {
    const user = userEvent.setup()
    const { container } = render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')

    // Bypass native HTML5 constraint validation (which a real browser would
    // enforce on a user-triggered submit) to exercise handleSubmit's own guard.
    fireEvent.submit(container.querySelector('form')!)

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid district number.')
    expect(getRepresentatives).not.toHaveBeenCalled()
  })
})

describe('search flows', () => {
  it('submits a senators-by-state search and renders the results', async () => {
    vi.mocked(getSenators).mockResolvedValueOnce([SENATOR])
    const user = userEvent.setup()
    render(<LookupForm />)

    await user.click(screen.getByRole('radio', { name: 'Senators' }))
    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(getSenators).toHaveBeenCalledWith('CA')
    expect(await screen.findByText('John Smith')).toBeInTheDocument()
  })

  it('submits a representatives-by-district search', async () => {
    vi.mocked(getRepresentatives).mockResolvedValueOnce([REP])
    const user = userEvent.setup()
    render(<LookupForm />)

    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.type(screen.getByPlaceholderText(/district number/i), '12')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(getRepresentatives).toHaveBeenCalledWith('CA', 12)
    expect(await screen.findByText('Jane Doe')).toBeInTheDocument()
  })

  it('submits a representatives-by-address search by resolving the district first', async () => {
    vi.mocked(getDistrict).mockResolvedValueOnce({ state: 'CA', district: 7 })
    vi.mocked(getRepresentatives).mockResolvedValueOnce([REP])
    const user = userEvent.setup()
    render(<LookupForm />)

    await user.click(screen.getByRole('button', { name: /enter your address instead/i }))
    await user.type(screen.getByPlaceholderText(/street address/i), '1 Main St, San Francisco, CA')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    await waitFor(() => expect(getDistrict).toHaveBeenCalledWith('1 Main St, San Francisco, CA'))
    expect(getRepresentatives).toHaveBeenCalledWith('CA', 7)
  })

  it('renders the error message from a thrown CdServerError', async () => {
    vi.mocked(getSenators).mockRejectedValueOnce(new CdServerError('boom'))
    const user = userEvent.setup()
    render(<LookupForm />)

    await user.click(screen.getByRole('radio', { name: 'Senators' }))
    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
  })

  it('renders "No results found." for an empty result set', async () => {
    vi.mocked(getSenators).mockResolvedValueOnce([])
    const user = userEvent.setup()
    render(<LookupForm />)

    await user.click(screen.getByRole('radio', { name: 'Senators' }))
    const stateSelect = await screen.findByRole('combobox')
    await waitFor(() => expect(stateSelect).not.toBeDisabled())
    await user.selectOptions(stateSelect, 'California')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(await screen.findByText('No results found.')).toBeInTheDocument()
  })
})
