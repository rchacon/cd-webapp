import { useEffect, useState, type FormEvent } from 'react'
import {
  CdServerError,
  getDistrict,
  getRepresentatives,
  getSenators,
  getStates,
  type Member,
  type Representative,
  type Senator,
  type StateOption,
} from '../lib/cdServer'

type Chamber = 'representatives' | 'senators'
type RepMode = 'district' | 'address'

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'success'; members: Array<Representative | Senator> }

function errorMessage(err: unknown): string {
  if (err instanceof CdServerError || err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

function formatMemberName(member: Member): string {
  return [member.nickname || member.firstName, member.middleName, member.lastName, member.suffix]
    .filter(Boolean)
    .join(' ')
}

function isHttpUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

function MemberCard({ member, chamber }: { member: Representative | Senator; chamber: Chamber }) {
  // The chamber that was actually searched is the authoritative signal for
  // whether `member` is a Representative -- not whether the GraphQL response
  // happens to include a `role` field, which could drift from this component
  // if the query strings in cdServer.ts ever change independently.
  const role = chamber === 'representatives' ? (member as Representative).role : null
  return (
    <li className="rounded-2xl bg-white/10 p-5 text-left ring-1 ring-white/15">
      <div className="flex items-center gap-4">
        {member.photoUrl && (
          <img src={member.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <p className="text-lg font-semibold text-white">{formatMemberName(member) || 'Unnamed'}</p>
          {role && <p className="text-sm text-blue-300">{role}</p>}
          {member.party && <p className="text-sm text-blue-100">{member.party}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-100">
        {member.phone && <span>{member.phone}</span>}
        {member.website && isHttpUrl(member.website) && (
          <a
            href={member.website}
            target="_blank"
            rel="noreferrer"
            className="underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
          >
            Website
          </a>
        )}
      </div>
    </li>
  )
}

const inputClass =
  'w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-navy-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50'
const radioLabelClass =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white has-[:checked]:border-blue-400 has-[:checked]:bg-blue-500/20 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50'
const toggleButtonClass =
  'text-sm font-medium text-blue-300 underline decoration-blue-300/40 underline-offset-4 transition-colors hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60'
const submitButtonClass =
  'rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60'

export function LookupForm() {
  const [states, setStates] = useState<StateOption[] | null>(null)
  const [statesError, setStatesError] = useState<string | null>(null)

  const [chamber, setChamber] = useState<Chamber>('representatives')
  const [repMode, setRepMode] = useState<RepMode>('district')
  const [stateCode, setStateCode] = useState('')
  const [district, setDistrict] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  useEffect(() => {
    let cancelled = false
    getStates()
      .then((result) => {
        if (!cancelled) setStates(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setStatesError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const senateEligibleStates = states?.filter((s) => s.votingSeats) ?? []

  const selectedState = states?.find((s) => s.abbr === stateCode)
  // At-large states (a single seat) use district 0; every other state numbers districts 1..seats.
  const isAtLargeState = selectedState?.seats === 1
  const districtMin = selectedState && !isAtLargeState ? 1 : 0
  const districtMax = selectedState && (isAtLargeState ? 0 : selectedState.seats)

  function resetStatus() {
    if (status.kind !== 'loading') setStatus({ kind: 'idle' })
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus({ kind: 'loading' })
    try {
      if (chamber === 'senators') {
        const members = await getSenators(stateCode)
        setStatus({ kind: 'success', members })
        return
      }

      let resolvedState = stateCode
      let resolvedDistrict: number
      if (repMode === 'address') {
        const resolved = await getDistrict(address)
        resolvedState = resolved.state
        resolvedDistrict = resolved.district
      } else {
        resolvedDistrict = Number(district)
        // Number('') is 0, not NaN -- an empty field would otherwise silently
        // query an at-large district instead of being rejected. The `required`
        // attribute normally blocks this, but that's a UI-layer constraint,
        // not a guarantee handleSubmit itself can rely on.
        if (district.trim() === '' || !Number.isInteger(resolvedDistrict)) {
          throw new CdServerError('Enter a valid district number.')
        }
      }
      const members = await getRepresentatives(resolvedState, resolvedDistrict)
      setStatus({ kind: 'success', members })
    } catch (err) {
      setStatus({ kind: 'error', message: errorMessage(err) })
    }
  }

  const isLoading = status.kind === 'loading'
  const usesAddressLookup = chamber === 'representatives' && repMode === 'address'
  const formDisabled = isLoading || (!usesAddressLookup && !states)

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Find your representatives
      </h1>
      <p className="mt-3 text-blue-100">
        Look up your U.S. senators or House representative by state and district, or by address.
      </p>

      {statesError && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-300">
          Couldn't load the list of states: {statesError}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <fieldset className="flex gap-3">
          <legend className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Chamber
          </legend>
          <label className={radioLabelClass}>
            <input
              type="radio"
              name="chamber"
              value="representatives"
              checked={chamber === 'representatives'}
              onChange={() => {
                setChamber('representatives')
                resetStatus()
              }}
              disabled={isLoading}
              className="accent-blue-400"
            />
            Representatives
          </label>
          <label className={radioLabelClass}>
            <input
              type="radio"
              name="chamber"
              value="senators"
              checked={chamber === 'senators'}
              onChange={() => {
                setChamber('senators')
                if (!senateEligibleStates.some((s) => s.abbr === stateCode)) setStateCode('')
                resetStatus()
              }}
              disabled={isLoading}
              className="accent-blue-400"
            />
            Senators
          </label>
        </fieldset>

        {chamber === 'senators' && (
          <select
            value={stateCode}
            onChange={(e) => {
              setStateCode(e.target.value)
              resetStatus()
            }}
            required
            disabled={formDisabled}
            className={inputClass}
          >
            <option value="">Select a state</option>
            {senateEligibleStates.map((s) => (
              <option key={s.abbr} value={s.abbr}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {chamber === 'representatives' && (
          <>
            <button
              type="button"
              onClick={() => {
                setRepMode((m) => (m === 'district' ? 'address' : 'district'))
                resetStatus()
              }}
              disabled={isLoading}
              className={toggleButtonClass}
            >
              {repMode === 'district'
                ? "Don't know your district? Enter your address instead"
                : 'Enter state & district instead'}
            </button>

            {repMode === 'district' ? (
              <div className="flex gap-3">
                <select
                  value={stateCode}
                  onChange={(e) => {
                    setStateCode(e.target.value)
                    setDistrict('')
                    resetStatus()
                  }}
                  required
                  disabled={formDisabled}
                  className={inputClass}
                >
                  <option value="">Select a state</option>
                  {states?.map((s) => (
                    <option key={s.abbr} value={s.abbr}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={districtMin}
                  max={districtMax}
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value)
                    resetStatus()
                  }}
                  placeholder={
                    selectedState
                      ? isAtLargeState
                        ? 'District number (0 for at-large)'
                        : `District number (1–${selectedState.seats})`
                      : 'District number'
                  }
                  required
                  disabled={formDisabled}
                  className={inputClass}
                />
              </div>
            ) : (
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value)
                  resetStatus()
                }}
                placeholder="Street address, city, state, ZIP"
                required
                disabled={formDisabled}
                className={inputClass}
              />
            )}
          </>
        )}

        <button type="submit" disabled={formDisabled} className={submitButtonClass}>
          {isLoading ? 'Searching…' : 'Search'}
        </button>

        {status.kind === 'error' && (
          <p role="alert" className="text-sm font-medium text-red-300">
            {status.message}
          </p>
        )}
      </form>

      {status.kind === 'success' && (
        <ul className="mt-8 space-y-4">
          {status.members.length === 0 ? (
            <p className="text-blue-100">No results found.</p>
          ) : (
            status.members.map((member) => (
              <MemberCard key={member.bioguideId} member={member} chamber={chamber} />
            ))
          )}
        </ul>
      )}
    </div>
  )
}
