export type ProxyMethod = 'GET' | 'POST'

export interface CorsProxy {
  id: string
  name: string
  method: ProxyMethod
  urlTemplate: string
  bodyTemplate?: string
  builtin?: boolean
}

export const DIRECT_PROXY_ID = 'direct'

/**
 * {{url}} is replaced with the raw target URL, {{urlEncoded}} with its
 * encodeURIComponent()'d form. Either token can appear anywhere in the
 * URL, body, whatever the template needs.
 */
export const BUILTIN_PROXIES: CorsProxy[] = [
  { id: DIRECT_PROXY_ID, name: 'None (direct request)', method: 'GET', urlTemplate: '{{url}}', builtin: true },
  {
    id: 'allorigins',
    name: 'AllOrigins',
    method: 'GET',
    urlTemplate: 'https://api.allorigins.win/raw?url={{urlEncoded}}',
    builtin: true,
  },
  {
    id: 'corsproxy-io',
    name: 'corsproxy.io',
    method: 'GET',
    urlTemplate: 'https://corsproxy.io/?url={{urlEncoded}}',
    builtin: true,
  },
  {
    id: 'thingproxy',
    name: 'thingproxy',
    method: 'GET',
    urlTemplate: 'https://thingproxy.freeboard.io/fetch/{{url}}',
    builtin: true,
  },
  {
    id: 'codetabs',
    name: 'CodeTabs',
    method: 'GET',
    urlTemplate: 'https://api.codetabs.com/v1/proxy?quest={{urlEncoded}}',
    builtin: true,
  },
]

const STORAGE_KEY = 'fileutils.customCorsProxies'

export function loadCustomProxies(): CorsProxy[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistCustomProxies(proxies: CorsProxy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proxies))
}

export function addCustomProxy(proxy: Omit<CorsProxy, 'id' | 'builtin'>): CorsProxy {
  const full: CorsProxy = { ...proxy, id: crypto.randomUUID(), builtin: false }
  persistCustomProxies([...loadCustomProxies(), full])
  return full
}

export function deleteCustomProxy(id: string) {
  persistCustomProxies(loadCustomProxies().filter((p) => p.id !== id))
}

function applyTemplate(template: string, targetUrl: string): string {
  return template
    .replaceAll('{{urlEncoded}}', encodeURIComponent(targetUrl))
    .replaceAll('{{url}}', targetUrl)
}

export interface BuiltProxyRequest {
  url: string
  method: ProxyMethod
  body?: string
}

export function buildProxiedRequest(proxy: CorsProxy, targetUrl: string): BuiltProxyRequest {
  return {
    url: applyTemplate(proxy.urlTemplate, targetUrl),
    method: proxy.method,
    body:
      proxy.method === 'POST' && proxy.bodyTemplate ? applyTemplate(proxy.bodyTemplate, targetUrl) : undefined,
  }
}
