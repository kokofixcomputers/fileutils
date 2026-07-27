import mammoth from 'mammoth'
import jsPDF from 'jspdf'

export type DocInputFormat = 'docx' | 'html' | 'md' | 'rtf' | 'txt'
export type DocOutputFormat = 'pdf' | 'html' | 'md' | 'txt'

export interface DocConvertResult {
  blob: Blob
  previewHtml: string
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function plainTextToHtml(text: string): string {
  return `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(text)}</pre>`
}

/** Minimal Markdown -> HTML for headings, bold/italic, lists, links, and paragraphs. */
function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let inList = false

  const inline = (s: string) =>
    escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const heading = /^(#{1,6})\s+(.*)/.exec(line)
    const listItem = /^[-*]\s+(.*)/.exec(line)

    if (heading) {
      if (inList) {
        out.push('</ul>')
        inList = false
      }
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    } else if (listItem) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(listItem[1])}</li>`)
    } else if (line.trim() === '') {
      if (inList) {
        out.push('</ul>')
        inList = false
      }
    } else {
      if (inList) {
        out.push('</ul>')
        inList = false
      }
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  if (inList) out.push('</ul>')

  return out.join('\n')
}

/** Strips RTF control words/groups to recover plain text. Handles the common cases, not the full spec. */
function rtfToPlainText(rtf: string): string {
  let text = rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\tab/g, '\t')
    .replace(/\{\\\*?[^{}]+\}/g, '')
    .replace(/\\[a-zA-Z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\'[0-9a-fA-F]{2}/g, '')

  return text.replace(/\n{3,}/g, '\n\n').trim()
}

function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const lines: string[] = []

  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
    return Array.from(node.childNodes).map(inline).join('')
  }

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const t = node.textContent?.trim()
      if (t) lines.push(t)
      return
    }
    const el = node as HTMLElement
    if (/^(P|H[1-6]|LI|PRE|TD|TH)$/.test(el.tagName)) {
      const t = inline(el).trim()
      if (t) lines.push(t)
    } else {
      Array.from(el.childNodes).forEach(walk)
    }
  }

  walk(doc.body)
  return lines.join('\n\n')
}

function htmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const lines: string[] = []

  const inline = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    const inner = Array.from(el.childNodes).map(inline).join('')
    switch (el.tagName) {
      case 'STRONG':
      case 'B':
        return `**${inner}**`
      case 'EM':
      case 'I':
        return `*${inner}*`
      case 'CODE':
        return `\`${inner}\``
      case 'A':
        return `[${inner}](${el.getAttribute('href') || ''})`
      case 'BR':
        return '\n'
      default:
        return inner
    }
  }

  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      const t = node.textContent?.trim()
      if (t) lines.push(t)
      return
    }
    const el = node as HTMLElement
    if (/^H[1-6]$/.test(el.tagName)) {
      const level = Number(el.tagName[1])
      lines.push(`${'#'.repeat(level)} ${inline(el).trim()}`)
    } else if (el.tagName === 'P') {
      const t = inline(el).trim()
      if (t) lines.push(t)
    } else if (el.tagName === 'UL' || el.tagName === 'OL') {
      Array.from(el.children).forEach((li) => lines.push(`- ${inline(li).trim()}`))
    } else {
      Array.from(el.childNodes).forEach(walk)
    }
  }

  walk(doc.body)
  return lines.filter(Boolean).join('\n\n')
}

function wrapHtmlDocument(fragment: string): string {
  return `<!doctype html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n${fragment}\n</body>\n</html>`
}

export function detectDocFormat(file: File): DocInputFormat {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'docx') return 'docx'
  if (ext === 'html' || ext === 'htm') return 'html'
  if (ext === 'md' || ext === 'markdown') return 'md'
  if (ext === 'rtf') return 'rtf'
  if (ext === 'txt') return 'txt'

  if (file.type === 'text/html') return 'html'
  if (file.type === 'text/markdown') return 'md'
  if (file.type === 'application/rtf' || file.type === 'text/rtf') return 'rtf'
  if (file.type.startsWith('text/')) return 'txt'

  throw new Error(
    `Unsupported file type "${ext || file.type || 'unknown'}". Supported inputs: DOCX, HTML, Markdown, RTF, TXT.`,
  )
}

async function renderHtmlToPdf(html: string): Promise<Blob> {
  const container = document.createElement('div')
  container.innerHTML = html
  container.style.cssText = `
    width: 700px;
    padding: 24px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 14px;
    line-height: 1.6;
    color: #111;
    background: #fff;
  `
  container.querySelectorAll('img').forEach((img) => {
    img.style.maxWidth = '100%'
  })

  document.body.appendChild(container)
  try {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    await pdf.html(container, {
      autoPaging: 'text',
      margin: [40, 40, 40, 40],
      width: 515, // a4 width (595pt) minus margins
      windowWidth: 700,
    })
    return pdf.output('blob')
  } finally {
    document.body.removeChild(container)
  }
}

export async function convertDocument(file: File, output: DocOutputFormat): Promise<DocConvertResult> {
  const inputFormat = detectDocFormat(file)
  const rawText = inputFormat === 'docx' ? null : await file.text()

  let html: string
  if (inputFormat === 'docx') {
    const arrayBuffer = await file.arrayBuffer()
    html = (await mammoth.convertToHtml({ arrayBuffer })).value
  } else if (inputFormat === 'html') {
    html = rawText!
  } else if (inputFormat === 'md') {
    html = markdownToHtml(rawText!)
  } else if (inputFormat === 'rtf') {
    html = plainTextToHtml(rtfToPlainText(rawText!))
  } else {
    html = plainTextToHtml(rawText!)
  }

  if (output === 'pdf') {
    return { blob: await renderHtmlToPdf(html), previewHtml: html }
  }

  if (output === 'html') {
    const content = inputFormat === 'html' ? rawText! : wrapHtmlDocument(html)
    return { blob: new Blob([content], { type: 'text/html' }), previewHtml: html }
  }

  if (output === 'md') {
    const content = inputFormat === 'md' ? rawText! : htmlToMarkdown(html)
    return { blob: new Blob([content], { type: 'text/markdown' }), previewHtml: html }
  }

  // txt
  const content =
    inputFormat === 'txt' ? rawText! : inputFormat === 'rtf' ? rtfToPlainText(rawText!) : htmlToText(html)
  return { blob: new Blob([content], { type: 'text/plain' }), previewHtml: html }
}

export function extensionForDoc(format: DocOutputFormat): string {
  return format
}
