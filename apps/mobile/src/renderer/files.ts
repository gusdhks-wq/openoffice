import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { exportDocument, type LocalDocument } from './documents'

export async function downloadDocument(document: LocalDocument): Promise<void> {
  const raw = exportDocument(document)
  await downloadBytes(document.name, new TextEncoder().encode(raw), 'text/plain;charset=utf-8')
}

export async function downloadBytes(
  filename: string,
  bytes: Uint8Array,
  mime: string,
): Promise<void> {
  const name = Array.from(filename, (character) =>
    character.charCodeAt(0) < 32 || character === '/' || character === '\\' ? '_' : character,
  ).join('')
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: name,
      data: bytesToBase64(bytes),
      directory: Directory.Cache,
    })
    await Share.share({ files: [result.uri] })
    return
  }
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: mime }))
  const link = window.document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let start = 0; start < bytes.length; start += 8192)
    binary += String.fromCharCode(...bytes.subarray(start, start + 8192))
  return btoa(binary)
}
