import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../src/App'
import { useAuth } from '../src/auth/session'
import { getMember } from '../src/lib/cdServer'

vi.mock('../src/auth/session', () => ({ useAuth: vi.fn() }))
vi.mock('../src/lib/cdServer', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/cdServer')>('../src/lib/cdServer')
  return {
    ...actual,
    getStates: vi.fn().mockResolvedValue([]),
    getMember: vi.fn(),
  }
})

const LOGGED_OUT = {
  displayName: null,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
}

beforeEach(() => {
  vi.clearAllMocks()
  window.history.pushState({}, '', '/')
})

describe('App', () => {
  it('links the logo to civicdog.com', () => {
    vi.mocked(useAuth).mockReturnValue({
      displayName: null,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    })
    render(<App />)

    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://civicdog.com')
  })

  it('renders neither the login button nor the greeting while loading', () => {
    vi.mocked(useAuth).mockReturnValue({
      displayName: null,
      isLoading: true,
      login: vi.fn(),
      logout: vi.fn(),
    })
    render(<App />)

    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/^hi,/i)).not.toBeInTheDocument()
  })

  it('shows a login button when logged out, which calls login on click', async () => {
    const login = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      displayName: null,
      isLoading: false,
      login,
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /log in \/ sign up/i }))

    expect(login).toHaveBeenCalled()
  })

  it('shows a greeting and logout button when logged in, which calls logout on click', async () => {
    const logout = vi.fn()
    vi.mocked(useAuth).mockReturnValue({
      displayName: 'Ada',
      isLoading: false,
      login: vi.fn(),
      logout,
    })
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByText('Hi, Ada')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /log out/i }))

    expect(logout).toHaveBeenCalled()
  })

  it('renders the copyright footer with the current year', () => {
    vi.mocked(useAuth).mockReturnValue({
      displayName: null,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    })
    render(<App />)

    expect(
      screen.getByText(`© ${new Date().getFullYear()} CivicDog. All rights reserved.`),
    ).toBeInTheDocument()
  })

  it('renders the lookup form at /', () => {
    vi.mocked(useAuth).mockReturnValue(LOGGED_OUT)
    render(<App />)

    expect(screen.getByRole('heading', { name: /find your representatives/i })).toBeInTheDocument()
  })

  it('renders the member detail page at /member/:bioguideId', async () => {
    vi.mocked(useAuth).mockReturnValue(LOGGED_OUT)
    vi.mocked(getMember).mockResolvedValueOnce({
      bioguideId: 'K000401',
      firstName: 'Kevin',
      middleName: null,
      lastName: 'Kiley',
      nickname: null,
      suffix: null,
      role: 'Representative',
      district: 3,
      state: 'CA',
      party: 'Republican',
      phone: null,
      website: null,
      photoUrl: null,
      inOffice: true,
    })
    window.history.pushState({}, '', '/member/K000401')
    render(<App />)

    expect(getMember).toHaveBeenCalledWith('K000401')
    expect(await screen.findByRole('heading', { name: 'Kevin Kiley' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: /find your representatives/i }),
    ).not.toBeInTheDocument()
  })
})
