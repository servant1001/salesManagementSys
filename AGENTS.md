# AGENTS.md

本文件用來保存 `salesManagementSys` 專案目前的 UI / UX 規範、資料架構、效能原則與後續接手注意事項，方便在不同電腦或不同工作階段中延續同一套設計與實作方向。

## 專案定位

`AURA` 的核心方向是：

- 讓商品管理、供應商管理、結帳作業、銷售紀錄維持同一套視覺語言
- 操作要快速、直覺、低學習成本
- 桌機與手機模式都要能完整使用，不依賴整頁滾動才能找到主要操作

建議描述語氣：

- 簡潔
- 專業
- 不要過度堆砌文案
- 介面重點應放在資訊層級與操作效率

## 目前資料架構

目前已採用以下架構：

- `Firebase Auth`：只負責登入驗證
- `Supabase`：作為主要業務資料來源
- 不再使用 `Firebase Realtime Database` 作為前台 CRUD 的正式資料來源

目前已搬移到 Supabase 的資料：

- `vendors`
- `products`
- `sales`

## 認證規則

前端會使用 Firebase 使用者的 ID Token 呼叫 Supabase。

必要條件：

- Firebase 使用者必須帶有 custom claim：`role=authenticated`
- Supabase 必須設定 Third-party Auth，並接受 Firebase JWT
- Supabase 的資料表權限以 `RLS` 控制

注意事項：

- `VITE_SUPABASE_PUBLISHABLE_KEY` 可放前端
- `SUPABASE_SECRET_KEY` 只能用於 migration script 或管理用途，不能暴露到前端程式
- 若 Supabase 回傳 `No suitable key or wrong key type`，優先檢查 JWT 驗證設定與 Firebase signing key 同步狀態

## 重要檔案

### 核心服務

- `src/supabase.ts`
- `src/services/vendors.ts`
- `src/services/products.ts`
- `src/services/sales.ts`

### 主要頁面

- `src/views/Login.vue`
- `src/views/Register.vue`
- `src/layouts/MainLayout.vue`
- `src/views/HomeView.vue`
- `src/views/Vendors.vue`
- `src/components/ProductList.vue`
- `src/components/Checkout.vue`
- `src/components/SalesRecord.vue`

### 樣式入口

- `src/assets/main.css`

### Supabase SQL / Migration

- `supabase/vendors_setup.sql`
- `supabase/products_setup.sql`
- `supabase/sales_setup.sql`
- `scripts/migrate-vendors-to-supabase.mjs`
- `scripts/migrate-products-to-supabase.mjs`
- `scripts/migrate-sales-to-supabase.mjs`

## 常用指令

```bash
npm run build
npm run migrate:vendors
npm run migrate:products
npm run migrate:sales
```

如需確認 Firebase 使用者 claim：

```bash
npm run list:firebase-users
npm run set:firebase-claim-all -- --dry-run
```

## UI / UX 設計方向

目前整體風格是：

- 深藍灰作為主視覺基底
- 暖金 / 琥珀色作為重點 CTA 與互動強調
- 卡片、表格、對話框維持一致圓角、邊框與陰影語言
- 資訊密度偏高，但必須保持清楚層級與留白

不建議的方向：

- 過亮、過飽和的螢光色
- 紫色主題
- 過多漸層與浮誇特效
- 手機模式下把重要操作藏太深

## 色彩系統

### 主色系

- `#091626`
- `#0d2037`
- `#10243c`
- `#112842`
- `#173255`
- `#183656`
- `#21456d`

### 強調色 / CTA

- `#b97837`
- `#be6825`
- `#cf9d6a`
- `#d6a46b`
- `#df9c45`
- `#f0c998`
- `#f4c87d`

### 背景 / 邊框 / 中性色

- `#ffffff`
- `#f3f7fc`
- `#f4f8fc`
- `#f5f7fb`
- `#f5f8fc`
- `#e4ebf3`
- `#d9e2ef`
- `#95a7bb`
- `#72859a`
- `#32465b`

### 功能色

- 成功：`#1d8f50`
- 成功亮色：`#67c23a`
- 危險：`#d94e4e`
- 危險深色：`#b63e3e`
- 資訊：`#2f6fa8`

## 按鈕設計規則

### Primary

用途：

- 頁面主操作
- 新增資料
- 主要提交
- Dialog 主要確認

建議 class：

- `checkout-primary-btn`

建議配色：

- 背景：`#112842`
- 邊框：`#183656`
- Hover：`#0e223a`
- 點綴：`#d6a46b`
- 文字：`#f7fbff`

### Success / Confirm CTA

用途：

- 確認結帳
- 開始掃描
- 重要完成動作

建議 class：

- `checkout-success-btn`
- `scanner-toggle-btn`

建議配色：

- 背景：`#be6825`
- 漸層或強調：`#df9c45`
- Hover：`#f4c87d`
- 陰影 / 點綴：`#b97837`
- 文字：`#10243c`

### Secondary

用途：

- 取消
- 返回
- 次要操作
- 匯入、開窗、切換類操作

建議 class：

- `checkout-secondary-btn`

建議配色：

- 背景：`#ffffff`
- Hover：`#f7fafc`
- 文字：`#10243c`
- 邊框：`rgba(20, 36, 58, 0.10)`
- Hover 邊框：`rgba(77, 131, 180, 0.28)`

### Row Action Buttons

用途：

- 編輯
- 儲存
- 刪除
- 明細操作

規則：

- 尺寸要緊湊
- 不可過寬
- 同一欄位內要維持一致高度與間距
- 若空間有限，優先垂直排列

建議 class：

- `checkout-row-btn`
- `checkout-row-btn--edit`
- `checkout-row-btn--delete`

### Disabled 狀態

規則：

- 不能沿用亮眼主色
- 要明顯降低可操作感
- Hover 不應再有明顯動態

建議配色：

- 背景：`#e7ecf1`
- 邊框：`#dbe2e9`
- 文字：`rgba(16, 36, 60, 0.48)`
- 陰影：`rgba(20, 36, 58, 0.10)`

## 版面原則

### Login / Register

- 同一套品牌視覺
- 不使用突兀背景圖
- 以乾淨背景、色塊、漸層或柔和裝飾為主
- 表單區塊需聚焦且清楚

### MainLayout

- 左側選單高度固定並自適應視窗
- 左側選單不可跟隨右側內容一起滾動
- 帳號資訊與底部功能按鈕要固定在可視區內
- 手機版展開選單時，避免被 `mobile-menu-btn` 擋住內容
- `.collapse-btn` 必須在最上層，不可被右側內容遮住

### 內容區

- 右側內容可滾動
- 頁面本身不要出現多層整頁滾動條
- 手機模式下要確保列表區可以實際向下滑動

### 表格

- 表格風格以 `ProductList` 為基準
- 表格容器高度應依視窗高度自適應
- 表格區本身提供捲動，而不是整頁捲動
- 深色模式下表頭、列背景、hover、邊框都要保有清楚對比
- 商品縮圖可點擊放大，並顯示小型「放大」提示標籤

## 元件細節規則

### 表單元件

- `el-input`、`el-select`、`el-date-editor`、`el-input-number` 高度需一致
- 手機模式下不可出現莫名的 `margin-left: 12px`
- 日期選擇器在手機版要和其他欄位對齊、同寬
- Focus ring 使用暖金色系，不要用預設藍色

### Dialog

- 標題不需要厚重底色
- 深色模式下標題文字仍需清楚可讀
- 商品圖片若出現在 Dialog 中，一樣支援點擊放大

### 圖表分析

- 使用 `echarts`
- 圖表要有層次感，但不能花俏到影響閱讀
- 深色模式下標題不要與背景融在一起
- 可使用：
  - 訂單量趨勢圖
  - 營收趨勢圖
  - 每小時累積訂單數量圖
  - 付款方式分布圖

## 效能原則

這個專案目前最重要的前端效能原則之一：

- 不要在每次新增、編輯、刪除後都整表重抓

正確做法：

- 初次進頁或切換篩選條件時再 full fetch
- 單筆新增 / 編輯 / 刪除後，優先更新本地 state
- 只在必要時才重新同步整份資料

目前已實作的本地更新方向：

### SalesRecord

- `upsertLocalSale`
- `removeLocalSale`

### 局部更新仍可保留的情況

- 編輯當前頁已載入的一筆資料，且排序 / 篩選條件不受影響時，可直接更新當前頁 state

避免以下寫法：

- 新增一筆資料後立刻 `await fetchProducts()`，但其實頁面不是後端分頁且可局部更新
- 更新一筆銷售紀錄後立刻重抓整天所有資料

## 2026-06 列表更新規範

以下規範是這次針對 `Vendors` 與 `ProductList` 列表做的正式更新，後續新頁面若有大量資料列表，優先沿用這套做法。

### 後端分頁

- 不要再以「先抓全部資料回前端，再用 computed 切頁」作為預設方案
- 列表頁應優先使用 Supabase 後端分頁
- 分頁查詢需至少支援：
  - `page`
  - `pageSize`
  - `keyword`
  - 對應的篩選條件，例如 `country`、`supplierCode`
  - 排序欄位與排序方向
- Supabase 查詢建議搭配：
  - `range(from, to)`
  - `count: "exact"`
  - 必要的 `eq / ilike / or / order`

### 已實作頁面

- `src/views/Vendors.vue`
  - 已改為後端分頁
  - 搜尋與地區篩選會重新向 Supabase 取當前頁資料
- `src/components/ProductList.vue`
  - 已改為後端分頁
  - 搜尋、廠商篩選、排序、頁碼切換都會重新向 Supabase 取資料

### Service 層規範

- `src/services/vendors.ts`
  - 使用 `fetchVendorsPage()`
- `src/services/products.ts`
  - 使用 `fetchProductsPage()`
- 若頁面有唯一值檢查需求，例如商品編號、GTIN，不可只檢查當前頁資料
- 唯一值檢查要改成走後端查詢，例如：
  - `checkProductCodeExists()`
  - `checkProductGtinExists()`
  - `findExistingProductsByCodesOrGtins()`

### 列表切頁動畫

- `Vendors` 與 `ProductList` 的換頁動畫已統一
- 不要使用 Element Plus 預設白色 `v-loading` 遮罩作為列表換頁效果
- 正式風格改為：
  - 表格本體淡出
  - 輕微下沉與縮放
  - 半透明深色玻璃感遮罩
  - 暖金色三點 loading 動畫
- 樣式命名可沿用：
  - `is-switching`
  - `table-loading-overlay`
  - `table-loading-panel`
  - `table-loading-dots`
  - `table-loading-dot`
  - `table-fade`

### 分頁按鈕風格

- `Vendors` 與 `ProductList` 的分頁按鈕樣式已統一
- 分頁元件 hover 要有輕微上浮效果
- 目前頁碼要使用暖金 / 琥珀色高亮
- 建議保留：
  - `transform: translateY(-1px)`
  - active 狀態暖金漸層
  - 柔和陰影，不要用過亮純色塊

### 列表互動原則

- 搜尋輸入建議加 debounce，避免每個 key stroke 都直接打 API
- 篩選條件改變時，頁碼應回到第 1 頁
- 每頁筆數改變時，頁碼應回到第 1 頁
- 若刪除資料後當前頁超出最大頁數，要自動修正頁碼

### CRUD 與分頁並存原則

- 新增資料後：
  - 若該列表使用後端分頁，通常應回到第 1 頁後重新抓資料
- 編輯資料後：
  - 若該筆資料仍在目前頁，可以局部更新當前頁 state
  - 若不確定排序或篩選是否受影響，可重新抓目前頁資料
- 刪除資料後：
  - 重新抓目前頁資料
  - 必要時修正頁碼

### 後續新增大型列表頁建議

若未來還要新增其他大型列表頁，例如：

- 銷售紀錄
- 結帳紀錄
- 其他報表頁

預設優先採用：

1. Supabase 後端分頁
2. 後端搜尋 / 篩選
3. 統一的玻璃感換頁動畫
4. 統一的暖金色分頁按鈕樣式

## 開發原則

- 優先維持同一套視覺語言，不要每頁都長得像不同產品
- 調整 UI 時要同時檢查桌機與手機模式
- 若修改 `Element Plus` 樣式，注意預設 margin、padding、寬度與斷點行為
- 所有新功能若會影響主要 CRUD，優先考慮效能與操作回饋
- 若新增資料表或搬移資料，先補 SQL、RLS、service 層，再改頁面

## 測試與驗證

每次做完以下類型修改後，建議至少執行一次：

```bash
npm run build
```

需要特別驗證的項目：

- 登入 / 註冊頁桌機與手機版
- 左側選單收合、展開、手機版覆蓋層
- `Vendors` / `ProductList` / `Checkout` / `SalesRecord` 表格高度與捲動
- 新增、編輯、刪除後列表是否立即更新
- 後端分頁是否正確只抓當前頁資料
- 搜尋、篩選、排序切換後頁碼與資料是否正確
- 切頁動畫與分頁按鈕風格是否一致
- Supabase RLS 是否允許 authenticated 使用者正常讀寫

## 後續接手建議

若後續還要繼續擴充功能，建議優先遵守這個順序：

1. 先確認資料來源是否已經完全改成 Supabase
2. 先寫 service 層，再改 Vue 頁面
3. 先維持現有設計語言，再補新頁面視覺
4. 先確認是否應採後端分頁，再決定是否局部更新 state
5. 完成後跑 `npm run build`

這份文件應視為目前專案的 UI / UX、列表策略與資料架構基準版本，後續若按鈕、色彩、資料流、分頁策略或列表動畫再有調整，請同步更新本檔。


## 2026-06 Dialog 按鈕風格補充

### 新增商品 / 批量新增 Dialog

這兩個視窗的按鈕不只共用尺寸，也要共用清楚的色彩層級：

- 主提交按鈕：深藍底搭配金色光感點綴，代表主要確認操作。
- 次要取消按鈕：淺色玻璃感底色，維持低干擾但仍有明確邊界。
- 掃描按鈕：暖橘色系，用來提示需要注意或互動的輔助操作。
- 同步按鈕：冷灰藍色系，比主按鈕更輕，但要比一般文字按鈕更有可點擊感。
- 清空 / 刪除按鈕：磚紅到深紅色系，明確表示危險操作。

### 色彩與用途

- 主提交按鈕：`#13314f`、`#1b4469`、點綴 `#d6a46b`
- 掃描按鈕：`#bf6e2f`、`#dd9645`、高光 `#f1c778`
- 同步按鈕：`#fafdff`、`#ecf3fa`、文字 `#21415f`
- 危險按鈕：`#b94a46`、`#a53f3c`、hover 邊框 `#e08076`
- 次要取消按鈕：`#ffffff`、`#f3f7fb`、文字 `#18324d`

### 互動規則

- Dialog footer 按鈕維持較大的圓角與陰影，讓送出區和表單內容有明顯分層。
- 行內小按鈕與同步按鈕可比 footer 略小，但不可退化成無層級的預設 Element Plus 樣式。
- 手機模式下 footer 與工具列按鈕需要可並排撐開，避免擠成不平衡的短按鈕。
