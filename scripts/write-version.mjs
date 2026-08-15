import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

function getCommit() {
  // Amplify injects AWS_COMMIT_ID at build time -- prefer it over running git
  // directly, since it's correct regardless of Amplify's clone strategy/depth.
  if (process.env.AWS_COMMIT_ID) return process.env.AWS_COMMIT_ID.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'unknown'
  }
}

const version = {
  commit: getCommit(),
  builtAt: new Date().toISOString(),
}

mkdirSync('dist', { recursive: true })
writeFileSync('dist/version.json', JSON.stringify(version, null, 2) + '\n')
console.log('Wrote dist/version.json:', version)
