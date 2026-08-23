# 第三方來源與授權聲明

本專案是 [Orca](https://github.com/stablyai/orca) 的第三方繁體中文（台灣）Language Pack，與 Stably／Lovecast Inc. 無隸屬關係，亦非官方發行。

## Orca 上游

- 專案：[`stablyai/orca`](https://github.com/stablyai/orca)
- 授權：MIT
- 著作權：Copyright © 2026 Lovecast Inc.
- 本版本同步基準：`v1.4.188`，commit `f32ce859047a85a3ea4f507f633604dfbf596a0e`
- 取用內容：
  - `src/renderer/src/i18n/locales/en.json`：英文來源與 key 基準
  - `src/renderer/src/i18n/locales/zh.json`：只用於產生未審 OpenCC 初稿
  - Plugin Language Pack allowlist：用於排除平台保護的安全文案

## 初始繁體中文譯本

- 專案：[`farrrr/orca-i18n-zh-tw`](https://github.com/farrrr/orca-i18n-zh-tw)
- 初始基準 commit：`2c6001621bbd8762b0ff8c9db24cd998382d9ad3`
- 授權：MIT
- 著作權：Copyright © 2026 Far Tseng

本專案的初始 `locales/zh-TW.json` 由上述社群譯本衍生，之後再透過本版本庫的同步、驗證及人工審查流程維護。`LICENSE` 保留 Far Tseng 與 Orca／Lovecast Inc. 的 MIT 授權及著作權聲明。

## OpenCC 工具

- 套件：[`opencc-python-reimplemented`](https://github.com/yichen0831/opencc-python)
- 鎖定版本：`0.1.7`
- 授權：Apache License 2.0
- 用途：只在本機將簡中參考文字轉成未審初稿；套件程式碼不包含於 Language Pack 發布內容。

## 更新與初稿規則

1. 英文 `en.json` 是判斷 key、新增文案及來源變更的唯一上游基準。
2. 已存在且英文來源未變更的人工繁中翻譯會保留。
3. 新增或缺少的 key 會列入 `work/zh-TW.todo.json`。
4. 英文來源變更的 key 會移出正式 catalog，列入 `work/changed-source.json` 等待重新審查。
5. OpenCC `s2twp` 只產生 `work/zh-TW.drafts.json` 的未審初稿，不會直接寫入正式 catalog。
6. Orca 平台保護的 Plugin 安全文案不納入語言包，會回退英文。
