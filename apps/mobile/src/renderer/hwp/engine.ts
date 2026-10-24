import init, { HwpDocument } from '@rhwp/core'
import { agentPlugin, type AgentPluginHost } from '../../../../hwp/studio-plugin/agent-plugin.mjs'
import type { HwpWorkspace } from './workspace'

let initializing: Promise<unknown> | undefined
export function initializeHwp(): Promise<unknown> {
  if (!initializing)
    initializing = init().catch((error: unknown) => {
      initializing = undefined
      throw error
    })
  return initializing
}

/** Rebuild from the untouched source on every edit; failed commands cannot corrupt the live draft. */
export function openHwpEngine(workspace: HwpWorkspace) {
  const doc = new HwpDocument(workspace.edited ?? workspace.original)
  try {
    const host = {
      read: (fn: (document: never) => unknown) => fn(doc as never),
      transaction: (_label: string, fn: (transaction: never) => unknown) =>
        fn({ doc: () => doc, deferPagination: () => {} } as never),
      events: { on: () => {} },
      automation: { execute: () => null },
    } as unknown as AgentPluginHost
    const plugin = agentPlugin.activate(host)
    for (const operation of workspace.edited ? [] : workspace.operations) {
      if (operation.kind !== 'replaceText') throw new Error('unsupported-command')
      const result = plugin.replaceText(operation.find, operation.replacement)
      // Ambiguous text is never resolved by silently picking the first occurrence.
      if (!result.ok) throw new Error(`hwp-command-${result.reason}`)
    }
    return { doc, plugin, close: () => doc.free() }
  } catch (error) {
    doc.free()
    throw error
  }
}

export type HwpEngine = ReturnType<typeof openHwpEngine>
