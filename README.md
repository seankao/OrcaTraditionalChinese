# Orca 繁體中文語言包

這是獨立於 Orca 安裝目錄的資料型 Language Pack，不含可執行 Plugin worker，也不要求任何 capability。

## 環境需求

- Node.js 22 或相容版本
- Python 3.11 或相容版本
- Python 套件 `opencc-python-reimplemented`（只在產生未審初稿時需要；可執行 `python -m pip install -r requirements.txt` 安裝）

## 本機開發載入

1. Orca → Settings → Plugins → Development。
2. 加入本版本庫完整路徑。
3. 審查並啟用 `seankao.zh-tw`。
4. Settings → Appearance → Language 選擇 `zh-TW — seankao.zh-tw`。

> `v0.2.0` 起外掛身分由 `local-seank.orca-traditional-chinese` 改為 `seankao.zh-tw`。Orca 會視為新的外掛；升級時需停用舊外掛、重新啟用新外掛並重新選取一次語言。舊 `v0.1.x` tags 保留原身分，不會改寫。

## 驗證

```bash
npm test
npm run validate
```

## 同步指定 Orca release

```bash
npm run sync -- --ref v1.4.180
npm run draft
npm run validate
```

`draft` 只讀取 `work/zh-TW.todo.json`，並產生或更新 `work/zh-TW.drafts.json`；不會自動覆寫正式 catalog。
