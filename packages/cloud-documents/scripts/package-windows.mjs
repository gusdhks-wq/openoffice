import { cp, mkdir, readdir, readFile, stat, writeFile, access } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const runtime = process.argv[2] && resolve(process.argv[2])
const output = process.argv[3] && resolve(process.argv[3])
if (!runtime || !output || output === root || root.startsWith(output + sep)) {
  throw new Error('Usage: node package-windows.mjs WINDOWS_NODE_DIRECTORY NEW_OUTPUT_DIRECTORY')
}
try {
  await access(output)
  throw new Error('Output already exists; choose an empty, new destination.')
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const executable = await readFile(join(runtime, 'node.exe'))
if (executable.subarray(0, 2).toString() !== 'MZ') throw new Error('Expected a Windows executable.')
await access(join(runtime, 'LICENSE'))
await access(join(root, 'apps/mobile/dist/index.html'))
await access(join(root, 'packages/cloud-documents/dist/server.mjs'))

// Preserve nested dependency versions from the lockfile installation.
async function resolvePackage(name, from) {
  let directory = from
  for (;;) {
    const candidate = join(directory, 'node_modules', name)
    try {
      await access(join(candidate, 'package.json'))
      return candidate
    } catch {}
    const parent = dirname(directory)
    if (parent === directory) throw new Error(`Missing runtime dependency: ${name}`)
    directory = parent
  }
}
const packages = new Map()
async function collect(name, from) {
  const directory = await resolvePackage(name, from)
  if (packages.has(directory)) return
  const metadata = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  packages.set(directory, metadata)
  for (const dependency of Object.keys(metadata.dependencies || {}))
    await collect(dependency, directory)
  for (const dependency of Object.keys(metadata.optionalDependencies || {})) {
    try {
      await resolvePackage(dependency, directory)
    } catch {
      continue
    }
    await collect(dependency, directory)
  }
}
await collect('@modelcontextprotocol/sdk', root)
await collect('zod', root)
await mkdir(output, { recursive: true })
await mkdir(join(output, 'runtime'))
await cp(join(runtime, 'node.exe'), join(output, 'runtime/node.exe'))
await cp(join(runtime, 'LICENSE'), join(output, 'runtime/LICENSE'))
for (const filename of ['LICENSE', 'NOTICE']) await cp(join(root, filename), join(output, filename))
for (const filename of ['local.mjs', 'local-recovery.mjs', 'setup.mjs']) {
  const target = join(output, 'packages/cloud-documents/scripts', filename)
  await mkdir(dirname(target), { recursive: true })
  await cp(join(root, 'packages/cloud-documents/scripts', filename), target)
}
await cp(
  join(root, 'packages/cloud-documents/dist'),
  join(output, 'packages/cloud-documents/dist'),
  { recursive: true },
)
await cp(join(root, 'apps/mobile/dist'), join(output, 'apps/mobile/dist'), { recursive: true })
const notices = []
for (const [directory, metadata] of packages) {
  const path = relative(join(root, 'node_modules'), directory)
  if (path.startsWith('..') || path === '')
    throw new Error('Runtime package is outside node_modules.')
  const target = join(output, 'node_modules', path)
  await mkdir(dirname(target), { recursive: true })
  await cp(directory, target, {
    recursive: true,
    dereference: true,
    filter: (source) => !relative(directory, source).split(sep).includes('node_modules'),
  })
  const files = (await readdir(directory)).filter((name) =>
    /^(?:licen[cs]e|copying|notice)(?:\.|$)/i.test(name),
  )
  const texts = []
  for (const file of files)
    if ((await stat(join(directory, file))).isFile())
      texts.push(await readFile(join(directory, file), 'utf8'))
  if (!texts.length) throw new Error(`Missing runtime license text: ${metadata.name}`)
  notices.push(
    `${metadata.name}@${metadata.version}\n${metadata.license || ''}\n${texts.join('\n')}`,
  )
}
await writeFile(join(output, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'))
for (const filename of await readdir(join(root, 'packages/cloud-documents/portable'))) {
  await cp(join(root, 'packages/cloud-documents/portable', filename), join(output, filename))
}
console.log(
  `Packaged ${packages.size} runtime dependencies. No user settings, keys or documents were included.`,
)
