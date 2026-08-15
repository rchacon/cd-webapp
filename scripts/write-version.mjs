import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const SHA_RE = /^[0-9a-f]{7,40}$/i

function isSha(value) {
  return typeof value === 'string' && SHA_RE.test(value.trim())
}

function getCommit() {
  // Amplify injects AWS_COMMIT_ID at build time -- prefer it over running git
  // directly, since it's correct regardless of Amplify's clone strategy/depth.
  // Validated rather than trusted outright: a real prod build produced the
  // literal string "HEAD" here instead of a real hash. Root cause unconfirmed
  // (couldn't reproduce a git-rev-parse quirk that does this locally, even
  // against an unborn/corrupted HEAD -- those just throw, as expected), but
  // most likely AWS_COMMIT_ID itself was set to "HEAD" in that build. Either
  // way, don't trust either source without checking it's actually hex.
  const injected = process.env.AWS_COMMIT_ID
  if (isSha(injected)) return injected.trim().slice(0, 7)

  try {
    // --verify: fail loudly on an unresolvable HEAD rather than risk any
    // similarly non-obvious success-with-garbage-output failure mode.
    const out = execSync('git rev-parse --verify --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
    if (isSha(out)) return out
  } catch {
    // Not a git repo, or HEAD unresolvable -- fall through to 'unknown'.
  }

  return 'unknown'
}

const version = {
  commit: getCommit(),
  builtAt: new Date().toISOString(),
}

mkdirSync('dist', { recursive: true })
writeFileSync('dist/version.json', JSON.stringify(version, null, 2) + '\n')
console.log('Wrote dist/version.json:', version)
