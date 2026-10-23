import type { CloudBinding, PendingCloudUpload } from './cloud/sync'
import type { DriveBinding, PendingUpload } from './drive/types'
import type { GoogleDocBinding, PendingGoogleDoc } from './drive/google-docs'
import { readSourceText, writeSourceText } from '../../../markdown/src/shared/source-text'
import type { SourceTextFormat } from '../../../markdown/src/shared/source-text'

export interface LocalDocument {
  id: string
  name: string
  text: string
  originalRaw: string
  originalText: string
  format: SourceTextFormat
  revision: number
  updatedAt: number
  drive?: DriveBinding
  pendingUpload?: PendingUpload
  googleDoc?: GoogleDocBinding
  pendingGoogleDoc?: PendingGoogleDoc
  cloud?: CloudBinding
  pendingCloudUpload?: PendingCloudUpload
}
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024

export function importDocument(name: string, bytes: Uint8Array): LocalDocument {
  if (!/\.(md|markdown|txt)$/i.test(name) || bytes.byteLength > MAX_IMPORT_BYTES) {
    throw new Error('unsupported-file')
  }
  // Keep the BOM in the decoded string so the desktop source codec can preserve it.
  const raw = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  if (raw.includes('\0')) throw new Error('unsupported-file')
  const { text, format } = readSourceText(raw)
  return {
    id: crypto.randomUUID(),
    name,
    text,
    originalRaw: raw,
    originalText: text,
    format,
    revision: 1,
    updatedAt: Date.now(),
  }
}

export function updateDocument(doc: LocalDocument, text: string): LocalDocument {
  return { ...doc, text, revision: doc.revision + 1, updatedAt: Date.now() }
}

export function exportDocument(doc: LocalDocument): string {
  // An untouched source must preserve even mixed line endings byte for byte.
  return doc.text === doc.originalText ? doc.originalRaw : writeSourceText(doc.text, doc.format)
}
