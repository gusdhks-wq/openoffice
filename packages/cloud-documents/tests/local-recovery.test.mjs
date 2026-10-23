import { describe, expect, it, afterEach } from 'vitest'
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createServer } from 'node:net'
import { localProblem, recoverLocalLock } from '../scripts/local-recovery.mjs'
const cleanup = []
afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close()
})
async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'ieum-recovery-'))
  cleanup.push(() => rm(directory, { recursive: true, force: true }))
  await writeFile(join(directory, 'documents.json'), 'document-data-must-not-change')
  return directory
}
async function deadPid() {
  const child = spawn(process.execPath, ['-e', ''], { stdio: 'ignore' })
  const pid = child.pid
  await once(child, 'exit')
  return pid
}
describe('explicit local recovery', () => {
  it('retains a dead writer lock for inspection and leaves the database untouched', async () => {
    const directory = await setup(),
      pid = await deadPid()
    await writeFile(join(directory, 'writer.lock'), String(pid))
    expect(await localProblem(directory, [])).toBe('STORE_LOCK_STALE')
    expect(await recoverLocalLock(directory, [])).toBe(true)
    expect(await readFile(join(directory, 'documents.json'), 'utf8')).toBe(
      'document-data-must-not-change',
    )
    const names = await readdir(directory)
    expect(names).not.toContain('writer.lock')
    expect(names).not.toContain('recovery.guard')
    const recovered = names.find((name) => name.startsWith('.writer-lock-recovered-'))
    expect(await readFile(join(directory, recovered), 'utf8')).toBe(String(pid))
  })
  it('refuses an active writer, even if its server ports are not listening', async () => {
    const directory = await setup()
    await writeFile(join(directory, 'writer.lock'), String(process.pid))
    expect(await localProblem(directory, [])).toBe('STORE_LOCK_ACTIVE')
    await expect(recoverLocalLock(directory, [])).rejects.toThrow('STORE_LOCK_ACTIVE')
    expect(await readFile(join(directory, 'writer.lock'), 'utf8')).toBe(String(process.pid))
  })
  it('refuses unknown lock content and a concurrent recovery guard', async () => {
    const directory = await setup()
    await writeFile(join(directory, 'writer.lock'), 'unknown')
    await expect(recoverLocalLock(directory, [])).rejects.toThrow('STORE_LOCK_UNKNOWN')
    expect(await readFile(join(directory, 'writer.lock'), 'utf8')).toBe('unknown')
    await writeFile(join(directory, 'recovery.guard'), '')
    await expect(recoverLocalLock(directory, [])).rejects.toThrow('RECOVERY_BUSY')
  })
  it('refuses recovery if another process is using a configured port', async () => {
    const directory = await setup(),
      pid = await deadPid()
    await writeFile(join(directory, 'writer.lock'), String(pid))
    const server = createServer()
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    cleanup.push(() => new Promise((done) => server.close(done)))
    const port = server.address().port
    expect(await localProblem(directory, [port])).toBe('PORT_IN_USE')
    await expect(recoverLocalLock(directory, [port])).rejects.toThrow('PORT_IN_USE')
    expect(await readFile(join(directory, 'writer.lock'), 'utf8')).toBe(String(pid))
  })
  it('does nothing when no writer lock exists', async () => {
    const directory = await setup()
    expect(await recoverLocalLock(directory, [])).toBe(false)
    expect(await readFile(join(directory, 'documents.json'), 'utf8')).toBe(
      'document-data-must-not-change',
    )
  })
})
