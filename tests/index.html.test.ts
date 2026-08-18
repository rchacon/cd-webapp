import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const html = readFileSync(resolve(import.meta.dirname, '../index.html'), 'utf-8')

describe('index.html scroll restoration', () => {
  it('opts out of native scroll restoration and scrolls to the top', () => {
    expect(html).toMatch(/history\.scrollRestoration\s*=\s*['"]manual['"]/)
    expect(html).toMatch(/window\.scrollTo\(0,\s*0\)/)
  })

  it('runs before the deferred main.tsx module script', () => {
    const scrollScriptIndex = html.indexOf('scrollRestoration')
    const moduleScriptIndex = html.indexOf('src="/src/main.tsx"')

    expect(scrollScriptIndex).toBeGreaterThan(-1)
    expect(moduleScriptIndex).toBeGreaterThan(-1)
    expect(scrollScriptIndex).toBeLessThan(moduleScriptIndex)
  })
})
