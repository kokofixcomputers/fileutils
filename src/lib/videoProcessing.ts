import { getFFmpeg } from './ffmpegEngine'

export type VideoOutputFormat = 'mp4' | 'webm' | 'mov' | 'gif'
export type VideoCompressionMode = 'quality' | 'targetSize'

function mimeFor(format: VideoOutputFormat) {
  switch (format) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'mov':
      return 'video/quicktime'
    case 'gif':
      return 'image/gif'
  }
}

export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    video.src = url
  })
}

export interface ConvertVideoOptions {
  format: VideoOutputFormat
  mode: VideoCompressionMode
  quality?: number // 0-100, used when mode === 'quality' (maps to CRF)
  targetSizeMB?: number // used when mode === 'targetSize'
  muteAudio?: boolean
  onProgress?: (ratio: number) => void
}

export async function convertVideo(file: File, options: ConvertVideoOptions): Promise<Blob> {
  const ffmpeg = await getFFmpeg()

  const inputName = `input-${Date.now()}.${file.name.split('.').pop() || 'bin'}`
  const outputName = `output-${Date.now()}.${options.format}`

  const progressHandler = ({ progress }: { progress: number }) => {
    options.onProgress?.(Math.min(1, Math.max(0, progress)))
  }
  ffmpeg.on('progress', progressHandler)

  const data = new Uint8Array(await file.arrayBuffer())
  await ffmpeg.writeFile(inputName, data)

  const args = ['-i', inputName]

  if (options.format === 'gif') {
    args.push('-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0')
  } else {
    const videoCodec = options.format === 'webm' ? 'libvpx-vp9' : 'libx264'
    args.push('-c:v', videoCodec)

    if (options.mode === 'targetSize' && options.targetSizeMB) {
      const duration = await getVideoDuration(file).catch(() => 60)
      const audioKbps = options.muteAudio ? 0 : 128
      const totalKbps = (options.targetSizeMB * 8 * 1024) / Math.max(1, duration)
      const videoKbps = Math.max(100, Math.round(totalKbps - audioKbps))
      args.push('-b:v', `${videoKbps}k`)
    } else {
      // quality 0-100 -> CRF ~51 (worst) to ~16 (best)
      const quality = options.quality ?? 70
      const crf = Math.round(51 - (quality / 100) * 35)
      args.push('-crf', String(crf), '-preset', 'veryfast')
    }

    if (options.muteAudio) {
      args.push('-an')
    } else {
      args.push('-c:a', options.format === 'webm' ? 'libopus' : 'aac', '-b:a', '128k')
    }
  }

  args.push(outputName)
  await ffmpeg.exec(args)

  const output = await ffmpeg.readFile(outputName)
  ffmpeg.off('progress', progressHandler)

  await ffmpeg.deleteFile(inputName)
  await ffmpeg.deleteFile(outputName)

  const bytes = output as Uint8Array
  return new Blob([bytes.slice().buffer], { type: mimeFor(options.format) })
}
