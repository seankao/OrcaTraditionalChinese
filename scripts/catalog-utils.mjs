const DOUBLE_PLACEHOLDER_RE = /\{\{[^{}]+\}\}/g
const SINGLE_PLACEHOLDER_RE = /(?<!\{)\{([A-Za-z_][A-Za-z0-9_.-]*)\}(?!\})/g
const DANGEROUS_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isUnsafeKey(key) {
  return (
    key.length === 0 ||
    key.length > 128 ||
    key.includes('.') ||
    DANGEROUS_KEYS.has(key) ||
    [...key].some((character) => character.charCodeAt(0) <= 31)
  )
}

export function assertSafeCatalogKeys(value) {
  const stack = [value]
  while (stack.length > 0) {
    const current = stack.pop()
    if (!current || typeof current !== 'object' || Array.isArray(current)) continue
    for (const [key, child] of Object.entries(current)) {
      if (isUnsafeKey(key)) throw new Error(`unsafe catalog key: ${key || '(empty)'}`)
      stack.push(child)
    }
  }
}

export function flattenCatalog(value, prefix = '') {
  if (typeof value === 'string') {
    return new Map([[prefix, value]])
  }
  const result = new Map()
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      const childPath = prefix ? `${prefix}.${key}` : key
      for (const [path, leaf] of flattenCatalog(child, childPath)) {
        result.set(path, leaf)
      }
    }
  }
  return result
}

export const DEFAULT_LIMITS = {
  maxDepth: 16,
  maxEntries: 20_000,
  maxStringLength: 8_192,
  maxBytes: 5 * 1024 * 1024
}

export function validateManifest(manifest) {
  const errors = []
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['manifest must be a JSON object']
  }
  if (manifest.manifestVersion !== 1) errors.push('manifestVersion must be 1')
  if (manifest.pluginApi !== 1) errors.push('pluginApi must be 1')
  if (manifest.id !== 'zh-tw') errors.push('id must be zh-tw')
  if (manifest.publisher !== 'seankao') errors.push('publisher must be seankao')
  if (manifest.name !== '繁體中文') errors.push('name must be 繁體中文')
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('version must be semantic x.y.z')
  }
  if (manifest.engines?.orca !== '>=1.4.223') {
    errors.push('engines.orca must be >=1.4.223')
  }
  const packs = manifest.contributes?.languagePacks
  if (!Array.isArray(packs) || packs.length !== 1) {
    errors.push('manifest must contribute exactly one language pack')
  } else {
    if (packs[0]?.locale !== 'zh-TW') errors.push('language pack locale must be zh-TW')
    if (packs[0]?.path !== 'locales/zh-TW.json') {
      errors.push('language pack path must be locales/zh-TW.json')
    }
  }
  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length !== 0) {
    errors.push('capabilities must be empty for a data-only language pack')
  }
  if ('main' in manifest) errors.push('data-only language pack must not declare main')
  if ('worker' in manifest) errors.push('data-only language pack must not declare worker')
  return errors
}

export const MARKETPLACE_SOURCE_URL = 'https://github.com/seankao/OrcaTraditionalChinese.git'
const MARKETPLACE_OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/
const MARKETPLACE_CATEGORY_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const UNSUPPORTED_MARKETPLACE_CATEGORIES = new Set(['themes', 'icons', 'icon-themes', 'terminal-themes', 'skills'])

function unexpectedKeys(value, allowed) {
  return Object.keys(value).filter((key) => !allowed.includes(key))
}

export function validateMarketplace(marketplace, manifest) {
  if (!marketplace || typeof marketplace !== 'object' || Array.isArray(marketplace)) {
    return ['marketplace must be a JSON object']
  }
  const errors = []
  for (const key of unexpectedKeys(marketplace, ['name', 'owner', 'plugins'])) {
    errors.push(`marketplace has unexpected key ${key}`)
  }
  if (typeof marketplace.name !== 'string' || marketplace.name.length === 0 || marketplace.name.length > 256) {
    errors.push('marketplace name must be 1-256 characters')
  }
  if (typeof marketplace.owner !== 'string' || !MARKETPLACE_OWNER_RE.test(marketplace.owner)) {
    errors.push('marketplace owner is invalid')
  }
  const plugins = marketplace.plugins
  if (!Array.isArray(plugins) || plugins.length !== 1) {
    return [...errors, 'marketplace must list exactly one plugin']
  }
  const entry = plugins[0]
  for (const key of unexpectedKeys(entry, ['id', 'source', 'description', 'categories'])) {
    errors.push(`marketplace entry has unexpected key ${key}`)
  }
  if (entry.id !== `${manifest.publisher}.${manifest.id}`) {
    errors.push('marketplace entry id must match the manifest identity')
  }
  const source = entry.source ?? {}
  for (const key of unexpectedKeys(source, ['kind', 'url', 'ref'])) {
    errors.push(`marketplace source has unexpected key ${key}`)
  }
  if (source.kind !== 'git') errors.push('marketplace source kind must be git')
  if (source.url !== MARKETPLACE_SOURCE_URL) {
    errors.push(`marketplace source url must be ${MARKETPLACE_SOURCE_URL}`)
  }
  // Orca 從 main 讀這份檔案，「檢查更新」裝的是 ref 指向的版本；ref 沒跟著版本號走，
  // 使用者按更新只會重裝舊版，而且不會有任何錯誤。
  if (source.ref !== `v${manifest.version}`) {
    errors.push(`marketplace source ref must be v${manifest.version}`)
  }
  if (entry.description !== undefined && (typeof entry.description !== 'string' || entry.description.length === 0 || entry.description.length > 4096)) {
    errors.push('marketplace description must be 1-4096 characters')
  }
  const categories = entry.categories ?? []
  if (!Array.isArray(categories) || categories.length > 16 || new Set(categories).size !== categories.length) {
    errors.push('marketplace categories must be at most 16 unique slugs')
  } else {
    for (const category of categories) {
      if (typeof category !== 'string' || !MARKETPLACE_CATEGORY_RE.test(category)) {
        errors.push(`marketplace category ${category} must be a lowercase slug`)
      } else if (UNSUPPORTED_MARKETPLACE_CATEGORIES.has(category)) {
        errors.push(`marketplace category ${category} hides the listing in Orca`)
      }
    }
  }
  return errors
}

export function isProtectedPluginTranslation(path, translatablePluginChrome = new Set()) {
  const prefix = 'auto.components.settings.'
  if (!path.startsWith(prefix) || translatablePluginChrome.has(path)) return false
  const moduleName = path.slice(prefix.length).split('.')[0]
  return /^plugin/i.test(moduleName)
}

export function validateCatalog({
  catalog,
  english,
  rawBytes = Buffer.byteLength(JSON.stringify(catalog), 'utf8'),
  limits = DEFAULT_LIMITS,
  translatablePluginChrome = new Set()
}) {
  const effectiveLimits = { ...DEFAULT_LIMITS, ...limits }
  const errors = []
  if (rawBytes > effectiveLimits.maxBytes) {
    errors.push(`catalog exceeds ${effectiveLimits.maxBytes} bytes`)
  }
  const stack = [{ value: catalog, path: '', depth: 0 }]
  let entries = 0
  let maxDepth = 0
  while (stack.length > 0) {
    const { value, path, depth } = stack.pop()
    maxDepth = Math.max(maxDepth, depth)
    if (depth > effectiveLimits.maxDepth) {
      errors.push(`catalog exceeds depth ${effectiveLimits.maxDepth}`)
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`translation at ${path || '(root)'} must be a string or object`)
      continue
    }
    for (const [key, child] of Object.entries(value)) {
      entries += 1
      if (entries === effectiveLimits.maxEntries + 1) {
        errors.push(`catalog exceeds ${effectiveLimits.maxEntries} entries`)
      }
      if (isUnsafeKey(key)) {
        errors.push(`unsafe catalog key: ${key || '(empty)'}`)
        continue
      }
      const childPath = path ? `${path}.${key}` : key
      if (typeof child === 'string') {
        if (child.length > effectiveLimits.maxStringLength) {
          errors.push(`translation at ${childPath} exceeds ${effectiveLimits.maxStringLength} characters`)
        }
        continue
      }
      if (!child || typeof child !== 'object' || Array.isArray(child)) {
        errors.push(`translation at ${childPath} must be a string or object`)
        continue
      }
      stack.push({ value: child, path: childPath, depth: depth + 1 })
    }
  }
  const translated = flattenCatalog(catalog)
  const source = flattenCatalog(english)
  for (const [key, translatedValue] of translated) {
    if (isProtectedPluginTranslation(key, translatablePluginChrome)) {
      errors.push(`protected security copy at ${key}`)
      continue
    }
    if (!source.has(key)) {
      errors.push(`orphan key: ${key}`)
      continue
    }
    const sourceTokens = interpolationTokens(source.get(key))
    const translatedTokens = interpolationTokens(translatedValue)
    if (JSON.stringify(sourceTokens) !== JSON.stringify(translatedTokens)) {
      errors.push(`placeholder mismatch: ${key}`)
    }
  }
  return {
    errors,
    stats: {
      translatedLeaves: translated.size,
      upstreamLeaves: source.size,
      entries,
      maxDepth,
      bytes: rawBytes
    }
  }
}

export function interpolationTokens(value) {
  const text = String(value)
  const doubles = [...text.matchAll(DOUBLE_PLACEHOLDER_RE)].map((match) => match[0])
  const withoutDoubles = text.replace(DOUBLE_PLACEHOLDER_RE, '')
  const singles = [...withoutDoubles.matchAll(SINGLE_PLACEHOLDER_RE)].map((match) => match[0])
  return [...doubles, ...singles].sort()
}
