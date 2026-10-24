import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import init, { HwpDocument } from '@rhwp/core'
import { beforeAll, describe, expect, it } from 'vitest'
import {
  appendReplacement,
  importHwp,
  openHwpStore,
  replacement,
} from '../src/renderer/hwp/workspace'
import { openHwpEngine } from '../src/renderer/hwp/engine'
import { exportHwpBackup, importHwpBackup } from '../src/renderer/hwp/backup'

beforeAll(async () => {
  await init({ module_or_path: readFileSync(resolve('../../vendor/rhwp-core/rhwp_bg.wasm')) })
})

function source(format = 'hwp') {
  const doc = HwpDocument.createEmpty()
  try {
    doc.createBlankDocument()
    doc.insertText(0, 0, 0, 'Original body')
    doc.splitParagraph(0, 0, doc.getParagraphLength(0, 0))
    doc.pasteHtml(0, 1, 0, '<table><tr><td>Cell anchor</td><td>Keep this cell</td></tr></table>')
    return format === 'hwp' ? doc.exportHwp() : doc.exportHwpx()
  } finally {
    doc.free()
  }
}

describe('HWP structured mobile workspaces', () => {
  it('restores both edited native snapshots and legacy v1 command backups', () => {
    const original = importHwp('sample.hwp', source())
    const document = new HwpDocument(original.original)
    let edited: Uint8Array
    try {
      document.replaceText(0, 0, 0, 'Original'.length, 'Snapshot')
      edited = document.exportHwp()
    } finally {
      document.free()
    }
    const restored = importHwpBackup(exportHwpBackup({ ...original, edited }))
    expect(restored.original).toEqual(original.original)
    const engine = openHwpEngine(restored)
    try {
      expect(engine.plugin.readText()).toContain('Snapshot body')
    } finally {
      engine.close()
    }
    const legacy = JSON.parse(
      new TextDecoder().decode(
        exportHwpBackup(appendReplacement(original, replacement('Original body', 'Legacy body'))),
      ),
    )
    legacy.version = 1
    const recovered = importHwpBackup(new TextEncoder().encode(JSON.stringify(legacy)))
    const old = openHwpEngine(recovered)
    try {
      expect(old.plugin.readText()).toContain('Legacy body')
    } finally {
      old.close()
    }
  })

  it.each(['hwp', 'hwpx'])('replays body and table edits from untouched %s bytes', (format) => {
    const bytes = source(format)
    const original = importHwp(`sample.${format}`, bytes)
    const edited = appendReplacement(
      appendReplacement(original, replacement('Original body', 'Longer edited body')),
      replacement('Cell anchor', 'Edited table cell'),
    )
    const engine = openHwpEngine(edited)
    try {
      expect(engine.plugin.readText()).toContain('Longer edited body')
      expect(engine.plugin.readText()).toContain('Edited table cell')
      expect(engine.plugin.readText()).toContain('Keep this cell')
      expect(engine.plugin.listTables().count).toBe(1)
      expect(edited.original).toEqual(bytes)
      const untouched = openHwpEngine(original)
      try {
        expect(untouched.plugin.readText()).toContain('Original body')
      } finally {
        untouched.close()
      }
    } finally {
      engine.close()
    }
  })

  it('refuses ambiguous and stale commands without modifying the stored source', () => {
    const original = importHwp('sample.hwp', source())
    const duplicate = appendReplacement(original, replacement('Original body', 'Repeated Repeated'))
    const ambiguous = appendReplacement(duplicate, replacement('Repeated', 'Wrong'))
    expect(() => openHwpEngine(ambiguous)).toThrow('ambiguous')
    expect(() =>
      openHwpEngine(appendReplacement(original, replacement('Missing', 'Wrong'))),
    ).toThrow('not_found')
    const good = openHwpEngine(original)
    try {
      expect(good.plugin.readText()).toContain('Original body')
    } finally {
      good.close()
    }
  })

  it('recovers original bytes and guarded commands after reopening IndexedDB and backup import', async () => {
    const name = crypto.randomUUID()
    const original = importHwp('sample.hwp', source())
    const store = await openHwpStore(name)
    await store.save(original, 0)
    const edited = appendReplacement(original, replacement('Cell anchor', 'Recovered cell'))
    await store.save(edited, 1)
    store.close()
    const reopened = await openHwpStore(name)
    try {
      const [loaded] = await reopened.list()
      expect(loaded).toEqual(edited)
      const backup = importHwpBackup(exportHwpBackup(loaded))
      expect(backup.id).not.toBe(loaded.id)
      expect(backup.original).toEqual(original.original)
      const engine = openHwpEngine(backup)
      try {
        expect(engine.plugin.readText()).toContain('Recovered cell')
      } finally {
        engine.close()
      }
    } finally {
      reopened.close()
    }
  })

  it('rejects a second writer and immutable-original replacement', async () => {
    const name = crypto.randomUUID()
    const first = await openHwpStore(name)
    const second = await openHwpStore(name)
    const original = importHwp('sample.hwp', source())
    try {
      await first.save(original, 0)
      const winner = appendReplacement(original, replacement('Original body', 'Winner'))
      await first.save(winner, 1)
      await expect(
        second.save(appendReplacement(original, replacement('Original body', 'Loser')), 1),
      ).rejects.toThrow('revision-conflict')
      await expect(
        second.save({ ...winner, original: source('hwpx'), revision: 3 }, 2),
      ).rejects.toThrow('revision-conflict')
      expect(await first.list()).toEqual([winner])
    } finally {
      first.close()
      second.close()
    }
  })

  it('rejects unsupported files, multiline replacement and untrusted backup commands', () => {
    expect(() => importHwp('sample.txt', source())).toThrow('unsupported-hwp')
    expect(() => importHwp('sample.hwp', new TextEncoder().encode('not a HWP'))).toThrow(
      'unsupported-hwp',
    )
    expect(() => replacement('', 'x')).toThrow('invalid-replacement')
    expect(() => replacement('x', 'new\nparagraph')).toThrow('invalid-replacement')
    const data = JSON.parse(
      new TextDecoder().decode(exportHwpBackup(importHwp('sample.hwp', source()))),
    )
    data.operations = [{ kind: 'execute', command: 'untrusted' }]
    expect(() => importHwpBackup(new TextEncoder().encode(JSON.stringify(data)))).toThrow(
      'unsupported-command',
    )
  })
})
