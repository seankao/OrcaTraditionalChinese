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
| Plugin | 外掛 |
| Agent / Subagent | 代理程式／子代理程式 |
| Session | 工作階段 |
| Terminal | 終端機 |
| Repository / Repo | 儲存庫 |
| Workspace | 工作區 |
| Branch | 分支 |
| Issue | 議題 |
| Comment | 留言 |
| Pane / Panel | 窗格／面板 |
| Tab | 分頁 |
| Command | 指令（Command Prompt 為「命令提示字元」，command line 為「命令列」） |
| Context menu | 快顯選單 |
| Runtime | 執行階段 |
| Process | 行程 |
| Disconnect | 中斷連線 |
| New（建立動作） | 新增 |
| Reset | 重設 |
| Checkout / Sparse checkout | 簽出／稀疏簽出 |
| Preset | 預設組合 |
| Profile | 設定檔 |
| Configure | 設定 |
| Credential | 憑證 |
| Image | 圖片 |
| Screenshot | 截圖 |
| Idle | 閒置 |
| Click | 點選 |
| Rich (editor) | 富文字 |
| Hook | hook（保留英文） |

## 保留英文的開發術語

預設保留 `commit`、`pull request`、`worktree`、`diff`、`fork`、`hook`；英文術語與相鄰中文之間保留一個半形空格。`branch` 與 `workspace` 已全面改用「分支」「工作區」，不再保留英文。若介面空間或上下文需要改用中文，必須整份 catalog 統一。

## 品質規則

- OpenCC `s2twp` 結果只能當初稿。
- 中國用語必須改為台灣用語，例如「文件夾」→「資料夾」、「保存」→「儲存」、「默認」→「預設」。
- 未審核、來源已變更或語意不確定的 key 不進正式 catalog，讓 Orca 回退英文。
