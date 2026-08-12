import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'

import { reconcileCatalog } from './sync-utils.mjs'

const REPOSITORY = 'stablyai/orca'
const ENGLISH_PATH = 'src/renderer/src/i18n/locales/en.json'
const SIMPLIFIED_PATH = 'src/renderer/src/i18n/locales/zh.json'
const ALLOWLIST_PATH = 'src/shared/plugins/plugin-translatable-chrome.ts'

function parseRef(argv) {
  const index = argv.indexOf('--ref')
  if (index === -1 || !argv[index + 1]) {
    throw new Error('Usage: npm run sync -- --ref <Orca tag or commit>')
  }
  return argv[index + 1]
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'OrcaTraditionalChinese' } })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return response.text()
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url))
}

async function readJsonIfPresent(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback
    throw error
  }
}

function extractTranslatablePluginChrome(source) {
  const start = source.indexOf('const TRANSLATABLE_PLUGIN_CHROME')
  const end = source.indexOf('])', start)
  if (start === -1 || end === -1) throw new Error('Could not locate Plugin chrome allowlist')
  return [...source.slice(start, end).matchAll(/'([^']+)'/g)].map((match) => match[1]).sort()
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

export async function writeJsonTransaction(entries, { failAfterReplace } = {}) {
  const token = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const files = entries.map(([filePath, value]) => ({
    filePath,
    value,
    tempPath: `${filePath}.${token}.tmp`,
    backupPath: `${filePath}.${token}.bak`,
    hadOriginal: false,
    backedUp: false,
    replaced: false
  }))

  try {
    for (const file of files) {
      await fs.mkdir(path.dirname(file.filePath), { recursive: true })
      const content = `${JSON.stringify(file.value, null, 2)}\n`
      JSON.parse(content)
      await fs.writeFile(file.tempPath, content, 'utf8')
      file.hadOriginal = await pathExists(file.filePath)
    }

    let replacements = 0
    for (const file of files) {
      if (file.hadOriginal) {
        await fs.rename(file.filePath, file.backupPath)
        file.backedUp = true
      }
      await fs.rename(file.tempPath, file.filePath)
      file.replaced = true
      replacements += 1
      if (failAfterReplace === replacements) throw new Error('simulated transaction failure')
    }
  } catch (error) {
    for (const file of [...files].reverse()) {
      if (file.replaced) await fs.rm(file.filePath, { force: true })
      if (file.backedUp && await pathExists(file.backupPath)) {
        await fs.rename(file.backupPath, file.filePath)
      }
      await fs.rm(file.tempPath, { force: true })
    }
    throw error
  }

  await Promise.allSettled(
    files.filter((file) => file.backedUp).map((file) => fs.rm(file.backupPath, { force: true }))
  )
}

export async function main(root = process.cwd(), argv = process.argv.slice(2)) {
  const ref = parseRef(argv)
  const encodedRef = encodeURIComponent(ref)
  const commit = await fetchJson(`https://api.github.com/repos/${REPOSITORY}/commits/${encodedRef}`)
  const resolvedCommit = commit.sha
  const rawBase = `https://raw.githubusercontent.com/${REPOSITORY}/${resolvedCommit}`
  const [nextEnglish, simplified, allowlistSource] = await Promise.all([
    fetchJson(`${rawBase}/${ENGLISH_PATH}`),
    fetchJson(`${rawBase}/${SIMPLIFIED_PATH}`),
    fetchText(`${rawBase}/${ALLOWLIST_PATH}`)
  ])
  const allowlist = extractTranslatablePluginChrome(allowlistSource)
  const previousEnglish = await readJsonIfPresent(path.join(root, 'upstream', 'en.json'), {})
  const currentCatalog = await readJsonIfPresent(path.join(root, 'locales', 'zh-TW.json'), {})
  const previousChangedSource = await readJsonIfPresent(
    path.join(root, 'work', 'changed-source.json'),
    {}
  )
  const previousRemovedKeys = await readJsonIfPresent(
    path.join(root, 'work', 'removed-keys.json'),
    {}
  )
  const result = reconcileCatalog({
    previousEnglish,
    nextEnglish,
    currentCatalog,
    simplified,
    translatablePluginChrome: new Set(allowlist),
    previousChangedSource,
    previousRemovedKeys
  })

  await writeJsonTransaction([
    [path.join(root, 'locales', 'zh-TW.json'), result.catalog],
    [path.join(root, 'upstream', 'en.json'), nextEnglish],
    [path.join(root, 'upstream', 'source.json'), {
      repository: REPOSITORY,
      ref,
      commit: resolvedCommit,
      commitDate: commit.commit?.committer?.date ?? null,
      englishCatalog: ENGLISH_PATH,
      simplifiedCatalog: SIMPLIFIED_PATH
    }],
    [path.join(root, 'config', 'translatable-plugin-chrome.json'), allowlist],
    [path.join(root, 'work', 'zh-TW.todo.json'), result.todo],
    [path.join(root, 'work', 'changed-source.json'), result.changedSource],
    [path.join(root, 'work', 'removed-keys.json'), result.removedKeys],
    [path.join(root, 'work', 'protected-keys.json'), result.protectedKeys]
  ])

  console.log(`Synced Orca ${ref} (${resolvedCommit})`)
  console.log(`Retained translations: ${countLeaves(result.catalog)}`)
  console.log(`New or missing: ${Object.keys(result.todo).length}`)
  console.log(`Changed source: ${Object.keys(result.changedSource).length}`)
  console.log(`Removed: ${Object.keys(result.removedKeys).length}`)
  console.log(`Protected: ${result.protectedKeys.length}`)
  return 0
}

function countLeaves(value) {
  if (typeof value === 'string') return 1
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  return Object.values(value).reduce((total, child) => total + countLeaves(child), 0)
}

export function isDirectExecution(moduleUrl, argvPath) {
  return Boolean(argvPath) && moduleUrl === pathToFileURL(argvPath).href
}

if (isDirectExecution(import.meta.url, process.argv[1])) {
  process.exitCode = await main()
}
