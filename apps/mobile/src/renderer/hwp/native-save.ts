import type { RhwpEditor } from '@rhwp/editor'
import { createAgentBridge } from '../../../../hwp/src/renderer/ai/agent-bridge'
import { openHwp } from 'virtual:mobile-hwp/hwp5-file'
import { fieldKindsOf, restoreFieldKinds } from 'virtual:mobile-hwp/field-kinds'
import { sectionTailsOf, restoreSectionTails } from 'virtual:mobile-hwp/section-tails'
import { newTabsOf, writeTabWidths } from 'virtual:mobile-hwp/tab-widths'
import { hasTrackedChanges } from 'virtual:mobile-hwp/tracked-changes'
import { initializeHwp, openHwpEngine } from './engine'
import { importHwp, MAX_HWP_BYTES, type HwpWorkspace } from './workspace'

export function assertEditableSource(workspace: HwpWorkspace): void {
  if (
    /\.hwp$/i.test(workspace.name) &&
    (!openHwp(workspace.original) || hasTrackedChanges(workspace.original))
  )
    throw new Error('hwp-protected-source')
}

export type NativeSaveEditor = Pick<
  RhwpEditor,
  'plugins' | 'commands' | 'getDocumentState' | 'exportHwpVerify' | 'exportHwp' | 'exportHwpx'
>

/** Export, restore the same desktop preservation data, and reopen before committing any bytes. */
export async function exportNativeHwp(
  editor: NativeSaveEditor,
  workspace: HwpWorkspace,
): Promise<Uint8Array> {
  assertEditableSource(workspace)
  const context = await editor.commands.context()
  if (context.passwordProtected !== false) throw new Error('hwp-protected-source')
  const before = await editor.getDocumentState()
  const agent = createAgentBridge(() => editor)
  const text = await agent.readText()
  const tables = await agent.listTables()
  const format = /\.hwpx$/i.test(workspace.name) ? 'hwpx' : 'hwp'
  let bytes: Uint8Array
  if (format === 'hwp') {
    const verification = await editor.exportHwpVerify()
    if (!verification.recovered || verification.pageCountBefore !== verification.pageCountAfter)
      throw new Error('hwp-export-verification')
    bytes = await editor.exportHwp()
  } else bytes = await editor.exportHwpx()
  if (!bytes.length || bytes.length > MAX_HWP_BYTES) throw new Error('hwp-export-size')
  importHwp(workspace.name, bytes)
  const spots = newTabsOf(bytes, format)
  if (spots.length) {
    const { tabs } = await agent.measureTabs(spots)
    const measures = spots.map((spot, index) => {
      const measure = tabs[index]
      if (!measure) throw new Error('hwp-tab-measurement')
      return { ...spot, ...measure }
    })
    const restored = writeTabWidths(bytes, format, measures)
    if (restored.written !== measures.length) throw new Error('hwp-tab-preservation')
    bytes = restored.bytes
  }
  bytes = restoreNativeBytes(workspace, bytes)
  await initializeHwp()
  const reopened = openHwpEngine(importHwp(workspace.name, bytes))
  try {
    if (
      reopened.plugin.readText() !== text ||
      JSON.stringify(reopened.plugin.listTables()) !== JSON.stringify(tables) ||
      reopened.doc.pageCount() !== before.pageCount
    )
      throw new Error('hwp-reopen-mismatch')
  } finally {
    reopened.close()
  }
  const after = await editor.getDocumentState()
  if (
    before.documentEpoch !== after.documentEpoch ||
    before.changeSeq !== after.changeSeq ||
    before.documentSha256 !== after.documentSha256
  )
    throw new Error('hwp-changed-during-save')
  return bytes
}

export function restoreNativeBytes(workspace: HwpWorkspace, data: Uint8Array): Uint8Array {
  let bytes = data
  const format = /\.hwpx$/i.test(workspace.name) ? 'hwpx' : 'hwp'
  if (format === 'hwp') {
    const kinds = fieldKindsOf(workspace.original)
    const tails = sectionTailsOf(workspace.original)
    if (kinds) bytes = restoreFieldKinds(bytes, kinds).bytes
    if (tails) {
      const restored = restoreSectionTails(bytes, tails)
      if (restored.skipped) throw new Error('hwp-preservation-' + restored.skipped)
      bytes = restored.bytes
    }
  }
  return bytes
}
