import { useMemo, useState } from 'react'
import { Download, DownloadCloud, FolderArchive, CheckCircle2, XCircle, Loader2, Plus, X } from 'lucide-react'
import JSZip from 'jszip'
import { Card, PrimaryButton, SegmentedControl } from '../components/ui'
import { SearchSelect, type SearchSelectOption } from '../components/SearchSelect'
import { downloadWithProgress, filenameFromUrl, runBatch } from '../lib/batchDownload'
import { formatBytes } from '../lib/imageProcessing'
import {
  BUILTIN_PROXIES,
  DIRECT_PROXY_ID,
  loadCustomProxies,
  addCustomProxy,
  deleteCustomProxy,
  type CorsProxy,
  type ProxyMethod,
} from '../lib/corsProxies'

type ItemStatus = 'pending' | 'downloading' | 'done' | 'error'

interface BatchItem {
  url: string
  filename: string
  status: ItemStatus
  loaded: number
  total: number | null
  blob: Blob | null
  error: string | null
}

const CONCURRENCY = 4

export default function BatchDownloadTool() {
  const [rawUrls, setRawUrls] = useState('')
  const [items, setItems] = useState<BatchItem[]>([])
  const [running, setRunning] = useState(false)

  const [customProxies, setCustomProxies] = useState<CorsProxy[]>(() => loadCustomProxies())
  const [proxyId, setProxyId] = useState(DIRECT_PROXY_ID)
  const [showProxyForm, setShowProxyForm] = useState(false)
  const [newProxyName, setNewProxyName] = useState('')
  const [newProxyMethod, setNewProxyMethod] = useState<ProxyMethod>('GET')
  const [newProxyUrl, setNewProxyUrl] = useState('')
  const [newProxyBody, setNewProxyBody] = useState('')
  const [proxyFormError, setProxyFormError] = useState<string | null>(null)

  const allProxies = useMemo(() => [...BUILTIN_PROXIES, ...customProxies], [customProxies])
  const selectedProxy = allProxies.find((p) => p.id === proxyId) ?? BUILTIN_PROXIES[0]

  const proxyOptions: SearchSelectOption<string>[] = allProxies.map((p) => ({
    value: p.id,
    label: p.name,
    description: p.builtin ? undefined : 'custom',
  }))

  const handleSaveProxy = () => {
    setProxyFormError(null)
    if (!newProxyName.trim()) return setProxyFormError('Give the proxy a name.')
    if (!newProxyUrl.includes('{{url}}') && !newProxyUrl.includes('{{urlEncoded}}')) {
      return setProxyFormError('URL template must contain {{url}} or {{urlEncoded}}.')
    }

    const created = addCustomProxy({
      name: newProxyName.trim(),
      method: newProxyMethod,
      urlTemplate: newProxyUrl.trim(),
      bodyTemplate: newProxyMethod === 'POST' ? newProxyBody.trim() || undefined : undefined,
    })
    setCustomProxies((prev) => [...prev, created])
    setProxyId(created.id)
    setShowProxyForm(false)
    setNewProxyName('')
    setNewProxyUrl('')
    setNewProxyBody('')
    setNewProxyMethod('GET')
  }

  const handleDeleteProxy = (id: string) => {
    deleteCustomProxy(id)
    setCustomProxies((prev) => prev.filter((p) => p.id !== id))
    if (proxyId === id) setProxyId(DIRECT_PROXY_ID)
  }

  const completed = items.filter((i) => i.status === 'done')
  const allDone = items.length > 0 && items.every((i) => i.status === 'done' || i.status === 'error')

  const overallProgress = useMemo(() => {
    if (items.length === 0) return 0
    const done = items.filter((i) => i.status === 'done' || i.status === 'error').length
    return done / items.length
  }, [items])

  const updateItem = (index: number, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const handleStart = async () => {
    const urls = rawUrls
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)

    if (urls.length === 0) return

    const initial: BatchItem[] = urls.map((url, i) => ({
      url,
      filename: filenameFromUrl(url, i),
      status: 'pending',
      loaded: 0,
      total: null,
      blob: null,
      error: null,
    }))
    setItems(initial)
    setRunning(true)

    await runBatch(initial, CONCURRENCY, async (item, index) => {
      updateItem(index, { status: 'downloading' })
      try {
        const blob = await downloadWithProgress(item.url, selectedProxy, ({ loaded, total }) => {
          updateItem(index, { loaded, total })
        })
        updateItem(index, { status: 'done', blob, loaded: blob.size, total: blob.size })
      } catch (e) {
        updateItem(index, { status: 'error', error: e instanceof Error ? e.message : 'Failed' })
      }
    })

    setRunning(false)
  }

  const downloadOne = (item: BatchItem) => {
    if (!item.blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(item.blob)
    a.download = item.filename
    a.click()
  }

  const downloadAll = () => {
    completed.forEach((item, i) => {
      setTimeout(() => downloadOne(item), i * 200)
    })
  }

  const downloadZip = async () => {
    const zip = new JSZip()
    completed.forEach((item) => {
      if (item.blob) zip.file(item.filename, item.blob)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'batch-download.zip'
    a.click()
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Batch Downloader</h1>
        <p className="mt-2 text-zinc-900/45 dark:text-white/45">
          Paste a list of file URLs, download them all in parallel, and grab them individually or as a zip.
        </p>
      </div>

      <div className="space-y-6">
        <Card className="space-y-4">
          <textarea
            value={rawUrls}
            onChange={(e) => setRawUrls(e.target.value)}
            placeholder={'https://example.com/file1.png\nhttps://example.com/file2.pdf\nhttps://example.com/file3.zip'}
            rows={6}
            className="w-full resize-y rounded-xl border border-zinc-900/10 bg-zinc-900/[0.02] px-3.5 py-3 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-900/30 focus:ring-2 focus:ring-[var(--color-accent)]/50 dark:border-white/10 dark:bg-white/[0.02] dark:text-white dark:placeholder:text-white/30"
          />
          <p className="text-xs text-zinc-900/35 dark:text-white/35">
            One URL per line. Direct downloads only work for URLs that allow cross-origin access (CORS) — use a
            proxy below to route around that.
          </p>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-zinc-900/60 dark:text-white/60">CORS proxy</p>
              <button
                onClick={() => setShowProxyForm((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent-2)] hover:underline"
              >
                <Plus className="h-3 w-3" />
                Add custom proxy
              </button>
            </div>
            <SearchSelect options={proxyOptions} value={proxyId} onChange={setProxyId} placeholder="Search proxies…" />
          </div>

          {customProxies.length > 0 && (
            <ul className="space-y-1">
              {customProxies.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-900/10 bg-zinc-900/[0.02] px-2.5 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <span className="min-w-0 flex-1 truncate text-zinc-900/70 dark:text-white/70">
                    <span className="font-medium">{p.name}</span>{' '}
                    <span className="text-zinc-900/35 dark:text-white/35">
                      {p.method} {p.urlTemplate}
                    </span>
                  </span>
                  <button
                    onClick={() => handleDeleteProxy(p.id)}
                    className="shrink-0 rounded p-0.5 text-zinc-900/40 hover:text-red-400 dark:text-white/40"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showProxyForm && (
            <div className="space-y-3 rounded-xl border border-zinc-900/10 bg-zinc-900/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
              <div>
                <p className="mb-1.5 text-xs text-zinc-900/50 dark:text-white/50">Name</p>
                <input
                  value={newProxyName}
                  onChange={(e) => setNewProxyName(e.target.value)}
                  placeholder="My proxy"
                  className="w-full rounded-lg border border-zinc-900/10 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-900/30 focus:ring-2 focus:ring-[var(--color-accent)]/50 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs text-zinc-900/50 dark:text-white/50">Method</p>
                <SegmentedControl
                  options={[
                    { value: 'GET', label: 'GET' },
                    { value: 'POST', label: 'POST' },
                  ]}
                  value={newProxyMethod}
                  onChange={setNewProxyMethod}
                />
              </div>

              <div>
                <p className="mb-1.5 text-xs text-zinc-900/50 dark:text-white/50">
                  URL template — use <code className="text-[var(--color-accent-2)]">{'{{url}}'}</code> or{' '}
                  <code className="text-[var(--color-accent-2)]">{'{{urlEncoded}}'}</code>
                </p>
                <input
                  value={newProxyUrl}
                  onChange={(e) => setNewProxyUrl(e.target.value)}
                  placeholder="https://my-proxy.example.com/?target={{urlEncoded}}"
                  className="w-full rounded-lg border border-zinc-900/10 bg-transparent px-3 py-2 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-900/30 focus:ring-2 focus:ring-[var(--color-accent)]/50 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                />
              </div>

              {newProxyMethod === 'POST' && (
                <div>
                  <p className="mb-1.5 text-xs text-zinc-900/50 dark:text-white/50">
                    Body template (optional) — <code className="text-[var(--color-accent-2)]">{'{{url}}'}</code>{' '}
                    works here too
                  </p>
                  <textarea
                    value={newProxyBody}
                    onChange={(e) => setNewProxyBody(e.target.value)}
                    placeholder={'{"target": "{{url}}"}'}
                    rows={3}
                    className="w-full resize-y rounded-lg border border-zinc-900/10 bg-transparent px-3 py-2 font-mono text-sm text-zinc-900 outline-none placeholder:text-zinc-900/30 focus:ring-2 focus:ring-[var(--color-accent)]/50 dark:border-white/10 dark:text-white dark:placeholder:text-white/30"
                  />
                </div>
              )}

              {proxyFormError && <p className="text-xs text-red-400">{proxyFormError}</p>}

              <button
                onClick={handleSaveProxy}
                className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:brightness-110"
              >
                Save proxy
              </button>
            </div>
          )}

          <PrimaryButton onClick={handleStart} loading={running} className="w-full">
            {running ? 'Downloading…' : 'Start'}
          </PrimaryButton>
        </Card>

        {items.length > 0 && (
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-zinc-900/60 dark:text-white/60">Overall progress</span>
                  <span className="font-mono text-zinc-900/80 dark:text-white/80">
                    {completed.length}/{items.length}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] transition-all"
                    style={{ width: `${Math.round(overallProgress * 100)}%` }}
                  />
                </div>
              </div>
              {allDone && completed.length > 0 && (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={downloadAll}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-900/15 bg-zinc-900/5 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <DownloadCloud className="h-4 w-4" />
                    All
                  </button>
                  <button
                    onClick={downloadZip}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-900/15 bg-zinc-900/5 px-3 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-900/10 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                  >
                    <FolderArchive className="h-4 w-4" />
                    Zip
                  </button>
                </div>
              )}
            </div>

            <ul className="scrollbar-thin max-h-[480px] space-y-2 overflow-y-auto">
              {items.map((item, i) => {
                const pct =
                  item.total && item.total > 0
                    ? Math.min(100, Math.round((item.loaded / item.total) * 100))
                    : item.status === 'done'
                      ? 100
                      : null

                return (
                  <li
                    key={`${item.url}-${i}`}
                    className="rounded-xl border border-zinc-900/10 bg-zinc-900/[0.02] px-3.5 py-3 dark:border-white/10 dark:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      {item.status === 'done' && <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-accent-2)]" />}
                      {item.status === 'error' && <XCircle className="h-4 w-4 shrink-0 text-red-400" />}
                      {(item.status === 'downloading' || item.status === 'pending') && (
                        <Loader2
                          className={`h-4 w-4 shrink-0 text-zinc-900/40 dark:text-white/40 ${
                            item.status === 'downloading' ? 'animate-spin' : ''
                          }`}
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-900/80 dark:text-white/80" title={item.url}>
                        {item.filename}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-900/35 dark:text-white/35">
                        {item.status === 'error'
                          ? item.error
                          : item.total
                            ? formatBytes(item.total)
                            : item.loaded
                              ? formatBytes(item.loaded)
                              : ''}
                      </span>
                      {item.status === 'done' && (
                        <button
                          onClick={() => downloadOne(item)}
                          className="shrink-0 rounded p-1 text-zinc-900/40 hover:text-[var(--color-accent-2)] dark:text-white/40"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {item.status === 'downloading' && (
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-900/10 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-2)] ${
                            pct === null ? 'w-1/3 animate-pulse' : 'transition-all'
                          }`}
                          style={pct !== null ? { width: `${pct}%` } : undefined}
                        />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}
