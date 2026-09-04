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
