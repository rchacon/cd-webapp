import { memo, useRef, useState, type ReactNode } from 'react'
import { searchBills, type Bill, type MemberDetail } from '../lib/cdServer'
import {
  congressGovBillUrl,
  congressLabel,
  errorMessage,
  formatBillId,
  formatMemberName,
  formatVoteCast,
  formatVoteDate,
  isNonVotingRole,
  plainText,
  truncate,
  voteTone,
  type VoteTone,
} from '../lib/format'

// Polarizing, and each currently returns bills from searchBills against
// the recorded-vote corpus (checked 2026-09-04). If the corpus shifts
// and one starts coming back empty, swap it -- there's no "popular
// topics" endpoint to drive these from.
const SUGGESTED_TOPICS = [
  'immigration enforcement',
  'firearm regulation',
  'abortion access',
  'transgender rights',
]
const SUMMARY_MAX = 280

const inputClass =
  'w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-navy-900 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50'
const submitButtonClass =
  'shrink-0 rounded-full bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60'
const chipClass =
  'rounded-full bg-white/10 px-3 py-1 text-xs text-blue-100 ring-1 ring-white/15 transition-colors hover:bg-white/15'

type SearchState =
  | { kind: 'idle' }
  | { kind: 'loading'; q: string }
  | { kind: 'error'; q: string }
  | { kind: 'done'; q: string; bills: Bill[] }

// Which branch of the voting-record section a member gets. Representatives
// get the real topic search; non-voting House members (Delegate / Resident
// Commissioner) have no floor votes to search; the Senate roll-call feed
// isn't in the ETL pipeline yet.
export function VotingRecord({ member }: { member: MemberDetail }) {
  const name = formatMemberName(member) || 'this member'

  if (isNonVotingRole(member.role)) {
    const seat = member.role === 'Resident Commissioner' ? 'the Resident Commissioner' : 'a Delegate'
    return (
      <Section>
        <h2 className="text-xl font-semibold text-white">Voting record</h2>
        <p className="mt-2 max-w-prose text-sm text-blue-100">
          As {seat}, {name} can vote in committee but not on House floor passage, so there is no
          floor voting record to search.
        </p>
      </Section>
    )
  }

  if (member.role === 'Senator') {
    return (
      <Section>
        <h2 className="text-xl font-semibold text-white">Voting record</h2>
        <p className="mt-2 max-w-prose text-sm text-blue-100">
          Searching a senator&rsquo;s votes by topic is coming soon.
        </p>
      </Section>
    )
  }

  if (member.role === 'Representative') {
    return <VoteSearch bioguideId={member.bioguideId} name={name} />
  }

  // Any other / unexpected role string: no assumptions, no query.
  return (
    <Section>
      <h2 className="text-xl font-semibold text-white">Voting record</h2>
      <p className="mt-2 max-w-prose text-sm text-blue-100">
        No floor voting record is available for {name}.
      </p>
    </Section>
  )
}

function Section({ children }: { children: ReactNode }) {
  return <section className="mt-8">{children}</section>
}

function VoteSearch({ bioguideId, name }: { bioguideId: string; name: string }) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>({ kind: 'idle' })
  // Ignore a resolved/rejected search once a newer one has been kicked off.
  const requestId = useRef(0)

  function run(raw: string) {
    const q = raw.trim()
    if (!q) return
    const id = ++requestId.current
    setState({ kind: 'loading', q })
    searchBills(bioguideId, q)
      .then((bills) => {
        if (id === requestId.current) setState({ kind: 'done', q, bills })
      })
      .catch((err: unknown) => {
        if (id === requestId.current) {
          console.error('searchBills failed', errorMessage(err))
          setState({ kind: 'error', q })
        }
      })
  }

  const loading = state.kind === 'loading'

  return (
    <Section>
      <h2 className="text-xl font-semibold text-white">How did {name} vote on&hellip;</h2>
      <p className="mt-2 max-w-prose text-sm text-blue-100">
        Search {name}&rsquo;s floor votes by topic &mdash; plain language, no bill numbers needed.
      </p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          run(query)
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. teaching gender identity in schools"
          disabled={loading}
          className={inputClass}
        />
        <button type="submit" disabled={loading || !query.trim()} className={submitButtonClass}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {state.kind === 'idle' && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-300">Try</span>
          {SUGGESTED_TOPICS.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setQuery(topic)
                run(topic)
              }}
              className={chipClass}
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="mt-6 text-sm text-blue-100">Searching {name}&rsquo;s votes&hellip;</p>}

      {state.kind === 'error' && (
        <div
          role="alert"
          className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/30"
        >
          <p className="font-semibold">Search is temporarily unavailable</p>
          <p className="mt-1 text-red-200/90">
            We couldn&rsquo;t run that search just now &mdash; this is on our side, not your query.
          </p>
          <button
            type="button"
            onClick={() => run(state.q)}
            className="mt-3 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
          >
            Try again
          </button>
        </div>
      )}

      {state.kind === 'done' && <Results q={state.q} bills={state.bills} name={name} />}
    </Section>
  )
}

function Results({ q, bills, name }: { q: string; bills: Bill[]; name: string }) {
  if (bills.length === 0) {
    return (
      <div className="mt-6 rounded-xl bg-white/5 px-5 py-8 text-center ring-1 ring-white/10">
        <p className="text-base font-semibold text-white">No bills matched &ldquo;{q}&rdquo;</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-blue-100">
          Search covers bills that have come up for a recorded House floor vote &mdash; a narrow
          topic can match none. Try a broader topic, or word it differently.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="mt-6 text-sm text-blue-100">
        <span className="font-semibold text-white">
          {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
        </span>{' '}
        related to &ldquo;{q}&rdquo;, closest matches first.
      </p>
      <ul className="mt-4 space-y-4">
        {bills.map((bill) => (
          <BillResult key={bill.billKey} bill={bill} name={name} />
        ))}
      </ul>
      <p className="mt-6 max-w-prose text-xs text-blue-300/80">
        Covers only bills that have come up for a recorded House floor vote &mdash; a small share
        of all bills introduced. A narrow topic can return very few, or none.
      </p>
    </>
  )
}

// memo: the search input stays editable in the 'done' state, so a
// keystroke re-renders Results and every row. `bill` is a stable
// reference from the results array, so memo skips the row entirely --
// and with it the DOMParser pass in plainText() for each CRS summary.
const BillResult = memo(function BillResult({ bill, name }: { bill: Bill; name: string }) {
  const summary = bill.crsSummary ? truncate(plainText(bill.crsSummary), SUMMARY_MAX) : null
  const billUrl = congressGovBillUrl(bill.congress, bill.billType, bill.billNumber)

  return (
    <li className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-semibold text-blue-100">
          {formatBillId(bill.billType, bill.billNumber)} &middot; {congressLabel(bill.congress)}
        </span>
        {bill.policyArea && (
          <span className="rounded bg-white/10 px-2 py-0.5 text-xs font-medium text-blue-200 ring-1 ring-white/15">
            {bill.policyArea}
          </span>
        )}
      </div>

      {bill.title && <h3 className="mt-2 text-lg font-semibold text-white">{bill.title}</h3>}
      {summary && <p className="mt-2 text-sm leading-relaxed text-blue-100">{summary}</p>}

      {bill.votes.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {bill.votes.map((vote, i) => (
            <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <VotePill voteCast={vote.voteCast} />
              <span className="text-sm text-blue-100">
                {vote.voteQuestion} &middot; {vote.result} &middot; {formatVoteDate(vote.voteDate)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-white/10 pt-4 text-sm italic text-blue-300/80">
          No recorded vote for {name} on this bill &mdash; it matched your topic, but they have no
          vote on record for it.
        </p>
      )}

      {billUrl && (
        <a
          href={billUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-blue-300 underline decoration-blue-300/40 underline-offset-4 hover:text-blue-200"
        >
          View full bill on Congress.gov &rarr;
        </a>
      )}
    </li>
  )
})

const VOTE_PILL_CLASSES: Record<VoteTone, string> = {
  yea: 'bg-green-500/15 text-green-300 ring-green-400/30',
  nay: 'bg-red-500/15 text-red-300 ring-red-400/30',
  present: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  none: 'bg-white/10 text-blue-200 ring-white/15',
}

function VotePill({ voteCast }: { voteCast: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${VOTE_PILL_CLASSES[voteTone(voteCast)]}`}
    >
      {formatVoteCast(voteCast)}
    </span>
  )
}
