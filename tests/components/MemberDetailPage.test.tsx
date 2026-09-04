import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemberDetailPage } from '../../src/components/MemberDetailPage'
import { CdServerError, getMember, type MemberDetail } from '../../src/lib/cdServer'

vi.mock('../../src/lib/cdServer', async () => {
  const actual = await vi.importActual<typeof import('../../src/lib/cdServer')>(
    '../../src/lib/cdServer',
  )
  return { ...actual, getMember: vi.fn() }
})

const MEMBER: MemberDetail = {
  bioguideId: 'K000401',
  firstName: 'Kevin',
  middleName: null,
  lastName: 'Kiley',
  nickname: null,
  suffix: null,
  role: 'Representative',
  district: 3,
  state: 'CA',
  party: 'REPUBLICAN',
  phone: '(202) 225-2523',
  website: 'https://kiley.house.gov',
  photoUrl: null,
  inOffice: true,
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
  window.history.pushState({}, '', '/member/K000401')
})

describe('MemberDetailPage', () => {
  it('requests the member by the bioguide id it is given', () => {
    vi.mocked(getMember).mockReturnValue(new Promise(() => {}))
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(getMember).toHaveBeenCalledWith('K000401')
  })

  it('shows a loading state until the request resolves', async () => {
    const { promise, resolve } = deferred<MemberDetail>()
    vi.mocked(getMember).mockReturnValue(promise)
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(screen.getByText(/loading member/i)).toBeInTheDocument()

    resolve(MEMBER)
    expect(await screen.findByRole('heading', { name: 'Kevin Kiley' })).toBeInTheDocument()
    expect(screen.queryByText(/loading member/i)).not.toBeInTheDocument()
  })

  it('renders the name, party, and seat once loaded', async () => {
    vi.mocked(getMember).mockResolvedValueOnce(MEMBER)
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(await screen.findByRole('heading', { name: 'Kevin Kiley' })).toBeInTheDocument()
    // cd-server relays "REPUBLICAN"; the page title-cases it.
    expect(screen.getByText('Republican')).toBeInTheDocument()
    expect(screen.getByText('U.S. Representative · CA-3')).toBeInTheDocument()
  })

  it('describes an at-large representative as "at-large" rather than district 0', async () => {
    vi.mocked(getMember).mockResolvedValueOnce({
      ...MEMBER,
      state: 'AK',
      district: 0,
    })
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(await screen.findByText('U.S. Representative · AK at-large')).toBeInTheDocument()
  })

  it('describes a senator without a district', async () => {
    vi.mocked(getMember).mockResolvedValueOnce({
      ...MEMBER,
      role: 'Senator',
      district: null,
    })
    render(<MemberDetailPage bioguideId="P000145" />)

    expect(await screen.findByText('U.S. Senator · CA')).toBeInTheDocument()
  })

  it('links an http(s) website, shown without scheme or trailing slash', async () => {
    vi.mocked(getMember).mockResolvedValueOnce({
      ...MEMBER,
      website: 'https://kiley.house.gov/',
    })
    render(<MemberDetailPage bioguideId="K000401" />)

    // Label is trimmed for display; href keeps the real URL.
    expect(await screen.findByRole('link', { name: 'kiley.house.gov' })).toHaveAttribute(
      'href',
      'https://kiley.house.gov/',
    )
  })

  it('never renders a non-http(s) website', async () => {
    vi.mocked(getMember).mockResolvedValueOnce({ ...MEMBER, website: 'javascript:alert(1)' })
    render(<MemberDetailPage bioguideId="K000401" />)

    await screen.findByRole('heading', { name: 'Kevin Kiley' })
    expect(screen.queryByText(/javascript:/)).not.toBeInTheDocument()
  })

  it('links to the Congress.gov profile by bioguide id', async () => {
    vi.mocked(getMember).mockResolvedValueOnce(MEMBER)
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(await screen.findByRole('link', { name: /congress\.gov profile/i })).toHaveAttribute(
      'href',
      'https://www.congress.gov/member/K000401',
    )
  })

  it('flags a member who has left the current Congress', async () => {
    vi.mocked(getMember).mockResolvedValueOnce({ ...MEMBER, inOffice: false })
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(
      await screen.findByText(/no longer serving in the current congress/i),
    ).toBeInTheDocument()
  })

  it('does not flag a sitting member', async () => {
    vi.mocked(getMember).mockResolvedValueOnce(MEMBER)
    render(<MemberDetailPage bioguideId="K000401" />)

    await screen.findByRole('heading', { name: 'Kevin Kiley' })
    expect(screen.queryByText(/no longer serving/i)).not.toBeInTheDocument()
  })

  it('shows the error message from a thrown CdServerError', async () => {
    vi.mocked(getMember).mockRejectedValueOnce(new CdServerError('cd-api request failed: 404'))
    render(<MemberDetailPage bioguideId="X000000" />)

    expect(await screen.findByRole('alert')).toHaveTextContent('cd-api request failed: 404')
  })

  it('keeps a working link back to the search page', async () => {
    vi.mocked(getMember).mockResolvedValueOnce(MEMBER)
    render(<MemberDetailPage bioguideId="K000401" />)

    expect(screen.getByRole('link', { name: /back to search/i })).toHaveAttribute('href', '/')
  })
})
