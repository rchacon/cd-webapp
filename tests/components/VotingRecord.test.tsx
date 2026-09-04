import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VotingRecord } from '../../src/components/VotingRecord'
import { CdServerError, searchBills, type Bill, type MemberDetail } from '../../src/lib/cdServer'

vi.mock('../../src/lib/cdServer', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/cdServer')>(
    '../../src/lib/cdServer',
  )
  return { ...actual, searchBills: vi.fn() }
})

const REP: MemberDetail = {
  bioguideId: 'O000172',
  firstName: 'Alexandria',
  middleName: null,
  lastName: 'Ocasio-Cortez',
  nickname: null,
  suffix: null,
  role: 'Representative',
  district: 14,
  state: 'NY',
  party: 'DEMOCRATIC',
  phone: null,
  website: null,
  photoUrl: null,
  inOffice: true,
}

const BILL: Bill = {
  billKey: '119-hr-2056',
  congress: 119,
  billType: 'HR',
  billNumber: 2056,
  title: 'District of Columbia Federal Immigration Compliance Act of 2025',
  policyArea: 'Immigration',
  crsSummary: '<p><strong>DC Immigration Compliance Act</strong></p><p>Bars DC from limiting cooperation.</p>',
  votes: [
    { voteCast: 'NAY', voteQuestion: 'On Passage', result: 'Passed', voteDate: '2025-06-12' },
  ],
}

function deferred<T>() {
  let resolve!: (v: T) => void
  let reject!: (r: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('role branches', () => {
  it('a Delegate gets a non-voting message and no search box', () => {
    render(<VotingRecord member={{ ...REP, role: 'Delegate' }} />)

    expect(screen.getByText(/can vote in committee but not on House floor passage/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('the Resident Commissioner gets the non-voting message too', () => {
    render(<VotingRecord member={{ ...REP, role: 'Resident Commissioner' }} />)

    expect(screen.getByText(/As the Resident Commissioner/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('a Senator gets "coming soon" and no search box', () => {
    render(<VotingRecord member={{ ...REP, role: 'Senator', district: null }} />)

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    expect(screen.getByText(/Senate roll-call data/i)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('a Representative gets the topic search box', () => {
    render(<VotingRecord member={REP} />)

    expect(
      screen.getByRole('heading', { name: /How did Alexandria Ocasio-Cortez vote on/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })
})

describe('search flow (Representative)', () => {
  it('queries searchBills with the bioguide id and the typed topic, and renders a bill + vote', async () => {
    vi.mocked(searchBills).mockResolvedValueOnce([BILL])
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.type(screen.getByRole('textbox'), 'immigration enforcement')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(searchBills).toHaveBeenCalledWith('O000172', 'immigration enforcement')

    expect(await screen.findByText(BILL.title!)).toBeInTheDocument()
    expect(screen.getByText('H.R. 2056 · 119th Congress')).toBeInTheDocument()
    expect(screen.getByText('Voted Nay')).toBeInTheDocument()
    expect(screen.getByText('On Passage · Passed · June 12, 2025')).toBeInTheDocument()
    // CRS summary HTML is flattened to text.
    expect(screen.getByText(/Bars DC from limiting cooperation\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View full bill on Congress\.gov/i })).toHaveAttribute(
      'href',
      'https://www.congress.gov/bill/119th-congress/house-bill/2056',
    )
  })

  it('shows a "no vote on record" note for a matched bill the member never voted on', async () => {
    vi.mocked(searchBills).mockResolvedValueOnce([{ ...BILL, votes: [] }])
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.type(screen.getByRole('textbox'), 'immigration')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(
      await screen.findByText(/No recorded vote for Alexandria Ocasio-Cortez on this bill/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Voted /)).not.toBeInTheDocument()
  })

  it('shows an empty state when nothing matched', async () => {
    vi.mocked(searchBills).mockResolvedValueOnce([])
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.type(screen.getByRole('textbox'), 'cryptocurrency mining energy limits')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(
      await screen.findByText(/No bills matched .cryptocurrency mining energy limits./i),
    ).toBeInTheDocument()
  })

  it('a suggested-topic chip runs that search', async () => {
    vi.mocked(searchBills).mockResolvedValueOnce([BILL])
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.click(screen.getByRole('button', { name: 'immigration enforcement' }))

    expect(searchBills).toHaveBeenCalledWith('O000172', 'immigration enforcement')
    expect(await screen.findByText(BILL.title!)).toBeInTheDocument()
  })

  it('shows an error panel with a working retry when the search fails', async () => {
    vi.mocked(searchBills).mockRejectedValueOnce(new CdServerError('cd-api request failed: 503'))
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.type(screen.getByRole('textbox'), 'immigration')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/temporarily unavailable/i)

    vi.mocked(searchBills).mockResolvedValueOnce([BILL])
    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(searchBills).toHaveBeenLastCalledWith('O000172', 'immigration')
    expect(await screen.findByText(BILL.title!)).toBeInTheDocument()
  })

  it('disables the input and button while a search is in flight', async () => {
    const { promise, resolve } = deferred<Bill[]>()
    vi.mocked(searchBills).mockReturnValueOnce(promise)
    const user = userEvent.setup()
    render(<VotingRecord member={REP} />)

    await user.type(screen.getByRole('textbox'), 'immigration')
    await user.click(screen.getByRole('button', { name: /^search$/i }))

    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: /searching/i })).toBeDisabled()

    resolve([BILL])
    await waitFor(() => expect(screen.getByRole('textbox')).not.toBeDisabled())
  })
})
