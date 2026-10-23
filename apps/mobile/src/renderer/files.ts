import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { exportDocument, type LocalDocument } from './documents'

export async function downloadDocument(document: LocalDocument): Promise<void> {
  const raw = exportDocument(document)
  const name = Array.from(document.name, (character) =>
    character.charCodeAt(0) < 32 || character === '/' || character === '\\' ? '_' : character,
  ).join('')
  if (Capacitor.isNativePlatform()) {
    const result = await Filesystem.writeFile({
      path: name,
      data: raw,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ files: [result.uri] })
    return
  }
  const url = URL.createObjectURL(new Blob([raw], { type: 'text/plain;charset=utf-8' }))
  const link = window.document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 30_000)
}
