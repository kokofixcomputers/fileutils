import { Routes, Route, Link, useLocation } from 'react-router-dom'
import {
  FileStack,
  Image,
  AudioLines,
  Video,
  FileText,
  Files,
  FolderArchive,
  Hash,
  DownloadCloud,
} from 'lucide-react'
import clsx from 'clsx'
import Home from './pages/Home'
import ImageTool from './pages/ImageTool'
import AudioTool from './pages/AudioTool'
import VideoTool from './pages/VideoTool'
import DocumentTool from './pages/DocumentTool'
import PdfTool from './pages/PdfTool'
import ArchiveTool from './pages/ArchiveTool'
import HashTool from './pages/HashTool'
import BatchDownloadTool from './pages/BatchDownloadTool'
import { ThemeToggle } from './components/ThemeToggle'

const NAV_LINKS = [
  { to: '/image', label: 'Image', icon: Image },
  { to: '/audio', label: 'Audio', icon: AudioLines },
  { to: '/video', label: 'Video', icon: Video },
  { to: '/document', label: 'Document', icon: FileText },
  { to: '/pdf', label: 'PDF', icon: Files },
  { to: '/archive', label: 'Archive', icon: FolderArchive },
  { to: '/hash', label: 'Hash', icon: Hash },
  { to: '/batch-download', label: 'Batch DL', icon: DownloadCloud },
]

function Header() {
  const location = useLocation()
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-900/8 bg-[var(--color-bg)]/80 backdrop-blur-xl dark:border-white/8">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-2)]">
            <FileStack className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-white">FileUtils</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-0.5">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              title={label}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors 2xl:px-3.5',
                location.pathname === to
                  ? 'bg-zinc-900/10 text-zinc-900 dark:bg-white/10 dark:text-white'
                  : 'text-zinc-900/50 hover:bg-zinc-900/5 hover:text-zinc-900/80 dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white/80',
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden 2xl:inline">{label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-900/8 py-8 dark:border-white/8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-zinc-900/30 dark:text-white/30">
        Everything runs locally in your browser — files never leave your device.
      </div>
    </footer>
  )
}

function App() {
  return (
    <div className="flex min-h-svh flex-col bg-grid">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/image" element={<ImageTool />} />
          <Route path="/audio" element={<AudioTool />} />
          <Route path="/video" element={<VideoTool />} />
          <Route path="/document" element={<DocumentTool />} />
          <Route path="/pdf" element={<PdfTool />} />
          <Route path="/archive" element={<ArchiveTool />} />
          <Route path="/hash" element={<HashTool />} />
          <Route path="/batch-download" element={<BatchDownloadTool />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
