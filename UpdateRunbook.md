# 更新流程

1. 確認新 Orca release tag。
2. 執行 `npm run sync -- --ref <tag>`。
3. 執行 `npm run draft` 產生未審初稿。
4. 審查 `work/zh-TW.todo.json`、`work/changed-source.json`、`work/removed-keys.json` 與 `work/excluded-keys.json`。`excluded-keys.json` 記錄因 Language Pack artifact 限制而無法納入的上游字串，這些 key 必須回退內建英文。若待審的 changed-source key 後來被上游刪除，同步器會把原人工譯文移至 `removed-keys.json`，並清除該 changed-source 記錄。尚未處理的 removed 記錄也會跨同步保留；若上游恢復該 key，舊 removed 記錄會清除，該 key 重新進入一般翻譯流程。
5. 把已審翻譯人工合併至 `locales/zh-TW.json`。其中 `changed-source.json` 的項目不會保留在正式 catalog；若要重新加入，必須依新版英文重新審查與翻譯。再次執行同步時，尚未處理的 `changed-source.json` 記錄會保留，不會遺失舊人工譯文。
6. 執行 `npm test && npm run validate`。
7. 提高 `orca-plugin.json` 與 `package.json` 版本，並把 `orca-marketplace.json` 的 `source.ref` 改成新 tag（`v<版本>`；`npm run validate` 會檢查兩者一致）。若存在 changed-source 或新版功能專用 key，同時評估並更新 `engines.orca`，避免舊版 Orca 對相同 key 套用新版語意譯文。
8. Commit，建立不可移動的 annotated tag。
9. 先推送 tag，再推送 `main`。Marketplace 從 `main` 讀取 `orca-marketplace.json`；若 `main` 先上線，使用者檢查更新時會指向尚不存在的 tag：

   ```bash
   git push origin <tag>
   git push origin main
   ```

10. 建立 GitHub Release，確認 `LICENSE`、`THIRD_PARTY_NOTICES.md` 與 README 的非官方聲明仍包含在發布來源中。
11. 以固定 tag Git URL 進行乾淨安裝驗證：

    ```text
    https://github.com/seankao/OrcaTraditionalChinese.git#<tag>
    ```

    若有以 Marketplace 安裝的環境，在市集畫面「重新整理」後選擇 Check for update，確認預覽顯示新版本。

12. 正式安裝驗證前，先移除同一 `seankao.zh-tw` 的 Development Plugin Path，避免開發來源覆蓋正式安裝版本。
13. 完成 Review & enable，於 Appearance → Language 選取 `zh-TW — seankao.zh-tw`，再讀回持久化語言值並確認介面實際顯示繁體中文。

禁止移動或覆寫既有 tags，也禁止直接修改 Orca 安裝目錄或內建 `zh.json`。
