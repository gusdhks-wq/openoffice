import { randomBytes } from 'node:crypto'
import { openSync, writeFileSync, closeSync } from 'node:fs'
import { resolve } from 'node:path'
const args = process.argv.slice(2)
const deployment = args[0] === '--deploy'
const domain = deployment ? args[1] : undefined
if (
  (deployment &&
    (!domain ||
      domain.length > 253 ||
      !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain))) ||
  args.length > (deployment ? 3 : 1)
) {
  console.error(
    'Usage: node setup.mjs [output-file] | --deploy documents.example.com [output-file]',
  )
  process.exit(1)
}
const target = resolve(
  (deployment ? args[2] : args[0]) || (deployment ? '.env.cloud.deploy' : '.env.cloud.local'),
)
// Exclusive creation refuses existing files and symlinks. Never print either key.
const descriptor = openSync(target, 'wx', 0o600)
try {
  writeFileSync(
    descriptor,
    [
      `GENOFFICE_CLOUD_OWNER_TOKEN=${randomBytes(32).toString('hex')}`,
      `GENOFFICE_CLOUD_AGENT_TOKEN=${randomBytes(32).toString('hex')}`,
      ...(deployment ? [`GENOFFICE_CLOUD_DOMAIN=${domain}`] : []),
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
