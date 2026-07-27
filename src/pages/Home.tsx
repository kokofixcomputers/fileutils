import { Link } from 'react-router-dom'
import {
  Image,
  AudioLines,
  Video,
  FileText,
  Files,
  FolderArchive,
  Hash,
  DownloadCloud,
  ArrowRight,
  Shield,
  Zap,
  Gauge,
} from 'lucide-react'

const TOOLS = [
  {
    to: '/image',
    icon: Image,
    title: 'Image Compress & Convert',
    description: 'PNG, JPG, WebP, AVIF conversion with precise target size or quality control.',
    tags: ['PNG', 'JPG', 'WebP', 'AVIF', 'BMP'],
    gradient: 'from-[#7c5cff] to-[#22d3ee]',
  },
  {
    to: '/audio',
    icon: AudioLines,
    title: 'Audio Converter',
    description: 'Convert between MP3, WAV, OGG, FLAC and AAC with adjustable bitrate.',
    tags: ['MP3', 'WAV', 'OGG', 'FLAC', 'AAC'],
    gradient: 'from-[#ff5c9a] to-[#7c5cff]',
  },
  {
    to: '/video',
    icon: Video,
    title: 'Video Converter & Compressor',
    description: 'Convert MP4, WebM, MOV, and GIF, or shrink a video to a target size.',
    tags: ['MP4', 'WebM', 'MOV', 'GIF'],
    gradient: 'from-[#7c5cff] to-[#ff5c9a]',
  },
  {
    to: '/document',
    icon: FileText,
    title: 'Document Converter',
    description: 'Convert between Word, HTML, Markdown, RTF, PDF, and plain text files.',
    tags: ['DOCX', 'HTML', 'Markdown', 'RTF', 'PDF', 'TXT'],
    gradient: 'from-[#22d3ee] to-[#7c5cff]',
  },
  {
    to: '/pdf',
    icon: Files,
    title: 'PDF Toolkit',
    description: 'Merge multiple PDFs, split one into pages, or export pages as images.',
    tags: ['Merge', 'Split', 'Images'],
    gradient: 'from-[#22d3ee] to-[#ff5c9a]',
  },
  {
    to: '/archive',
    icon: FolderArchive,
    title: 'Zip & Unzip',
    description: 'Bundle files into a .zip archive, or extract files from an existing one.',
    tags: ['ZIP'],
    gradient: 'from-[#ff5c9a] to-[#22d3ee]',
  },
  {
    to: '/hash',
    icon: Hash,
    title: 'File Hash / Checksum',
    description: 'Compute MD5, SHA-1, SHA-256, and SHA-512 checksums to verify file integrity.',
    tags: ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'],
    gradient: 'from-[#7c5cff] to-[#22d3ee]',
  },
  {
    to: '/batch-download',
    icon: DownloadCloud,
    title: 'Batch Downloader',
    description: 'Paste a list of file URLs and download them all in parallel, individually or as a zip.',
    tags: ['Bulk', 'Parallel', 'ZIP'],
    gradient: 'from-[#ff5c9a] to-[#7c5cff]',
  },
]

const FEATURES = [
  { icon: Shield, title: 'Private by default', description: 'Processing happens on-device — nothing is uploaded anywhere.' },
  { icon: Zap, title: 'Fast', description: 'Native browser APIs and WebAssembly keep conversions snappy.' },
  { icon: Gauge, title: 'Precise control', description: 'Dial in an exact target size or quality, not just a preset.' },
]

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center">
          <div className="h-[420px] w-[720px] rounded-full bg-[var(--color-accent)]/20 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-900/10 bg-zinc-900/5 px-4 py-1.5 text-sm text-zinc-900/60 dark:border-white/10 dark:bg-white/5 dark:text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-2)]" />
            100% client-side file processing
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 sm:text-6xl dark:text-white">
            Every file tool you need,
            <br />
            <span className="text-gradient">in one place.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-zinc-900/50 dark:text-white/50">
            Compress images to an exact size, convert between formats, and transform documents —
            all without leaving your browser.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {TOOLS.map(({ to, icon: Icon, title, description, tags, gradient }) => (
            <Link
              key={to}
              to={to}
              className="group glass relative flex flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:glow-accent"
            >
              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}
              >
                <Icon className="h-6 w-6 text-white" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-zinc-900/45 dark:text-white/45">{description}</p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-900/5 px-2 py-0.5 text-xs font-medium text-zinc-900/50 dark:bg-white/5 dark:text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-medium text-zinc-900/60 transition-all group-hover:gap-2.5 group-hover:text-zinc-900 dark:text-white/60 dark:group-hover:text-white">
                Open tool
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-900/8 bg-zinc-900/[0.015] px-6 py-16 dark:border-white/8 dark:bg-white/[0.015]">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900/5 dark:bg-white/5">
                <Icon className="h-5 w-5 text-[var(--color-accent-2)]" />
              </div>
              <h4 className="font-medium text-zinc-900 dark:text-white">{title}</h4>
              <p className="mt-1.5 text-sm text-zinc-900/45 dark:text-white/45">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
