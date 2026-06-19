# Sales Management System

`Sales Management System` 是一套以 `Vue 3 + Vite + TypeScript + Element Plus` 建置的銷售管理系統，整合了商品管理、供應商管理、結帳作業與銷售紀錄查詢。專案目前採用 `Firebase Auth + Supabase` 架構，登入驗證與業務資料已分流，方便後續擴充權限與資料治理。

## 專案特色

- 統一的 AURA 風格 UI / UX
- 支援桌機與手機版操作
- 商品列表、供應商列表、結帳列表與銷售紀錄皆維持一致視覺語言
- 支援商品圖片預覽放大
- 支援條碼掃描與結帳流程
- 支援銷售分析圖表
- 主要資料已改用 Supabase 管理

## 目前技術架構

### 前端

- `Vue 3`
- `TypeScript`
- `Vite`
- `Vue Router`
- `Pinia`
- `Element Plus`
- `ECharts`

### 驗證與資料層

- `Firebase Authentication`
- `Supabase`
- `Firebase Analytics`

### 其他套件

- `@supabase/supabase-js`
- `@zxing/browser`
- `@zxing/library`
- `html5-qrcode`
- `jsbarcode`
- `axios`

## 資料來源現況

目前正式資料來源如下：

- `Firebase Auth`：登入、使用者驗證
- `Supabase`：`vendors`、`products`、`sales`

目前前台主要 CRUD 已不再依賴 `Firebase Realtime Database`。

## 已搬移到 Supabase 的模組

- 供應商管理 `vendors`
- 商品列表 `products`
- 銷售紀錄 `sales`

## 認證方式

本專案保留 Firebase 登入，並透過 Firebase ID Token 讓 Supabase 以 authenticated 身分執行請求。

必要條件：

- Firebase 使用者需具備 custom claim：`role=authenticated`
- Supabase 需啟用 Third-party Auth 並接受 Firebase JWT
- Supabase 資料表需配置 RLS

如果遇到以下錯誤：

```text
No suitable key or wrong key type
```

請優先檢查：

- Supabase 的 Firebase JWT 驗證設定
- Firebase claim 是否已寫入
- 使用者是否已重新登入取得新 token

## 主要功能

### 1. 登入 / 註冊

- Email / Password 登入
- Google 登入
- Email 註冊
- 忘記密碼與驗證流程支援

### 2. 首頁 Dashboard

- 今日訂單
- 今日營收
- 今日銷售節奏
- 快速掌握訂單量與營收狀態

### 3. 供應商管理

- 新增供應商
- 編輯供應商
- 刪除供應商
- 響應式表格顯示

### 4. 商品管理

- 新增商品
- 批量新增商品
- 商品編輯 / 儲存 / 刪除
- 商品圖片預覽放大
- GTIN、商品編號、名稱等欄位管理
- 支援網址匯入商品

### 5. 結帳作業

- 商品條碼掃描
- 手動加入購物車
- 調整數量
- 選擇付款方式
- 確認結帳前檢查付款方式
- 結帳列表支援商品圖片放大

### 6. 銷售紀錄

- 依日期篩選
- 查看商品明細
- 編輯與刪除銷售紀錄
- 圖表分析視窗
- 每小時訂單數量趨勢圖
- 付款方式分析

## 路由頁面

- `/login`：登入頁
- `/register`：註冊頁
- `/`：首頁 Dashboard
- `/products`：商品管理
- `/checkout`：結帳作業
- `/sales`：銷售紀錄
- `/vendors`：供應商管理

## 專案結構

```text
salesManagementSys/
├─ public/
├─ scripts/
├─ src/
│  ├─ assets/
│  ├─ components/
│  │  ├─ AddProduct.vue
│  │  ├─ Checkout.vue
│  │  ├─ ProductList.vue
│  │  ├─ SalesRecord.vue
│  │  └─ Scanner.vue
│  ├─ composables/
│  ├─ layouts/
│  ├─ router/
│  ├─ services/
│  │  ├─ products.ts
│  │  ├─ sales.ts
│  │  └─ vendors.ts
│  ├─ stores/
│  ├─ utils/
│  ├─ views/
│  │  ├─ HomeView.vue
│  │  ├─ Login.vue
│  │  ├─ Register.vue
│  │  └─ Vendors.vue
│  ├─ firebase.ts
│  ├─ main.ts
│  └─ supabase.ts
├─ supabase/
│  ├─ products_setup.sql
│  ├─ sales_setup.sql
│  └─ vendors_setup.sql
├─ AGENTS.md
├─ package.json
└─ README.md
```

## 開發環境需求

- `Node.js 20.19.0` 以上，或 `22.12.0` 以上
- `npm`

`package.json` 目前設定：

```json
"engines": {
  "node": "^20.19.0 || >=22.12.0"
}
```

## 環境變數

請建立 `.env` 或 `.env.local`，至少包含：

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

若需執行 Firebase Admin 或 migration 腳本，另外需要：

```env
SUPABASE_SECRET_KEY=your_supabase_secret_key
FIREBASE_SERVICE_ACCOUNT_PATH=path_to_service_account_json
```

也可以改用：

```env
GOOGLE_APPLICATION_CREDENTIALS=path_to_service_account_json
```

注意：

- `VITE_` 開頭變數可提供前端使用
- `SUPABASE_SECRET_KEY` 不可暴露到前端
- Firebase Service Account 僅供本機腳本或管理用途

## 安裝與執行

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發環境

```bash
npm run dev
```

### 3. 建置正式版本

```bash
npm run build
```

### 4. 預覽建置結果

```bash
npm run preview
```

### 5. 格式化 `src/`

```bash
npm run format
```

## 常用 npm Scripts

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動 Vite 開發伺服器 |
| `npm run build` | 先型別檢查再執行正式建置 |
| `npm run build-only` | 僅執行 Vite build |
| `npm run preview` | 預覽建置後結果 |
| `npm run type-check` | 執行 `vue-tsc` 型別檢查 |
| `npm run format` | 使用 Prettier 格式化 `src/` |
| `npm run migrate:vendors` | 搬移 vendors 到 Supabase |
| `npm run migrate:products` | 搬移 products 到 Supabase |
| `npm run migrate:sales` | 搬移 sales 到 Supabase |
| `npm run list:firebase-users` | 列出 Firebase 使用者與 claim |
| `npm run set:firebase-claim` | 設定單一 Firebase 使用者 claim |
| `npm run set:firebase-claim-all` | 批次設定 Firebase 使用者 claim |

## Supabase 相關檔案

### SQL

- `supabase/vendors_setup.sql`
- `supabase/products_setup.sql`
- `supabase/sales_setup.sql`

### Migration Scripts

- `scripts/migrate-vendors-to-supabase.mjs`
- `scripts/migrate-products-to-supabase.mjs`
- `scripts/migrate-sales-to-supabase.mjs`

### Firebase Admin Scripts

- `scripts/firebase-admin-common.mjs`
- `scripts/list-firebase-users.mjs`
- `scripts/set-firebase-custom-claim.mjs`
- `scripts/set-firebase-custom-claim-all.mjs`

## 前端 Service 層

目前資料存取集中在：

- `src/services/vendors.ts`
- `src/services/products.ts`
- `src/services/sales.ts`

Supabase Client 與 Firebase Token 串接邏輯位於：

- `src/supabase.ts`

Firebase 初始化位於：

- `src/firebase.ts`

## UI / UX 設計基準

本專案目前使用統一的 AURA 視覺方向：

- 深藍灰基底
- 暖金 / 琥珀色強調 CTA
- 卡片、表格、Dialog 維持一致風格
- 手機版與桌機版都要能完整操作

更完整的設計規範、色碼與按鈕系統請參考：

- [AGENTS.md](C:/Users/serva/Desktop/salesManagementSys/AGENTS.md)

## 效能開發原則

目前頁面已朝以下方向優化：

- 新增 / 編輯 / 刪除後，優先更新本地 state
- 避免每次 CRUD 都整表重新抓取
- 僅在初次載入或切換篩選條件時 full fetch

這項原則特別適用於：

- `ProductList.vue`
- `Vendors.vue`
- `SalesRecord.vue`

## 建議驗證項目

每次調整結構、資料來源或列表邏輯後，建議至少執行：

```bash
npm run build
```

並手動確認：

- 登入 / 註冊流程是否正常
- 左側選單在桌機與手機版是否正常
- 商品、供應商、結帳、銷售紀錄列表是否可正常捲動
- 商品圖片是否可放大預覽
- 結帳前是否正確檢查付款方式
- Supabase 權限是否正常

## 後續建議

- 新增模組時，優先沿用現有 AURA UI 規範
- 新資料功能先補 service 層，再接 Vue 畫面
- 若要新增資料表，先處理 SQL、RLS、migration，再接前端
- 若調整按鈕、色碼或表格樣式，記得同步更新 `AGENTS.md`

---

如果後續這個專案還會持續往 Supabase 完全遷移，建議把所有資料操作都統一收斂到 `src/services/`，這樣後面維護、除錯與擴充都會輕鬆很多。
