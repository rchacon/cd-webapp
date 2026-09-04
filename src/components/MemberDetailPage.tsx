import { useEffect, useState } from 'react'
import { getMember, type MemberDetail } from '../lib/cdServer'
import { formatMemberName, isHttpUrl } from '../lib/format'
import { RouterLink } from './RouterLink'

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'loaded'; member: MemberDetail }

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

// e.g. "U.S. Representative · CA-3", "U.S. Senator · CA", "Delegate · GU".
// The list resolvers hand back a full state name; getMember only carries
// the 2-letter code, so the seat reads as "CA-3" rather than
// "California's 3rd District".
function describeSeat(member: MemberDetail): string {
  const title =
    member.role === 'Senator' || member.role === 'Representative'
      ? `U.S. ${member.role}`
      : member.role
  if (member.role === 'Representative') {
    const seat = member.district === 0 ? `${member.state} at-large` : `${member.state}-${member.district}`
    return `${title} · ${seat}`
  }
  return `${title} · ${member.state}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

const contactLinkClass =
  'underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200'

function MemberHeader({ member }: { member: MemberDetail }) {
  const name = formatMemberName(member) || 'Unnamed'
  const website = member.website && isHttpUrl(member.website) ? member.website : null

  return (
    <div className="border-b border-white/10 pb-6">
      <div className="flex items-start gap-5">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl font-semibold text-blue-100 ring-1 ring-white/15"
          >
            {initials(name)}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {member.party && (
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-100 ring-1 ring-white/15">
                {member.party}
              </span>
            )}
            <span className="text-sm text-blue-100">{describeSeat(member)}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-blue-100">
            {member.phone && <span>{member.phone}</span>}
            {website && (
              <a href={website} target="_blank" rel="noreferrer" className={contactLinkClass}>
                {website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <a
              href={`https://www.congress.gov/member/${encodeURIComponent(member.bioguideId)}`}
              target="_blank"
              rel="noreferrer"
              className={contactLinkClass}
            >
              Congress.gov profile
            </a>
          </div>
        </div>
      </div>

      {!member.inOffice && (
        <p className="mt-5 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200 ring-1 ring-amber-400/30">
          {name} is no longer serving in the current Congress. Their contact details and
          voting history may be out of date.
        </p>
      )}
    </div>
  )
}

const backLinkClass =
  'inline-flex items-center gap-1.5 text-sm text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200'

export function MemberDetailPage({ bioguideId }: { bioguideId: string }) {
  const [state, setState] = useState<State>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    getMember(bioguideId)
      .then((member) => {
        if (!cancelled) setState({ kind: 'loaded', member })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ kind: 'error', message: errorMessage(err) })
      })
    return () => {
      cancelled = true
    }
  }, [bioguideId])

  return (
    <div className="mx-auto max-w-3xl">
      <RouterLink href="/" className={backLinkClass}>
        <span aria-hidden="true">&larr;</span>
        Back to search
      </RouterLink>

      <div className="mt-6">
        {state.kind === 'loading' && <p className="text-blue-100">Loading member…</p>}

        {state.kind === 'error' && (
          <p role="alert" className="text-sm font-medium text-red-300">
            {state.message}
          </p>
        )}

        {state.kind === 'loaded' && (
          <>
            <MemberHeader member={state.member} />
            <section className="mt-8">
              <h2 className="text-xl font-semibold text-white">
                How did {formatMemberName(state.member) || 'this member'} vote on…
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Searching this member's voting record by topic is coming soon.
              </p>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
