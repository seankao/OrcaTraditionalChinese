import test from 'node:test'
import assert from 'node:assert/strict'

import {
  interpolationTokens,
  validateCatalog,
  validateManifest
} from '../scripts/catalog-utils.mjs'

test('accepts a nested string catalog with matching source keys', () => {
  const english = { settings: { title: 'Settings' }, common: { save: 'Save' } }
  const catalog = { settings: { title: '設定' }, common: { save: '儲存' } }

  const result = validateCatalog({ catalog, english })

  assert.deepEqual(result.errors, [])
  assert.equal(result.stats.translatedLeaves, 2)
})

test('rejects non-string catalog leaves', () => {
  const english = { settings: { title: 'Settings' } }
  const invalidValues = [null, 1, true, ['設定']]

  for (const value of invalidValues) {
    const result = validateCatalog({ catalog: { settings: { title: value } }, english })
    assert.ok(result.errors.some((error) => error.includes('must be a string or object')))
  }
})

test('rejects translations with changed interpolation placeholders', () => {
  const english = {
    common: {
      greeting: 'Hello {{name}}, item {{count}}',
      attachment: 'Attach {count} files from {source}'
    }
  }
  const catalog = {
    common: {
      greeting: '你好 {{user}}，項目 {{count}}',
      attachment: '從 {origin} 附加 {count} 個檔案'
    }
  }

  const result = validateCatalog({ catalog, english })

  assert.ok(result.errors.some((error) => error.includes('placeholder mismatch: common.greeting')))
  assert.ok(result.errors.some((error) => error.includes('placeholder mismatch: common.attachment')))
})

test('does not treat CSS declaration blocks as placeholders', () => {
  assert.deepEqual(interpolationTokens('button { color: red; opacity: 1; }'), [])
  assert.deepEqual(interpolationTokens('Attach {count} files'), ['{count}'])
})

test('rejects unsafe catalog keys', () => {
  const english = { settings: { title: 'Settings' } }
  const catalogs = [
    { 'settings.title': '設定' },
    { '': '設定' },
    JSON.parse('{"__proto__":"設定"}'),
    { constructor: '設定' }
  ]

  for (const catalog of catalogs) {
    const result = validateCatalog({ catalog, english })
    assert.ok(result.errors.some((error) => error.includes('unsafe catalog key')))
  }
})

test('enforces depth, entry, string, and byte limits', () => {
  const english = { a: { b: 'English' }, c: 'English' }
  const catalog = { a: { b: '繁體中文' }, c: '繁體中文' }
  const result = validateCatalog({
    catalog,
    english,
    rawBytes: 50,
    limits: { maxDepth: 0, maxEntries: 1, maxStringLength: 2, maxBytes: 10 }
  })

  assert.ok(result.errors.some((error) => error.includes('catalog exceeds depth 0')))
  assert.ok(result.errors.some((error) => error.includes('catalog exceeds 1 entries')))
  assert.ok(result.errors.some((error) => error.includes('exceeds 2 characters')))
  assert.ok(result.errors.some((error) => error.includes('catalog exceeds 10 bytes')))
})

test('blocks protected plugin security copy except exact allowlisted chrome', () => {
  const english = {
    auto: { components: { settings: {
      PluginsSettingsSection: { title: 'Plugins' },
      PluginConsentDialog: { disclaimer: 'Review this plugin before enabling it.' }
    } } }
  }
  const catalog = {
    auto: { components: { settings: {
      PluginsSettingsSection: { title: '外掛程式' },
      PluginConsentDialog: { disclaimer: '請先審查此外掛程式。' }
    } } }
  }
  const translatablePluginChrome = new Set([
    'auto.components.settings.PluginsSettingsSection.title'
  ])

  const result = validateCatalog({ catalog, english, translatablePluginChrome })

  assert.ok(result.errors.some((error) => error.includes('protected security copy at auto.components.settings.PluginConsentDialog.disclaimer')))
  assert.ok(!result.errors.some((error) => error.includes('PluginsSettingsSection.title')))
})

test('validates the data-only zh-TW plugin manifest contract', () => {
  const valid = {
    manifestVersion: 1,
    id: 'orca-traditional-chinese',
    publisher: 'local-seank',
    version: '0.1.0',
    pluginApi: 1,
    contributes: { languagePacks: [{ locale: 'zh-TW', path: 'locales/zh-TW.json' }] },
    capabilities: []
  }
  assert.deepEqual(validateManifest(valid), [])

  const invalid = structuredClone(valid)
  invalid.contributes.languagePacks[0].locale = 'zh'
  invalid.capabilities = [{ kind: 'network' }]
  invalid.main = 'main.mjs'
  invalid.worker = 'worker.mjs'
  const errors = validateManifest(invalid)
  assert.ok(errors.some((error) => error.includes('locale must be zh-TW')))
  assert.ok(errors.some((error) => error.includes('capabilities must be empty')))
  assert.ok(errors.some((error) => error.includes('must not declare main')))
  assert.ok(errors.some((error) => error.includes('must not declare worker')))
})
