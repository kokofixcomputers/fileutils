import md5 from 'md5'

export interface FileHashes {
  md5: string
  sha1: string
  sha256: string
  sha512: string
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function computeFileHashes(file: File): Promise<FileHashes> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)

  const [sha1, sha256, sha512] = await Promise.all([
    crypto.subtle.digest('SHA-1', buffer),
    crypto.subtle.digest('SHA-256', buffer),
    crypto.subtle.digest('SHA-512', buffer),
  ])

  return {
    md5: md5(bytes),
    sha1: toHex(sha1),
    sha256: toHex(sha256),
    sha512: toHex(sha512),
  }
}
