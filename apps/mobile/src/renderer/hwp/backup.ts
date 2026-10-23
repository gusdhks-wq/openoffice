import { bytesToBase64 } from '../files'
import {
  appendReplacement,
  importHwp,
  MAX_HWP_BYTES,
  MAX_HWP_OPERATIONS,
  replacement,
  type HwpWorkspace,
} from './workspace'

export const MAX_HWP_BACKUP_BYTES = 32 * 1024 * 1024

/** This recovery format is explicitly not a HWP/HWPX export. */
export function exportHwpBackup(workspace: HwpWorkspace): Uint8Array {
  return new TextEncoder().encode(
    JSON.stringify({
      format: 'genoffice-hwp-workspace',
      version: 1,
      name: workspace.name,
      original: bytesToBase64(workspace.original),
      operations: workspace.operations,
    }),
  )
}

export function importHwpBackup(bytes: Uint8Array): HwpWorkspace {
  if (bytes.length > MAX_HWP_BACKUP_BYTES) throw new Error('backup-too-large')
  const data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  if (
    data?.format !== 'genoffice-hwp-workspace' ||
    data.version !== 1 ||
    typeof data.name !== 'string' ||
    typeof data.original !== 'string' ||
    data.original.length > Math.ceil(MAX_HWP_BYTES / 3) * 4 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(data.original) ||
    !Array.isArray(data.operations) ||
    data.operations.length > MAX_HWP_OPERATIONS
  )
    throw new Error('unsupported-backup')
  const binary = atob(data.original)
  let workspace = importHwp(
    data.name,
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  )
  for (const item of data.operations) {
    if (
      item?.kind !== 'replaceText' ||
      typeof item.find !== 'string' ||
      typeof item.replacement !== 'string'
    )
      throw new Error('unsupported-command')
    workspace = appendReplacement(workspace, replacement(item.find, item.replacement))
  }
  return { ...workspace, revision: 1 }
}
