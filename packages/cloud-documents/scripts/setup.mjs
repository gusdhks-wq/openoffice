import { randomBytes } from 'node:crypto'
import { openSync, writeFileSync, closeSync } from 'node:fs'
import { resolve } from 'node:path'
const target = resolve(process.argv[2] || '.env.cloud.local')
// Exclusive creation refuses existing files and symlinks. Never print either key.
const descriptor = openSync(target, 'wx', 0o600)
try {
  writeFileSync(
    descriptor,
    [
      `GENOFFICE_CLOUD_OWNER_TOKEN=${randomBytes(32).toString('hex')}`,
      `GENOFFICE_CLOUD_AGENT_TOKEN=${randomBytes(32).toString('hex')}`,
      'GENOFFICE_CLOUD_DATA_DIR=./.ieumoffice-cloud-data',
      'GENOFFICE_CLOUD_HOST=127.0.0.1',
      'GENOFFICE_CLOUD_PORT=5182',
      'GENOFFICE_CLOUD_ALLOWED_ORIGINS=http://localhost:5181',
      '',
    ].join('\n'),
  )
} finally {
  closeSync(descriptor)
}
console.log(
  `Created private connection settings at ${target}. Keep this file out of version control.`,
)
