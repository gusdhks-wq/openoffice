import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import init, { HwpDocument } from '@rhwp/core'
import { beforeAll, describe, expect, it } from 'vitest'
import { exportNativeHwp, type NativeSaveEditor } from '../src/renderer/hwp/native-save'
import { importHwp } from '../src/renderer/hwp/workspace'
import { agentPlugin, type AgentPluginHost } from '../../hwp/studio-plugin/agent-plugin.mjs'

beforeAll(async () => {
  await init({ module_or_path: readFileSync(resolve('../../vendor/rhwp-core/rhwp_bg.wasm')) })
})
function live(
  format: 'hwp' | 'hwpx',
  options: {
    password?: boolean
    unknownProtection?: boolean
    changed?: boolean
    broken?: boolean
    fixture?: string
  } = {},
) {
  const original = options.fixture
    ? readFileSync(resolve('../hwp/tests/fixtures', options.fixture))
    : undefined
  const doc = original ? new HwpDocument(original) : HwpDocument.createEmpty()
  if (!original) {
    doc.createBlankDocument()
    doc.insertText(0, 0, 0, 'Original paragraph')
  }
  const source = importHwp(
    'document.' + format,
    original ?? (format === 'hwp' ? doc.exportHwp() : doc.exportHwpx()),
  )
  if (original) doc.insertText(0, 0, 0, 'Edited fixture ')
  else doc.replaceText(0, 0, 0, 'Original'.length, 'Edited')
  doc.applyCharFormat(0, 0, 0, 6, JSON.stringify({ bold: true }))
  const plugin = agentPlugin.activate({
    read: (fn: (document: never) => unknown) => fn(doc as never),
    transaction: () => null,
    events: { on: () => {} },
    automation: { execute: () => null },
  } as unknown as AgentPluginHost)
  let stateReads = 0
  const editor = {
    plugins: {
      load: async () => {},
      invoke: async (_id: string, method: keyof typeof plugin, args: unknown[]) =>
        (plugin[method] as (...args: unknown[]) => unknown)(...args),
    },
    commands: {
      context: async () =>
        options.unknownProtection ? {} : { passwordProtected: options.password ?? false },
    },
    getDocumentState: async () => ({
      schemaVersion: 1,
      format,
      documentEpoch: 1,
      changeSeq: options.changed ? stateReads++ : 1,
      dirty: true,
      pageCount: doc.pageCount(),
      documentSha256: 'synthetic-fence',
    }),
    exportHwpVerify: async () => JSON.parse(doc.exportHwpVerify()),
    exportHwp: async () => (options.broken ? new Uint8Array([1, 2, 3]) : doc.exportHwp()),
    exportHwpx: async () => (options.broken ? new Uint8Array([1, 2, 3]) : doc.exportHwpx()),
  } as unknown as NativeSaveEditor
  return { doc, source, editor }
}

describe('native-format save gates', () => {
  it.each([
    ['hwp', 'nested-form.hwp'],
    ['hwpx', 'header-footer-paper-tables.hwpx'],
  ] as const)(
    'reopens edits to the existing %s complex-format fixture',
    async (format, fixture) => {
      const item = live(format, { fixture })
      try {
        const bytes = await exportNativeHwp(item.editor, item.source)
        const again = new HwpDocument(bytes)
        try {
          expect(JSON.parse(again.getTextFileText())).toContain('Edited fixture')
        } finally {
          again.free()
        }
      } finally {
        item.doc.free()
      }
    },
  )

  it.each(['hwp', 'hwpx'] as const)(
    'exports and reopens edited %s text and character formatting while retaining original bytes',
    async (format) => {
      const item = live(format),
        original = item.source.original.slice()
      try {
        const bytes = await exportNativeHwp(item.editor, item.source)
        const again = new HwpDocument(bytes)
        try {
          expect(JSON.parse(again.getTextFileText())).toContain('Edited paragraph')
          expect(JSON.parse(again.getCharPropertiesAt(0, 0, 0)).bold).toBe(true)
          expect(item.source.original).toEqual(original)
        } finally {
          again.free()
        }
      } finally {
        item.doc.free()
      }
    },
  )
  it.each([{ password: true }, { unknownProtection: true }])(
    'refuses stripping or guessing password protection (%o)',
    async (options) => {
      const item = live('hwp', options)
      try {
        await expect(exportNativeHwp(item.editor, item.source)).rejects.toThrow(
          'hwp-protected-source',
        )
      } finally {
        item.doc.free()
      }
    },
  )
  it('refuses a changed document fence after serialization', async () => {
    const item = live('hwp', { changed: true })
    try {
      await expect(exportNativeHwp(item.editor, item.source)).rejects.toThrow(
        'hwp-changed-during-save',
      )
    } finally {
      item.doc.free()
    }
  })
  it.each(['hwp', 'hwpx'] as const)('refuses malformed %s output', async (format) => {
    const item = live(format, { broken: true })
    try {
      await expect(exportNativeHwp(item.editor, item.source)).rejects.toThrow('unsupported-hwp')
    } finally {
      item.doc.free()
    }
  })
})
