import { MAX_IMPORT_BYTES } from '../documents'
import { DriveFailure } from './types'

export interface GoogleDocInfo {
  id: string
  name: string
  modifiedTime: string
}
export interface GoogleDocView extends GoogleDocInfo {
  revision: string
  tabId: string
  text: string
}
export interface GoogleDocBinding {
  accountId: string
  id: string
  text: string
  revision: string
}
export interface PendingGoogleDoc {
  accountId: string
  operationId: string
  name: string
  text: string
  phase: 'prepared' | 'creating' | 'editing'
  id?: string
  baseRevision?: string
  baseText?: string
}
export interface GoogleDocsRemote {
  account(): Promise<string>
  list(): Promise<GoogleDocInfo[]>
  findCreation(operationId: string): Promise<GoogleDocInfo | null>
  create(operationId: string, name: string): Promise<GoogleDocInfo>
  read(id: string): Promise<GoogleDocView>
  update(base: GoogleDocView, text: string): Promise<void>
}
interface SourceRun {
  startIndex: number
  endIndex: number
  textRun?: {
    content?: unknown
    textStyle?: Record<string, unknown>
    suggestedInsertionIds?: unknown[]
    suggestedDeletionIds?: unknown[]
    suggestedTextStyleChanges?: Record<string, unknown>
  }
}
interface SourceTab {
  tabProperties?: { tabId?: unknown }
  childTabs?: unknown[]
  documentTab?: {
    suggestedNamedStylesChanges?: Record<string, unknown>
    body?: {
      content?: Array<{
        sectionBreak?: unknown
        endIndex?: number
        paragraph?: {
          bullet?: unknown
          paragraphStyle?: { namedStyleType?: string }
          suggestedParagraphStyleChanges?: Record<string, unknown>
          elements?: SourceRun[]
        }
      }>
    }
  }
}
const DRIVE = 'https://www.googleapis.com/drive/v3',
  DOCS = 'https://docs.googleapis.com/v1/documents'
const ID = /^[A-Za-z0-9_-]{1,128}$/
const MIME = 'application/vnd.google-apps.document'
const validateId = (id: string) => {
  if (!ID.test(id)) throw new DriveFailure('invalid')
  return encodeURIComponent(id)
}
export function validateGoogleText(text: string): void {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) throw new DriveFailure('limit')
  for (const character of text) {
    const code = character.codePointAt(0)!
    if (
      (code < 32 && code !== 9 && code !== 10) ||
      (code >= 0xe000 && code <= 0xf8ff) ||
      (code >= 0xd800 && code <= 0xdfff)
    )
      throw new DriveFailure('structure')
  }
}
export function googleDocumentURL(id: string): string {
  return `https://docs.google.com/document/d/${validateId(id)}/edit`
}
function info(value: unknown): GoogleDocInfo {
  const file = value as Record<string, unknown> | null
  if (
    !file ||
    typeof file.id !== 'string' ||
    !ID.test(file.id) ||
    typeof file.name !== 'string' ||
    file.mimeType !== MIME
  )
    throw new DriveFailure('invalid')
  return { id: file.id, name: file.name, modifiedTime: String(file.modifiedTime ?? '') }
}

/** Only simple, single-tab source documents are editable; never flatten rich native content. */
function hasSuggestions(value: object): boolean {
  return Object.entries(value).some(
    ([key, change]) =>
      key.startsWith('suggested') &&
      change != null &&
      (typeof change !== 'object' || Object.keys(change).length > 0),
  )
}
export function readGoogleSource(value: unknown): GoogleDocView {
  const doc = value as {
    documentId?: unknown
    title?: unknown
    revisionId?: unknown
    tabs?: SourceTab[]
    suggestedDocumentStyleChanges?: Record<string, unknown>
  } | null
  if (
    !doc ||
    typeof doc.documentId !== 'string' ||
    !ID.test(doc.documentId) ||
    typeof doc.title !== 'string' ||
    typeof doc.revisionId !== 'string' ||
    !doc.revisionId ||
    hasSuggestions(doc) ||
    !Array.isArray(doc.tabs) ||
    doc.tabs.length !== 1
  )
    throw new DriveFailure('structure')
  const tab = doc.tabs[0]
  if (
    !tab ||
    typeof tab.tabProperties?.tabId !== 'string' ||
    !ID.test(tab.tabProperties?.tabId) ||
    tab.childTabs?.length ||
    !Array.isArray(tab.documentTab?.body?.content) ||
    hasSuggestions(tab) ||
    hasSuggestions(tab.documentTab) ||
    Object.keys(doc.suggestedDocumentStyleChanges || {}).length ||
    Object.keys(tab.documentTab?.suggestedNamedStylesChanges || {}).length
  )
    throw new DriveFailure('structure')
  let text = '',
    bytes = 0,
    index = 1
  for (const element of tab.documentTab.body.content) {
    if (element.sectionBreak && element.endIndex === 1) continue
    const paragraph = element.paragraph
    if (
      !paragraph ||
      hasSuggestions(element) ||
      hasSuggestions(paragraph) ||
      paragraph.bullet ||
      !Array.isArray(paragraph.elements) ||
      (paragraph.paragraphStyle?.namedStyleType &&
        paragraph.paragraphStyle.namedStyleType !== 'NORMAL_TEXT') ||
      Object.keys(paragraph.paragraphStyle || {}).some(
        (key) => !['namedStyleType', 'direction'].includes(key),
      ) ||
      Object.keys(paragraph.suggestedParagraphStyleChanges || {}).length
    )
      throw new DriveFailure('structure')
    for (const part of paragraph.elements) {
      const run = part.textRun
      if (
        !run ||
        hasSuggestions(part) ||
        hasSuggestions(run) ||
        typeof run.content !== 'string' ||
        part.startIndex !== index ||
        part.endIndex !== index + run.content.length ||
        Object.keys(run.textStyle || {}).length ||
        run.suggestedInsertionIds?.length ||
        run.suggestedDeletionIds?.length ||
        Object.keys(run.suggestedTextStyleChanges || {}).length
      )
        throw new DriveFailure('structure')
      text += run.content
      bytes += new TextEncoder().encode(run.content).byteLength
      index = part.endIndex
      if (bytes > MAX_IMPORT_BYTES + 1) throw new DriveFailure('limit')
    }
  }
  if (!text.endsWith('\n') || text.includes('\0')) throw new DriveFailure('structure')
  return {
    id: doc.documentId,
    name: doc.title,
    modifiedTime: '',
    revision: doc.revisionId,
    tabId: tab.tabProperties.tabId,
    text: text.slice(0, -1),
  }
}

export function createGoogleDocsRemote(
  token: () => string | null,
  account: () => Promise<string>,
  fetcher: typeof fetch = fetch,
): GoogleDocsRemote {
  async function request(url: string, init: RequestInit = {}): Promise<any> {
    const accessToken = token()
    if (!accessToken) throw new DriveFailure('auth')
    let response: Response
    try {
      response = await fetcher.call(globalThis, url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${accessToken}` },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(30000),
      })
    } catch {
      throw new DriveFailure('network')
    }
    if (response.status === 401) throw new DriveFailure('auth')
    if (response.status === 404) throw new DriveFailure('missing')
    if (!response.ok)
      throw new DriveFailure(
        response.status === 400 || response.status === 409 ? 'conflict' : 'network',
      )
    try {
      const reader = response.body?.getReader()
      if (!reader) throw new DriveFailure('invalid')
      const parts: Uint8Array[] = []
      let size = 0
      try {
        for (;;) {
          const part = await reader.read()
          if (part.done) break
          size += part.value.byteLength
          if (size > 12 * 1024 * 1024) {
            await reader.cancel()
            throw new DriveFailure('limit')
          }
          parts.push(part.value)
        }
      } finally {
        reader.releaseLock()
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const part of parts) {
        bytes.set(part, offset)
        offset += part.byteLength
      }
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    } catch (error) {
      if (error instanceof DriveFailure) throw error
      throw new DriveFailure('invalid')
    }
  }
  async function list(operationId?: string): Promise<GoogleDocInfo[]> {
    if (operationId) validateId(operationId)
    const files: GoogleDocInfo[] = [],
      seen = new Set<string>()
    let page = ''
    do {
      const params = new URLSearchParams({
        q:
          `trashed = false and mimeType = '${MIME}' and appProperties has { key='genofficeSourceDocs' and value='1' }` +
          (operationId
            ? ` and appProperties has { key='sourceOperation' and value='${operationId}' }`
            : ''),
        fields: 'nextPageToken,incompleteSearch,files(id,name,mimeType,modifiedTime)',
        pageSize: '100',
        spaces: 'drive',
      })
      if (page) params.set('pageToken', page)
      const result = await request(`${DRIVE}/files?${params}`)
      if (!Array.isArray(result.files) || result.incompleteSearch) throw new DriveFailure('invalid')
      files.push(...result.files.map(info))
      if (files.length > 1000) throw new DriveFailure('limit')
      page = result.nextPageToken || ''
      if (page && seen.has(page)) throw new DriveFailure('invalid')
      seen.add(page)
    } while (page)
    return files
  }
  return {
    account,
    list: () => list(),
    findCreation: async (operationId) => {
      const files = await list(operationId)
      if (files.length > 1) throw new DriveFailure('conflict')
      return files[0] || null
    },
    create: async (operationId, name) => {
      validateId(operationId)
      return info(
        await request(`${DRIVE}/files?fields=id,name,mimeType,modifiedTime`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            mimeType: MIME,
            appProperties: { genofficeSourceDocs: '1', sourceOperation: operationId },
          }),
        }),
      )
    },
    read: async (id) =>
      readGoogleSource(
        await request(
          `${DOCS}/${validateId(id)}?includeTabsContent=true&suggestionsViewMode=SUGGESTIONS_INLINE`,
        ),
      ),
    update: async (base, text) => {
      validateGoogleText(text)
      const requests: Record<string, unknown>[] = []
      if (base.text.length)
        requests.push({
          deleteContentRange: {
            range: { startIndex: 1, endIndex: base.text.length + 1, tabId: base.tabId },
          },
        })
      if (text.length)
        requests.push({
          insertText: {
            location: { index: 1, tabId: base.tabId },
            text,
          },
        })
      if (!requests.length) return
      await request(`${DOCS}/${validateId(base.id)}:batchUpdate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests, writeControl: { requiredRevisionId: base.revision } }),
      })
    },
  }
}
