import type { Member } from './cdServer'

type NameParts = Pick<Member, 'firstName' | 'middleName' | 'lastName' | 'nickname' | 'suffix'>

// nickname/firstName is an `||`, not `??`, on purpose: cd-server sends an
// empty string (not null) for a member with no recorded nickname, and an
// empty nickname should still fall through to the first name.
export function formatMemberName(member: NameParts): string {
  return [member.nickname || member.firstName, member.middleName, member.lastName, member.suffix]
    .filter(Boolean)
    .join(' ')
}

// Delegates (DC and the five territories) and Puerto Rico's Resident
// Commissioner hold House seats and vote in committee, but not on floor
// passage -- so "voting record" doesn't apply to them the way it does
// to a Senator or Representative. Matches cd-lib's role vocabulary.
const NON_VOTING_ROLES = new Set(['Delegate', 'Resident Commissioner'])

export function isNonVotingRole(role: string): boolean {
  return NON_VOTING_ROLES.has(role)
}

export function isHttpUrl(url: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

// cd-server relays Congress.gov's party names verbatim, and they arrive
// SHOUTING ("DEMOCRATIC", "REPUBLICAN", "INDEPENDENT"). Title-case an
// all-caps value for display; leave anything already mixed-case alone.
export function formatParty(party: string): string {
  if (party !== party.toUpperCase()) return party
  return party.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

// A URL trimmed for display next to a member: no scheme, no trailing
// slash (cd-server hands back e.g. "https://ocasio-cortez.house.gov/").
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

// A `tel:` URI from a display phone number ("(202) 225-2523" ->
// "tel:+12022252523") so it's tappable on mobile. Congress numbers are
// all US/NANP: a bare 10-digit number gets a +1, a leading 1 is treated
// as the country code.
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `tel:+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `tel:+${digits}`
  return `tel:${digits}`
}
