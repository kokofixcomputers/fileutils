import { getFFmpeg } from './ffmpegEngine'

export type AudioOutputFormat = 'mp3' | 'wav' | 'ogg' | 'flac' | 'aac'

function mimeFor(format: AudioOutputFormat) {
  switch (format) {
    case 'mp3':
      return 'audio/mpeg'
    case 'wav':
      return 'audio/wav'
    case 'ogg':
      return 'audio/ogg'
    case 'flac':
      return 'audio/flac'
    case 'aac':
      return 'audio/aac'
  }
}

export interface ConvertAudioOptions {
  format: AudioOutputFormat
  bitrateKbps?: number // for lossy formats
  onProgress?: (ratio: number) => void
}

export async function convertAudio(file: File, options: ConvertAudioOptions): Promise<Blob> {
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
  if (options.format === 'mp3' || options.format === 'aac' || options.format === 'ogg') {
    args.push('-b:a', `${options.bitrateKbps ?? 192}k`)
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
