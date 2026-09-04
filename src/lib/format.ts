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
