# 銷售管理系統 Sales Management System

這是一個以 `Vue 3 + Vite + TypeScript + Element Plus + Firebase` 建置的銷售管理系統，主要用來處理商品管理、廠商管理、結帳作業與銷售紀錄查詢。

目前專案已經整理成一套統一的深藍＋暖金視覺風格，並針對登入頁、首頁、商品列表、廠商列表、結帳頁與銷售紀錄頁做過 UI 優化與行動裝置調整。

## 專案特色

- 使用 Firebase Authentication 管理登入與註冊流程。
- 使用 Firebase Realtime Database 儲存商品、廠商、銷售紀錄等資料。
- 支援商品清單管理、批量新增、圖片預覽與條碼產生。
- 支援結帳作業、掃碼加入購物車、手動加入商品與付款方式記錄。
- 支援銷售紀錄查詢、日期篩選、毛利統計與銷售明細編輯。
- 已建立統一 UI 設計規範，方便後續持續擴充。

## 主要功能

### 1. 帳號與登入

- 使用者註冊
- Email / Password 登入
- Google 登入
- Email 驗證
- 受保護路由控管

### 2. 商品管理

- 新增商品
- 批量新增商品
- 商品列表查詢
- 商品圖片點擊放大預覽
- 商品 GTIN / 編號管理
- 條碼產生與下載

### 3. 廠商管理

- 廠商列表瀏覽
- 廠商資料新增 / 編輯 / 刪除
- 與商品供應商欄位整合

### 4. 結帳作業

- 掃碼加入購物車
- 手動輸入 GTIN / 商品編號加入購物車
- 手動建立商品並加入購物車
- 付款方式選擇
- 結帳後自動更新庫存
- 寫入銷售紀錄

### 5. 銷售紀錄

- 依日期 / 月份查詢
- 關鍵字搜尋商品名稱
- 顯示總銷售額、總毛利、筆數
- 付款方式統計分析
- 交易明細檢視與編輯

## 技術棧

### 前端

- `Vue 3`
- `TypeScript`
- `Vite`
- `Vue Router`
- `Pinia`
- `Element Plus`

### 後端服務 / 雲端

- `Firebase Authentication`
- `Firebase Realtime Database`
- `Firebase Analytics`

### 其他工具

- `@zxing/browser`
- `@zxing/library`
- `html5-qrcode`
- `jsbarcode`
- `axios`
- `prettier`

## 頁面路由

目前主要頁面如下：

- `/login`：登入頁
- `/register`：註冊頁
- `/`：首頁 Dashboard
- `/add`：新增商品
- `/products`：商品列表
- `/checkout`：結帳作業
- `/sales`：銷售紀錄
- `/vendors`：廠商列表

## 專案結構

```text
salesManagementSys/
├─ public/
├─ src/
│  ├─ assets/              # 全域樣式、圖片、表格主題
│  ├─ components/          # 功能頁元件與共用元件
│  │  ├─ AddProduct.vue
│  │  ├─ Checkout.vue
│  │  ├─ CheckoutRedesign.vue
│  │  ├─ ProductList.vue
│  │  ├─ Sales.vue
│  │  ├─ SalesRecord.vue
│  │  └─ Scanner.vue
│  ├─ composables/         # 自訂 composables
│  ├─ layouts/             # 版型，例如主框架與側邊欄
│  ├─ router/              # 路由設定
│  ├─ stores/              # Pinia 狀態管理
│  ├─ utils/               # 工具函式，例如條碼功能
│  └─ views/               # 頁面層元件
├─ AGENTS.md               # UI / 開發延續規範
├─ firebase.json
├─ package.json
└─ README.md
```

## 開發環境需求

- `Node.js 20.19.0` 以上，或 `22.12.0` 以上
- `npm`

可參考 `package.json` 中的 `engines` 設定：

```json
"engines": {
  "node": "^20.19.0 || >=22.12.0"
}
```

## 安裝與啟動

### 1. 安裝套件

```bash
npm install
```

### 2. 啟動開發環境

```bash
npm run dev
```

### 3. 型別檢查與正式版建置

```bash
npm run build
```

### 4. 預覽正式版輸出

```bash
npm run preview
```

### 5. 格式化 `src/` 內程式碼

```bash
npm run format
```

## npm Scripts

| 指令                 | 說明                        |
| -------------------- | --------------------------- |
| `npm run dev`        | 啟動 Vite 開發伺服器        |
| `npm run build`      | 先做型別檢查，再建置正式版  |
| `npm run build-only` | 只執行 Vite build           |
| `npm run preview`    | 預覽建置後內容              |
| `npm run type-check` | 使用 `vue-tsc` 做型別檢查   |
| `npm run format`     | 使用 Prettier 格式化 `src/` |

## Firebase 設定

目前專案的 Firebase 設定寫在：

- `src/firebase.ts`

目前採用的是直接寫死在程式碼中的設定方式。這種方式在內部專案或開發階段可以運作，但如果之後要公開部署，建議改成：

- 使用 `.env` / `.env.local` 管理環境變數
- 將 API key、project id 等資訊從程式碼中抽離
- 搭配 Firebase Security Rules 做資料權限控管

## 目前使用中的重要檔案

如果要延續目前的 UI 風格與功能設計，建議優先參考這些檔案：

- `AGENTS.md`
- `src/assets/main.css`
- `src/layouts/MainLayout.vue`
- `src/views/Login.vue`
- `src/views/Register.vue`
- `src/views/HomeView.vue`
- `src/views/Vendors.vue`
- `src/components/ProductList.vue`
- `src/components/CheckoutRedesign.vue`
- `src/components/SalesRecord.vue`

## UI / UX 設計方向

目前專案採用以下視覺方向：

- 主色調：深藍、暖金、淺灰白卡片
- 結構：Hero 區塊 + 控制卡片 + 資料卡片 / 表格卡片
- 元件：圓角卡片、清楚的資訊層級、減少多餘邊框
- 響應式：桌機與手機都可使用，避免整頁無法捲動或重要區塊被遮住

若未來要新增頁面，建議沿用現有 token、卡片結構與表格設計，不要再回到預設 Element Plus 樣式。

## 已知狀況

- 專案目前仍保留部分舊版元件，例如：
  - `Checkout.vue`
  - `Sales.vue`
- 目前路由實際使用的是：
  - `CheckoutRedesign.vue`
  - `SalesRecord.vue`
- `npm run build` 可正常通過，但 Vite 會提示 chunk 體積較大，屬於目前已知警告。

## 後續建議

- 將 Firebase 設定搬到環境變數
- 清理未再使用的舊版頁面元件
- 補齊 README 的畫面截圖
- 加入測試機制
- 針對大型頁面做更細的元件拆分
- 規劃角色權限與更完整的資料安全規則

## 維護提醒

如果你之後會在不同電腦上繼續開發，建議：

1. 先閱讀 `AGENTS.md`
2. 再閱讀本 README
3. 優先沿用現有頁面的卡片結構、色彩 token 與 responsive 規則

這樣比較不容易把目前已經整理好的 UI 一致性弄亂。
