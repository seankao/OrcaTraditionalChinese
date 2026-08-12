# 更新流程

1. 確認新 Orca release tag。
2. 執行 `npm run sync -- --ref <tag>`。
3. 執行 `npm run draft` 產生未審初稿。
4. 審查 `work/zh-TW.todo.json`、`work/changed-source.json`、`work/removed-keys.json`。若待審的 changed-source key 後來被上游刪除，同步器會把原人工譯文移至 `removed-keys.json`，並清除該 changed-source 記錄。尚未處理的 removed 記錄也會跨同步保留；若上游恢復該 key，舊 removed 記錄會清除，該 key 重新進入一般翻譯流程。
5. 把已審翻譯人工合併至 `locales/zh-TW.json`。其中 `changed-source.json` 的項目不會保留在正式 catalog；若要重新加入，必須依新版英文重新審查與翻譯。再次執行同步時，尚未處理的 `changed-source.json` 記錄會保留，不會遺失舊人工譯文。
6. 執行 `npm test && npm run validate`。
7. 提高 `orca-plugin.json` 與 `package.json` 版本。
8. Commit、建立 tag，再於 Orca 更新 Language Pack。

禁止直接修改 Orca 安裝目錄或內建 `zh.json`。
