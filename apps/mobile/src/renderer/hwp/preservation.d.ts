declare module 'virtual:mobile-hwp/hwp5-file' {
  export function openHwp(bytes: Uint8Array): unknown | null
}
declare module 'virtual:mobile-hwp/field-kinds' {
  export function fieldKindsOf(bytes: Uint8Array): Map<string, number> | null
  export function restoreFieldKinds(
    bytes: Uint8Array,
    kept: Map<string, number>,
  ): { bytes: Uint8Array; restored: number }
}
declare module 'virtual:mobile-hwp/section-tails' {
  export type SectionTails = object
  export function sectionTailsOf(bytes: Uint8Array): SectionTails | null
  export function restoreSectionTails(
    bytes: Uint8Array,
    kept: SectionTails,
  ): { bytes: Uint8Array; restored: number; skipped?: string }
}
declare module 'virtual:mobile-hwp/tracked-changes' {
  export function hasTrackedChanges(bytes: Uint8Array): boolean
}
declare module 'virtual:mobile-hwp/tab-widths' {
  import type { TabSpot, MeasuredTab } from '../../../../hwp/src/shared/ipc'
  export function newTabsOf(bytes: Uint8Array, format: 'hwp' | 'hwpx'): TabSpot[]
  export function writeTabWidths(
    bytes: Uint8Array,
    format: 'hwp' | 'hwpx',
    tabs: MeasuredTab[],
  ): { bytes: Uint8Array; written: number }
}
declare module 'pako' {
  export function deflateRaw(bytes: Uint8Array): Uint8Array
  export class Inflate {
    constructor(options: { raw: boolean; chunkSize: number })
    onData: (chunk: Uint8Array) => void
    err: number
    push(bytes: Uint8Array, final: boolean): void
  }
}
