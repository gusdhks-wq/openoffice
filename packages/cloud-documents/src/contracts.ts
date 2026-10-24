export const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024
export type Principal = 'owner' | 'agent'
export type FailureCode =
  | 'invalid'
  | 'unauthorized'
  | 'not-found'
  | 'conflict'
  | 'idempotency-conflict'
  | 'limit'
  | 'storage'
  | 'network'
export class DocumentFailure extends Error {
  constructor(
    public readonly code: FailureCode,
    public readonly currentRevision?: string,
  ) {
    super(code)
  }
}
export interface DocumentInfo {
  id: string
  name: string
  revision: string
  updatedAt: string
  sharedWithAgent: boolean
}
export interface DocumentView extends DocumentInfo {
  content: string
}
export interface VersionInfo {
  revision: string
  parentRevision: string | null
  name: string
  createdAt: string
  source: 'owner' | 'agent' | 'restore'
}
export interface CreateInput {
  operationId: string
  name: string
  content: string
}
export interface UpdateInput {
  operationId: string
  baseRevision: string
  content: string
  name?: string
}
export interface RestoreInput {
  operationId: string
  baseRevision: string
  revision: string
}
export interface ShareInput {
  operationId: string
  baseRevision: string
  enabled: boolean
}
