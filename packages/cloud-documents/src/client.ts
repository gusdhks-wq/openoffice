import { CloudDocumentsClient, DocumentFailure } from './browser'
import { readFile } from 'node:fs/promises'

// Input files contain document operations, never credentials. Connection credentials
// are resolved only from this process's environment and are never printed.
const [command, ...args] = process.argv.slice(2)
try {
  const client = new CloudDocumentsClient(
    process.env.GENOFFICE_CLOUD_URL || '',
    () => process.env.GENOFFICE_CLOUD_AGENT_TOKEN || null,
  )
  let output: unknown
  const input = async () => JSON.parse(await readFile(args[1] || '', 'utf8'))
  if (command === 'list') output = await client.list(args[0])
  else if (command === 'read') output = await client.read(args[0], args[1])
  else if (command === 'versions') output = await client.versions(args[0])
  else if (command === 'create')
    output = await client.create(JSON.parse(await readFile(args[0] || '', 'utf8')))
  else if (command === 'update') output = await client.update(args[0], await input())
  else if (command === 'restore') output = await client.restore(args[0], await input())
  else throw new DocumentFailure('invalid')
  console.log(JSON.stringify({ ok: true, result: output }))
} catch (error) {
  const failure = error instanceof DocumentFailure ? error : new DocumentFailure('invalid')
  console.log(
    JSON.stringify({ ok: false, error: failure.code, currentRevision: failure.currentRevision }),
  )
  process.exitCode = 1
}
