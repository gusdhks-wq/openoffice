export const MOBILE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
export const SNAPSHOT_MARKER = '1'

export interface DriveBinding {
  accountId: string
  documentId: string
  fileId: string
  fileVersion: string
  raw: string
}

/** A reserved Drive ID makes a retry safe even after an upload response is lost. */
export interface PendingUpload {
  accountId: string
  documentId: string
  fileId: string
  operationId: string
  parentKey: string
  name: string
  raw: string
}

export interface DriveSnapshot {
  id: string
  name: string
  version: string
  modifiedTime: string
  documentId: string
  operationId: string
  parentKey: string
  size: number
}

export type DriveFailureKind =
  | 'auth'
  | 'network'
  | 'limit'
  | 'invalid'
  | 'account'
  | 'missing'
  | 'conflict'
  | 'structure'
  | 'uncertain'
export class DriveFailure extends Error {
  constructor(public readonly kind: DriveFailureKind) {
    super(`drive-${kind}`)
  }
}

export interface DriveRemote {
  account(): Promise<string>
  list(): Promise<DriveSnapshot[]>
  reserveId(): Promise<string>
  create(upload: PendingUpload): Promise<DriveSnapshot>
  read(snapshot: DriveSnapshot): Promise<string>
}

export function snapshotKey(snapshot: Pick<DriveSnapshot, 'id' | 'version'>): string {
  return `${snapshot.id}:${snapshot.version}`
}

/** A fork remains two heads. File timestamps never choose a winning branch. */
export function snapshotHeads(snapshots: DriveSnapshot[]): DriveSnapshot[] {
  const parents = new Set(snapshots.map((snapshot) => snapshot.parentKey))
  return snapshots.filter((snapshot) => !parents.has(snapshotKey(snapshot)))
}
