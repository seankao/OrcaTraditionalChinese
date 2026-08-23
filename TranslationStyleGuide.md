# Orca zh-TW 翻譯規範

## 語系與語氣

- 使用正體中文與台灣常用詞。
- UI 文案簡潔、直接；維持英文原意，不增加承諾或安全性描述。
- 品牌、CLI、檔名、路徑、快捷鍵、程式碼 literal 不翻譯。
- `{...}` 與 `{{...}}` 插值參數必須逐字保留。

## 核心術語

| English | zh-TW |
|---|---|
| Settings | 設定 |
| File | 檔案 |
| Folder | 資料夾 |
| Clipboard | 剪貼簿 |
| Connection | 連線 |
| Server | 伺服器 |
| Application / App | 應用程式 |
| Thread | 執行緒 |
| Dependency | 相依套件 |
| Reload | 重新載入 |
| Save | 儲存 |
| Delete | 刪除 |
| Remove | 移除 |
| Account | 帳戶 |
| Artifact / Artifacts | 成品 |
| Publish | 發布 |
| Share / Shared | 分享／已分享（依上下文） |

## 保留英文的開發術語

預設保留 `branch`、`commit`、`pull request`、`worktree`、`workspace`；英文術語與相鄰中文之間保留一個半形空格。若介面空間或上下文需要中文，必須整個 namespace 統一。

## 品質規則

- OpenCC `s2twp` 結果只能當初稿。
- 中國用語必須改為台灣用語，例如「文件夾」→「資料夾」、「保存」→「儲存」、「默認」→「預設」。
- 未審核、來源已變更或語意不確定的 key 不進正式 catalog，讓 Orca 回退英文。
