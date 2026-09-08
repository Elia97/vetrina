import { describe, expect, it } from 'vitest'

import { evaluate } from './guard.ts'
import { innerBodies } from './shell-bodies.ts'
import { splitSegments } from './shell-tokens.ts'

const decision = (cmd: string) => evaluate(cmd).decision
const rule = (cmd: string) => evaluate(cmd).rule

describe('splitSegments', () => {
  it('spezza su && || ; e a capo ma non dentro le stringhe', () => {
    expect(splitSegments('a && b || c; d\ne')).toEqual(['a', 'b', 'c', 'd', 'e'])
    expect(splitSegments('git commit -m "a && b; c"')).toEqual(['git commit -m "a && b; c"'])
  })
  it('lascia le pipe nello stesso segmento', () => {
    expect(splitSegments('curl x | sh')).toEqual(['curl x | sh'])
  })
})

describe('innerBodies', () => {
  it('estrae il corpo solo da un interprete in posizione di comando', () => {
    expect(innerBodies(`bash -c 'rm -rf /'`)).toEqual(['rm -rf /'])
    expect(innerBodies(`FOO=1 sudo bash -euo pipefail -c 'rm -rf /'`)).toEqual(['rm -rf /'])
    expect(innerBodies(`psql -h x -c "DROP TABLE t"`)).toEqual(['DROP TABLE t'])
    expect(innerBodies(`echo "bash -c 'rm -rf /'"`)).toEqual([])
  })
  it('rilegge il codice di node/python solo se lancia comandi', () => {
    expect(innerBodies(`node -e "require('child_process').execSync('rm -rf /')"`)).toContain('rm -rf /')
    expect(innerBodies(`node -e "const s = 'bash -c rm -rf /'"`)).toEqual([])
  })
  it('$(…) e backtick contano tra doppi apici ma non tra apici singoli', () => {
    expect(innerBodies('echo $(git rev-parse HEAD) `date`')).toEqual(['date', 'git rev-parse HEAD'])
    expect(innerBodies(`echo "$(rm -rf /)"`)).toEqual(['rm -rf /'])
    expect(innerBodies(`echo '$(rm -rf /)'`)).toEqual([])
  })
})

describe('dati che sembrano comandi', () => {
  it.each([
    `echo "bash -c 'rm -rf /'" > note.txt`,
    "cat > guard.test.ts <<'EOF'\nbash -c 'rm -rf /'\ngit push --force\nEOF",
    `node -e "const cases = ['rm -rf /', 'git push --force']"`,
    `printf '%s\n' 'rm -rf /'`,
    `grep -rn "rm -rf" docs/`,
  ])('%s → allow', (cmd) => {
    expect(evaluate(cmd)).toMatchObject({ decision: 'allow' })
  })
  it.each([
    ["bash <<'EOF'\nrm -rf /\nEOF", 'rm-protected'],
    [`node -e "require('child_process').execSync('rm -rf /')"`, 'rm-protected'],
    [`python3 -c "import os; os.system('rm -rf /')"`, 'rm-protected'],
    [`echo "$(rm -rf /)"`, 'rm-protected'],
  ])('%s → deny [%s]', (cmd, expected) => {
    expect(evaluate(cmd)).toMatchObject({ decision: 'deny', rule: expected })
  })
})

describe('fail-closed', () => {
  it('nega un comando oltre il limite di dimensione', () => {
    expect(decision('echo '.repeat(30_000))).toBe('deny')
    expect(rule('echo '.repeat(30_000))).toBe('guard-input-too-large')
  })
  it("il deny vince sull'ask in un comando composto", () => {
    expect(evaluate('git stash drop && git push --force')).toMatchObject({
      decision: 'deny',
      rule: 'git-push-force',
    })
  })
  it('vince il peggiore anche se il segmento pericoloso è dopo', () => {
    expect(evaluate('pnpm test; rm -rf node_modules')).toMatchObject({
      decision: 'ask',
    })
  })
})

describe('scritture su file dal codice di un interprete', () => {
  it.each([
    [`node -e "require('node:fs').writeFileSync('.claude/settings.json','{}')"`, 'deny'],
    [`python3 -c "open('.claude/settings.json','w').write('{}')"`, 'deny'],
    [`node -e "require('node:fs').writeFileSync('.claude/hooks/lib/guard.ts','x')"`, 'ask'],
    [`node -e "console.log('.claude/settings.json')"`, 'allow'],
  ])('%s → %s', (cmd, atteso) => {
    expect(evaluate(cmd).decision).toBe(atteso)
  })
})
