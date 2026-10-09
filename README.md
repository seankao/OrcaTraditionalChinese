# Orca 繁體中文語言包

> 非官方第三方 Language Pack，與 Stably／Lovecast Inc. 無隸屬或背書關係。

這是獨立於 Orca 安裝目錄的純資料型繁體中文（台灣）Language Pack，不含可執行 Plugin worker，也不要求任何 capability。缺少或尚待審查的翻譯會安全回退英文。

## 安裝

需要 Orca `1.4.223` 或更新版本。

### Git URL（建議）

1. 開啟 Orca → Settings → Plugins → Install plugin。
2. 選擇 Git URL，貼上固定版本網址：

   ```text
   https://github.com/seankao/OrcaTraditionalChinese.git#v0.4.0
   ```

3. 安裝後找到「繁體中文」，選擇 Review & enable。
4. 確認審查畫面顯示 Declarative、沒有 background worker，且沒有 Orca API capability，再啟用外掛。
5. 開啟 Settings → Appearance → Language，選擇：

   ```text
   zh-TW — seankao.zh-tw
   ```

Orca 不會因作業系統是繁體中文就自動選取外部語言包，首次安裝仍須手動選擇一次。安裝網址固定在不可移動的 `v0.4.0` tag，不建議直接追蹤可變動的 `main`。

### Release ZIP／Local folder 備援

若目前 Orca 版本無法使用 Git URL：

1. 從 [GitHub Releases](https://github.com/seankao/OrcaTraditionalChinese/releases) 下載固定版本 ZIP 並解壓縮。
2. Orca → Settings → Plugins → Install plugin → Local folder。
3. 選擇直接包含 `orca-plugin.json` 的解壓後根目錄，不要選擇 `locales` 子資料夾。
4. 依上述流程審查、啟用，並在 Appearance → Language 手動選取 `zh-TW — seankao.zh-tw`。

> 一般使用者不需加入 Development Plugin Path。同一個 `seankao.zh-tw` 不應同時由正式安裝與 Development Path 載入；Development Path 會優先於正式安裝，造成測試結果不代表已安裝版本。

## 從 v0.1.x 升級

`v0.2.0` 起外掛身分由 `local-seank.orca-traditional-chinese` 改為 `seankao.zh-tw`。Orca 會視為新的外掛；升級時需停用舊外掛、審查並啟用新外掛，再重新選取一次語言。舊 `v0.1.x` tags 保留原身分，不會改寫。

## 從 v0.2.0 升級

`v0.3.0` 保持相同外掛身分 `seankao.zh-tw`，並將翻譯基準更新至 Orca `v1.4.188`。請以新的固定 tag Git URL 重新安裝；若 Orca 要求重新審查，完成 Review & enable 後確認語言仍為 `zh-TW — seankao.zh-tw`。

## 從 v0.3.0 升級

`v0.4.0` 保持相同外掛身分 `seankao.zh-tw`，將翻譯基準更新至 Orca `v1.4.223`，並把 `engines.orca` 提高為 `>=1.4.223`：部分 key 在新版 Orca 改了英文語意，舊版 Orca 不應套用新版譯文。仍在使用舊版 Orca 時，請繼續使用 `v0.3.0`。升級方式與上一節相同：以新的固定 tag Git URL 重新安裝，完成 Review & enable 後確認語言仍為 `zh-TW — seankao.zh-tw`。

## 已知問題

- Orca `v1.4.223` 在任何外掛語言包啟用時，開啟 Tasks 的 GitHub Project roadmap 檢視可能會出錯。原因在 Orca 本身以外掛語言代碼格式化日期，修正見上游 PR [stablyai/orca#26860](https://github.com/stablyai/orca/pull/26860)（尚未合併）。需要使用 roadmap 時，請暫時切回 English。
- 少數上游字串無法由外掛語言包提供，會維持英文：Plugin 安全審查相關文案（Orca 保護範圍），以及超過 8192 字元或 key 含 `.` 的字串。清單見 `work/protected-keys.json` 與 `work/excluded-keys.json`。

## 授權與第三方來源

本專案依 MIT License 發布。初始繁中譯文衍生自 MIT 授權的 [`farrrr/orca-i18n-zh-tw`](https://github.com/farrrr/orca-i18n-zh-tw)，並使用 MIT 授權的 Orca 上游英文 catalog 作為同步基準。發布內容保留原著作權及授權聲明；完整來源與用途請見 [`LICENSE`](LICENSE) 及 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。

「Orca」僅用於描述相容產品及用途。本專案不使用 Orca 官方 logo，也不宣稱由 Stably／Lovecast Inc. 官方發行、認可或背書。

## 開發環境需求

以下需求只適用於維護翻譯，不是一般使用者安裝語言包的必要條件：

- Node.js 22 或相容版本
- Python 3.11 或相容版本
- Python 套件 `opencc-python-reimplemented`（只在產生未審初稿時需要；可執行 `python -m pip install -r requirements.txt` 安裝）

## 本機開發載入

1. Orca → Settings → Plugins → Development。
2. 加入本版本庫完整路徑。
3. 審查並啟用 `seankao.zh-tw`。
4. Settings → Appearance → Language 選擇 `zh-TW — seankao.zh-tw`。

## 驗證

```bash
npm test
npm run validate
```

## 同步指定 Orca release

```bash
npm run sync -- --ref v1.4.223
npm run draft
npm run validate
```

`draft` 只讀取 `work/zh-TW.todo.json`，並產生或更新 `work/zh-TW.drafts.json`；不會自動覆寫正式 catalog。
