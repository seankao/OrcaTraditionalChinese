import {
  assertSafeCatalogKeys,
  DEFAULT_LIMITS,
  flattenCatalog,
  isProtectedPluginTranslation
} from './catalog-utils.mjs'

export function unflattenCatalog(entries) {
  const root = {}
  const pairs = entries instanceof Map ? [...entries] : Object.entries(entries)
  for (const [path, value] of pairs.sort(([left], [right]) => left.localeCompare(right))) {
    const parts = path.split('.')
    let cursor = root
    for (let index = 0; index < parts.length - 1; index += 1) {
      cursor[parts[index]] ??= {}
      cursor = cursor[parts[index]]
    }
    cursor[parts.at(-1)] = value
  }
  return root
}

// 上游 en.json 可能用含 "." 的扁平 key，但 Orca 會整包拒絕含這種 key 的外掛 catalog，
// 所以改記為 excluded 而不是中止同步。用 null-prototype 物件，讓 __proto__ 仍被後續檢查擋下。
function splitDottedSourceKeys(value, segments = [], excluded = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { catalog: value, excluded }
  }
  const catalog = Object.create(null)
  for (const [key, child] of Object.entries(value)) {
    const childSegments = [...segments, key]
    if (key.includes('.')) {
      for (const [path, leaf] of flattenCatalog(child, childSegments.join('.'))) {
        excluded.push({
          key: path,
          segments: childSegments,
          reason: 'source key contains "." which plugin catalogs reject',
          sourceLength: leaf.length
        })
      }
      continue
    }
    catalog[key] = splitDottedSourceKeys(child, childSegments, excluded).catalog
  }
  return { catalog, excluded }
}

export function reconcileCatalog({
  previousEnglish = {},
  nextEnglish,
  currentCatalog = {},
  simplified = {},
  translatablePluginChrome = new Set(),
  previousChangedSource = {},
  previousRemovedKeys = {}
}) {
  const previousSource = splitDottedSourceKeys(previousEnglish).catalog
  const nextSource = splitDottedSourceKeys(nextEnglish)
  for (const catalog of [previousSource, nextSource.catalog, currentCatalog, simplified]) {
    assertSafeCatalogKeys(catalog)
  }
  const previous = flattenCatalog(previousSource)
  const next = flattenCatalog(nextSource.catalog)
  const current = flattenCatalog(currentCatalog)
  const zh = flattenCatalog(simplified)
  const retained = new Map()
  const todo = {}
  const changedSource = structuredClone(previousChangedSource)
  const removedKeys = structuredClone(previousRemovedKeys)
  const protectedKeys = []
  const excludedKeys = [...nextSource.excluded]

  for (const [key, english] of [...next].sort(([left], [right]) => left.localeCompare(right))) {
    delete removedKeys[key]
    if (isProtectedPluginTranslation(key, translatablePluginChrome)) {
      delete changedSource[key]
      protectedKeys.push(key)
      continue
    }
    if (english.length > DEFAULT_LIMITS.maxStringLength) {
      delete changedSource[key]
      excludedKeys.push({
        key,
        reason: 'source exceeds plugin max string length',
        sourceLength: english.length
      })
      continue
    }
    const translation = current.get(key)
    const oldEnglish = previous.get(key)
    if (oldEnglish !== undefined && oldEnglish !== english) {
      const pending = changedSource[key]
      changedSource[key] = {
        previousEnglish: pending?.previousEnglish ?? oldEnglish,
        english,
        translation: translation ?? pending?.translation ?? null,
        simplified: zh.get(key) ?? null
      }
      continue
    }
    if (translation !== undefined) {
      delete changedSource[key]
      retained.set(key, translation)
      continue
    }
    if (changedSource[key]) continue
    todo[key] = {
      english,
      simplified: zh.get(key) ?? null,
      reason: oldEnglish === undefined ? 'new' : 'missing'
    }
  }

  for (const [key, oldEnglish] of [...previous].sort(([left], [right]) => left.localeCompare(right))) {
    if (next.has(key)) continue
    const pending = changedSource[key]
    const translation = current.get(key) ?? pending?.translation
    if (translation !== undefined && translation !== null) {
      removedKeys[key] = { previousEnglish: oldEnglish, translation }
    }
    delete changedSource[key]
  }

  excludedKeys.sort((left, right) => left.key.localeCompare(right.key))
  return {
    catalog: unflattenCatalog(retained),
    todo,
    changedSource,
    removedKeys,
    protectedKeys,
    excludedKeys
  }
}
