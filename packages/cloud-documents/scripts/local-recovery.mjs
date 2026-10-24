import { createServer } from 'node:net'
import { lstat, readFile, open, rename, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export async function portBusy(port) {
  const server = createServer()
  try {
    await new Promise((done, fail) => {
      server.once('error', fail)
      server.listen(port, '127.0.0.1', done)
    })
    await new Promise((done) => server.close(done))
    return false
  } catch (error) {
    if (error.code === 'EADDRINUSE') return true
    throw error
  }
}
async function inspectLock(directory) {
  const path = join(directory, 'writer.lock')
  let info
  try {
    info = await lstat(path)
  } catch (error) {
    if (error.code === 'ENOENT') return { state: 'none' }
    throw error
  }
  if (!info.isFile() || info.isSymbolicLink() || info.size > 32) return { state: 'unknown' }
  const text = await readFile(path, 'utf8')
  if (!/^[1-9][0-9]{0,9}$/.test(text)) return { state: 'unknown' }
  const pid = Number(text)
  try {
    process.kill(pid, 0)
    return { state: 'active' }
  } catch (error) {
    if (error.code !== 'ESRCH') return { state: 'unknown' }
  }
  return { state: 'stale', path, text, info }
}
export async function localProblem(directory, ports) {
  if ((await Promise.all(ports.map(portBusy))).some(Boolean)) return 'PORT_IN_USE'
  const lock = await inspectLock(directory)
  if (lock.state === 'active') return 'STORE_LOCK_ACTIVE'
  if (lock.state === 'stale') return 'STORE_LOCK_STALE'
  if (lock.state === 'unknown') return 'STORE_LOCK_UNKNOWN'
  return 'STORE_OR_SETTINGS_ERROR'
}

/** Explicit recovery only: never alter a live/unknown lock, settings or documents. */
export async function recoverLocalLock(directory, ports) {
  let guard
  const guardPath = join(directory, 'recovery.guard')
  try {
    const info = await lstat(directory)
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('STORE_LOCK_UNKNOWN')
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
  try {
    guard = await open(guardPath, 'wx', 0o600)
  } catch {
    throw new Error('RECOVERY_BUSY')
  }
  try {
    if ((await Promise.all(ports.map(portBusy))).some(Boolean)) throw new Error('PORT_IN_USE')
    const lock = await inspectLock(directory)
    if (lock.state === 'none') return false
    if (lock.state !== 'stale')
      throw new Error(lock.state === 'active' ? 'STORE_LOCK_ACTIVE' : 'STORE_LOCK_UNKNOWN')
    const current = await lstat(lock.path)
    if (
      current.ino !== lock.info.ino ||
      current.mtimeMs !== lock.info.mtimeMs ||
      current.size !== lock.info.size ||
      (await readFile(lock.path, 'utf8')) !== lock.text
    )
      throw new Error('STORE_LOCK_CHANGED')
    // Retain the stale lock for inspection. The document database is untouched.
    await rename(lock.path, join(directory, `.writer-lock-recovered-${randomUUID()}`))
    return true
  } finally {
    await guard.close()
    await unlink(guardPath)
  }
}
