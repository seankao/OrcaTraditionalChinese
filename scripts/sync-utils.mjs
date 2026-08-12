import {
  assertSafeCatalogKeys,
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

export function reconcileCatalog({
  previousEnglish = {},
  nextEnglish,
  currentCatalog = {},
  simplified = {},
  translatablePluginChrome = new Set(),
  previousChangedSource = {},
  previousRemovedKeys = {}
}) {
  for (const catalog of [previousEnglish, nextEnglish, currentCatalog, simplified]) {
    assertSafeCatalogKeys(catalog)
  }
  const previous = flattenCatalog(previousEnglish)
  const next = flattenCatalog(nextEnglish)
  const current = flattenCatalog(currentCatalog)
  const zh = flattenCatalog(simplified)
  const retained = new Map()
  const todo = {}
  const changedSource = structuredClone(previousChangedSource)
  const removedKeys = structuredClone(previousRemovedKeys)
  const protectedKeys = []

  for (const [key, english] of [...next].sort(([left], [right]) => left.localeCompare(right))) {
    delete removedKeys[key]
    if (isProtectedPluginTranslation(key, translatablePluginChrome)) {
      delete changedSource[key]
      protectedKeys.push(key)
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

  return {
    catalog: unflattenCatalog(retained),
    todo,
    changedSource,
    removedKeys,
    protectedKeys
  }
}
