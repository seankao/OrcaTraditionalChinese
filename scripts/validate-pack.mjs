import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { validateCatalog, validateManifest, validateMarketplace } from './catalog-utils.mjs'

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'))
}

export async function main(root = process.cwd()) {
  const manifestPath = path.join(root, 'orca-plugin.json')
  const catalogPath = path.join(root, 'locales', 'zh-TW.json')
  const englishPath = path.join(root, 'upstream', 'en.json')
  const allowlistPath = path.join(root, 'config', 'translatable-plugin-chrome.json')
  const marketplacePath = path.join(root, 'orca-marketplace.json')

  const [manifest, rawCatalog, english, allowlist, marketplace] = await Promise.all([
    readJson(manifestPath),
    fs.readFile(catalogPath, 'utf8'),
    readJson(englishPath),
    readJson(allowlistPath),
    readJson(marketplacePath)
  ])
  const catalog = JSON.parse(rawCatalog)
  const manifestErrors = validateManifest(manifest)
  const validation = validateCatalog({
    catalog,
    english,
    rawBytes: Buffer.byteLength(rawCatalog, 'utf8'),
    translatablePluginChrome: new Set(allowlist)
  })
  const errors = [...manifestErrors, ...validateMarketplace(marketplace, manifest), ...validation.errors]
  const stats = validation.stats

  console.log(`locale: zh-TW`)
  console.log(`translated leaves: ${stats.translatedLeaves}`)
  console.log(`upstream leaves: ${stats.upstreamLeaves}`)
  console.log(`coverage: ${stats.translatedLeaves}/${stats.upstreamLeaves}`)
  console.log(`entries: ${stats.entries}`)
  console.log(`max depth: ${stats.maxDepth}`)
  console.log(`bytes: ${stats.bytes}`)
  console.log(`errors: ${errors.length}`)
  if (errors.length > 0) {
    for (const error of errors) console.error(`- ${error}`)
    return 1
  }
  return 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main()
}
