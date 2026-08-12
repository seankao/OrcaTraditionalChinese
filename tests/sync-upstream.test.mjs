import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { reconcileCatalog } from '../scripts/sync-utils.mjs'
import {
  isDirectExecution,
  writeJsonTransaction
} from '../scripts/sync-upstream.mjs'

test('detects direct execution for a Windows script path', () => {
  assert.equal(
    isDirectExecution('file:///E:/Work/OrcaTraditionalChinese/scripts/sync-upstream.mjs', 'E:\\Work\\OrcaTraditionalChinese\\scripts\\sync-upstream.mjs'),
    true
  )
})

test('rolls back every file when a sync transaction fails', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'orca-zh-tw-sync-'))
  const first = path.join(root, 'first.json')
  const second = path.join(root, 'second.json')
  await fs.writeFile(first, '{"old":1}\n', 'utf8')
  await fs.writeFile(second, '{"old":2}\n', 'utf8')

  await assert.rejects(
    writeJsonTransaction(
      [
        [first, { next: 1 }],
        [second, { next: 2 }]
      ],
      { failAfterReplace: 1 }
    ),
    /simulated transaction failure/
  )

  assert.equal(await fs.readFile(first, 'utf8'), '{"old":1}\n')
  assert.equal(await fs.readFile(second, 'utf8'), '{"old":2}\n')
  await fs.rm(root, { recursive: true, force: true })
})

test('rejects unsafe catalog keys before rebuilding nested objects', () => {
  const nextEnglish = JSON.parse('{"__proto__":"malicious"}')

  assert.throws(
    () => reconcileCatalog({ nextEnglish }),
    /unsafe catalog key: __proto__/
  )
})

test('retains changed-source review data across repeated syncs', () => {
  const first = reconcileCatalog({
    previousEnglish: { prompt: 'Old prompt' },
    nextEnglish: { prompt: 'New prompt' },
    currentCatalog: { prompt: '人工舊翻譯' }
  })
  const second = reconcileCatalog({
    previousEnglish: { prompt: 'New prompt' },
    nextEnglish: { prompt: 'New prompt' },
    currentCatalog: first.catalog,
    previousChangedSource: first.changedSource
  })

  assert.deepEqual(second.changedSource, first.changedSource)
  assert.deepEqual(second.todo, {})
})

test('retains the original manual translation across consecutive source changes', () => {
  const first = reconcileCatalog({
    previousEnglish: { prompt: 'Version A' },
    nextEnglish: { prompt: 'Version B' },
    currentCatalog: { prompt: '人工原譯文' }
  })
  const second = reconcileCatalog({
    previousEnglish: { prompt: 'Version B' },
    nextEnglish: { prompt: 'Version C' },
    currentCatalog: first.catalog,
    previousChangedSource: first.changedSource
  })
  const third = reconcileCatalog({
    previousEnglish: { prompt: 'Version C' },
    nextEnglish: { prompt: 'Version D' },
    currentCatalog: second.catalog,
    previousChangedSource: second.changedSource
  })
  const reviewed = reconcileCatalog({
    previousEnglish: { prompt: 'Version D' },
    nextEnglish: { prompt: 'Version D' },
    currentCatalog: { prompt: '人工新版譯文' },
    previousChangedSource: third.changedSource
  })

  assert.equal(third.changedSource.prompt.translation, '人工原譯文')
  assert.equal(third.changedSource.prompt.previousEnglish, 'Version A')
  assert.equal(third.changedSource.prompt.english, 'Version D')
  assert.deepEqual(reviewed.changedSource, {})
  assert.deepEqual(reviewed.catalog, { prompt: '人工新版譯文' })
})

test('sync retains unchanged translations and separates new changed removed and protected keys', () => {
  const previousEnglish = {
    common: { save: 'Save', cancel: 'Cancel', old: 'Old' },
    auto: { components: { settings: { PluginConsentDialog: { title: 'Review plugin' } } } }
  }
  const nextEnglish = {
    common: { save: 'Save', cancel: 'Cancel now', added: 'Added' },
    auto: { components: { settings: { PluginConsentDialog: { title: 'Review plugin' } } } }
  }
  const currentCatalog = {
    common: { save: '儲存', cancel: '取消', old: '舊項目' },
    auto: { components: { settings: { PluginConsentDialog: { title: '審查外掛程式' } } } }
  }
  const simplified = { common: { save: '保存', cancel: '立即取消', added: '已添加' } }

  const result = reconcileCatalog({ previousEnglish, nextEnglish, currentCatalog, simplified })

  assert.deepEqual(result.catalog, { common: { save: '儲存' } })
  assert.deepEqual(result.todo, {
    'common.added': { english: 'Added', simplified: '已添加', reason: 'new' }
  })
  assert.deepEqual(result.changedSource, {
    'common.cancel': {
      previousEnglish: 'Cancel',
      english: 'Cancel now',
      translation: '取消',
      simplified: '立即取消'
    }
  })
  assert.deepEqual(result.removedKeys, {
    'common.old': { previousEnglish: 'Old', translation: '舊項目' }
  })
  assert.deepEqual(result.protectedKeys, [
    'auto.components.settings.PluginConsentDialog.title'
  ])
})
