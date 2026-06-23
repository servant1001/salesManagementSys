<template>
    <div class="product-page">
        <el-row class="titleBar">
            <el-col :span="24">
                <div class="title-shell">
                    <div class="title-col">
                        <span class="page-eyebrow">PRODUCT DIRECTORY</span>
                        <h2>商品列表</h2>
                        <p class="page-description">
                            集中管理商品資料、價格、庫存與供應商資訊，讓商品維護與日常查詢更流暢。
                        </p>
                    </div>

                    <div class="title-meta">
                        <div class="hero-badge">
                            <strong>{{ totalProducts }}</strong>
                            <span>目前商品筆數</span>
                        </div>
                    </div>
                </div>
            </el-col>
        </el-row>

        <!-- 查詢 + 按鈕區 -->
        <div class="top-bar">
            <div class="filters-group">
                <el-input v-model="searchQuery" placeholder="搜尋商品名稱或商品編號" clearable class="search-input"
                    @input="handleSearchInput" @clear="handleSearchInput" />

                <el-select v-model="selectedVendor" placeholder="選擇廠商" clearable filterable class="vendor-select"
                    @change="handleVendorChange">
                    <el-option label="全部廠商" :value="null" />
                    <el-option v-for="vendor in vendorList" :key="vendor.vendorId"
                        :label="`${vendor.vendorId} ${vendor.vendorName}`" :value="vendor.vendorId" />
                </el-select>
            </div>

            <div class="secondary-row">
                <div class="action-row">
                    <el-button type="primary" class="scanner-btn product-accent-btn" @click="openScanner">
                        <el-icon class="button-icon">
                            <Camera />
                        </el-icon>
                        掃描 GTIN
                    </el-button>

                </div>

                <div class="button-group">
                    <el-button type="primary" class="product-secondary-btn"
                        @click="openProductImportDialog">網址匯入商品</el-button>
                    <el-button type="success" class="product-primary-btn" @click="openAddDialog">
                        新增商品
                    </el-button>
                    <el-button type="warning" class="product-accent-btn" @click="showBatchDialog = true">
                        批量新增
                    </el-button>
                </div>

                <div v-if="selectedProducts.length" class="danger-zone">
                    <span class="selection-hint">
                        {{ selectedProducts.length ? `已選取 ${selectedProducts.length} 筆商品` : "請先勾選要刪除的商品" }}
                    </span>
                    <el-button type="danger" class="product-danger-btn" @click="deleteSelectedProducts">
                        刪除已選商品
                    </el-button>
                </div>
            </div>

            <!-- 掃描視窗 -->
            <el-dialog v-model="scannerVisible" title="掃描 GTIN 查詢" width="400px">
                <Scanner ref="scannerRef" @onScan="handleScanGTIN" />
            </el-dialog>
        </div>

        <!-- 商品列表表格 -->
        <section class="table-card">
            <div class="table-header">
                <div>
                    <span class="section-eyebrow">LIST</span>
                    <h3>商品資料清單</h3>
                </div>

                <div class="table-meta">
                    <span>{{ totalProducts }} 筆符合條件</span>
                    <span>第 {{ currentPage }} / {{ totalPages }} 頁</span>
                    <span v-if="activeProduct">已選取 1 筆</span>
                </div>
            </div>

            <transition name="action-dock">
                <div v-if="activeProduct" class="floating-action-dock">
                    <div class="floating-action-copy">
                        <span class="dock-eyebrow">SELECTED PRODUCT</span>
                        <strong>{{ activeProduct.name }}</strong>
                        <span class="dock-meta">{{ activeProduct.code || activeProduct.gtin }}</span>
                    </div>

                    <div class="floating-action-buttons">
                        <el-button type="warning" class="product-secondary-btn product-dock-btn"
                            @click="copyProduct(activeProduct)">複製</el-button>
                        <el-button type="primary" class="product-primary-btn product-dock-btn"
                            @click="openEditDialog(activeProduct)">編輯</el-button>
                        <el-button type="danger" class="product-danger-btn product-dock-btn"
                            @click="deleteProduct(activeProduct)">刪除</el-button>
                    </div>

                    <el-button text class="floating-action-clear" @click="clearActiveProductSelection">
                        取消選取
                    </el-button>
                </div>
            </transition>

            <div :class="['product-table-shell', { 'is-switching': loadingProducts }]">
                <el-table :data="pageProducts" style="width: 100%" border :class="['product-table', tableThemeClass]"
                    :header-cell-style="{ background: `var(--table-header-bg)`, color: `var(--table-header-text)` }"
                    @selection-change="handleSelectionChange" @sort-change="handleSortChange" ref="productTable"
                    row-key="id" highlight-current-row :row-class-name="getRowClassName" @row-click="handleRowClick"
                    @current-change="handleCurrentProductChange">

                <!-- checkbox欄位 -->
                <el-table-column type="selection" width="40" align="center" class-name="selection-column"
                    label-class-name="selection-column">
                </el-table-column>

                <!-- 序號欄位 -->
                <el-table-column class-name="no-padding-cell" label="#" width="36" align="center">
                    <template #default="scope">
                        <span class="index-text">
                            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
                        </span>
                    </template>
                </el-table-column>

                <!-- 操作欄整欄隨編輯模式顯示 -->
                <el-table-column v-if="editMode" class-name="no-padding-cell" label="操作" width="96" align="center">
                    <template #default="{ row }">
                        <div class="row-action-stack">
                            <el-button type="primary" size="small"
                                class="row-action-btn product-row-btn product-row-btn--edit"
                                @click="openEditDialog(row)">編輯</el-button>
                            <el-button type="warning" size="small"
                                class="row-action-btn product-row-btn product-row-btn--copy"
                                @click="copyProduct(row)">複製</el-button>
                            <el-button type="danger" size="small"
                                class="row-action-btn row-action-btn--full product-row-btn product-row-btn--delete"
                                @click="deleteProduct(row)">刪除</el-button>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="商品圖片" class-name="no-padding-cell" width="98" align="center">
                    <template #default="{ row }">
                        <button
                            type="button"
                            :class="[
                                'product-image-box',
                                'product-image-button',
                                { 'product-image-box--clickable': !!row.imageUrl }
                            ]"
                            :disabled="!row.imageUrl"
                            :aria-label="row.imageUrl ? `放大查看 ${row.name || '商品圖片'}` : '此商品沒有圖片'"
                            @click="openImagePreview(row)"
                        >
                            <img v-if="row.imageUrl" :src="row.imageUrl" alt="商品圖片" class="product-image" />
                            <el-icon v-else class="product-image-fallback">
                                <Picture />
                            </el-icon>
                        </button>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="商品名稱" min-width="180">
                    <template #default="{ row }">
                        <template v-if="row.website">
                            <a :href="row.website" target="_blank" rel="noopener noreferrer" class="product-link">
                                {{ row.name }}
                            </a>
                        </template>
                        <template v-else>
                            {{ row.name }}
                        </template>
                    </template>
                </el-table-column>

                <el-table-column prop="price" label="定價" min-width="70" />
                <el-table-column prop="sellingPrice" label="售價" min-width="100">
                    <template #default="{ row }">
                        <span class="price-text">
                            <span class="price-value">
                                {{ row.sellingPrice }}
                            </span>
                            元
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="cost" label="成本" min-width="70" />
                <el-table-column prop="stock" label="庫存" min-width="70">
                    <template #default="{ row }">
                        <span class="stock-text">
                            <span class="darkThemeColor stock-value">
                                {{ row.stock }}
                            </span>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="code" label="商品編號" sortable min-width="120" />
                <el-table-column prop="supplierName" label="廠商名稱" min-width="120" />
                <el-table-column prop="supplierCode" label="廠商編號" min-width="120" />
                <el-table-column prop="gtin" label="GTIN" min-width="120" />
                <el-table-column label="條碼" width="120">
                    <template #default="scope">
                        <el-button type="primary" size="small" class="product-secondary-btn product-table-btn"
                            @click="handleGenerateBarcode(scope.row)">
                            生成條碼
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column prop="website" label="網站" min-width="70">
                    <template #default="{ row }">
                        <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer"
                            class="site-link">連結</a>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column prop="note" label="備註" min-width="120" />
                <el-table-column prop="createdBy" label="創建者" min-width="100" />
                <el-table-column prop="updatedBy" label="更新者" min-width="100" />
                <el-table-column prop="created" label="新增時間" min-width="190" :formatter="formatDate" />
                <el-table-column prop="updated" label="更新時間" min-width="190" :formatter="formatDate" />
                </el-table>

                <transition name="table-fade">
                    <div v-if="loadingProducts" class="table-loading-overlay">
                        <div class="table-loading-panel">
                            <div class="table-loading-dots">
                                <span class="table-loading-dot"></span>
                                <span class="table-loading-dot"></span>
                                <span class="table-loading-dot"></span>
                            </div>
                            <p>載入中</p>
                        </div>
                    </div>
                </transition>
            </div>

            <!-- 分頁 -->
            <el-pagination background layout="prev, pager, next, sizes, total" :total="totalProducts"
                :page-size="pageSize" :current-page="currentPage" :page-sizes="[10, 20, 50, 100]"
                @size-change="handlePageSizeChange" @current-change="handlePageChange" class="pagination-bar">
            </el-pagination>

            <div v-if="!pageProducts.length && !loadingProducts" class="empty-state">
                <strong>目前沒有商品資料</strong>
                <p>你可以先新增單筆商品，或使用批量新增快速建立商品清單。</p>
                <div class="empty-actions">
                    <el-button type="primary" class="product-secondary-btn"
                        @click="openProductImportDialog">網址匯入商品</el-button>
                    <el-button type="primary" class="product-primary-btn" @click="openAddDialog">新增商品</el-button>
                    <el-button type="warning" class="product-accent-btn"
                        @click="showBatchDialog = true">批量新增</el-button>
                </div>
            </div>
        </section>

        <!-- 新增商品對話框 -->
        <ProductFormDialog
            ref="addProductDialogRef"
            :visible="showAddDialog"
            title="新增商品"
            submit-text="新增"
            :product="newProduct"
            :rules="rules"
            :filtered-vendors="filteredVendors"
            :show-gtin-actions="true"
            dialog-class="add-product-dialog"
            @update:visible="showAddDialog = $event"
            @submit="submitAddProduct"
            @scan-gtin="startScanNewProduct"
            @sync-gtin-to-code="syncGtinToCode"
            @vendor-filter="filterVendors"
            @supplier-change="findVendorByCode('add')"
        />

        <!-- 網址匯入商品彈窗 -->
        <el-dialog v-model="showProductImportDialog" title="網址匯入商品" width="600px" class="product-import-dialog">
            <el-form label-width="120px">
                <el-form-item label="匯入來源">
                    <el-radio-group v-model="productImportSource" class="import-source-group">
                        <el-radio-button label="sheep100love">百羊官網</el-radio-button>
                        <el-radio-button label="campus">校園書房</el-radio-button>
                    </el-radio-group>
                </el-form-item>

                <el-form-item label="網站連結">
                    <el-input v-model="productImportUrl"
                        :placeholder="productImportSource === 'campus' ? 'https://shop.campus.org.tw/ProductDetails.aspx?ProductID=000618779' : 'https://sheep100love.shopstore.tw'"
                        clearable />
                </el-form-item>

                <el-alert v-if="productImportSource === 'sheep100love'" title="注意：匯入百羊官網商品時，請確保商品資訊完整且正確" type="info"
                    :closable="false" show-icon />
            </el-form>

            <template #footer>
                <el-button class="product-secondary-btn" @click="showProductImportDialog = false">取消</el-button>
                <el-button type="primary" class="product-primary-btn" :loading="productImportLoading"
                    @click="importProduct">
                    抓取商品資料
                </el-button>
            </template>
        </el-dialog>

        <!-- 編輯商品彈窗 -->
        <ProductFormDialog
            v-if="editProduct"
            ref="editProductDialogRef"
            :visible="showEditDialog"
            :title="isCopyMode ? '複製商品' : '編輯商品'"
            submit-text="保存"
            :product="editProduct"
            :rules="rules"
            :filtered-vendors="filteredVendors"
            :gtin-disabled="!isCopyMode"
            dialog-class="edit-product-dialog"
            @update:visible="showEditDialog = $event"
            @submit="saveEditProduct"
            @vendor-filter="filterVendors"
            @supplier-change="findVendorByCode('edit')"
        />

        <!-- 🧩 批量新增商品彈窗 -->
        <BatchProductDialog
            ref="batchDialogRef"
            :visible="showBatchDialog"
            :batch-base="batchBase"
            :batch-list="batchList"
            :filtered-vendors="filteredVendors"
            :rules="batchRules"
            @update:visible="showBatchDialog = $event"
            @submit="submitBatchProducts"
            @sync-field="syncBatchField"
            @vendor-filter="filterVendors"
            @supplier-change="findVendorByCodeBatch"
            @clear-rows="clearAllBatchRows"
            @add-row="addBatchRow"
            @remove-row="removeBatchRow"
            @scan-row="startScanGTIN"
            @gtin-change="onGtinChange"
            @toggle-use-gtin-as-code="onUseGtinAsCodeChange"
        />


        <!-- 掃描器彈窗 -->
        <el-dialog title="掃描條碼" v-model="showScannerDialog" :width="'90%'" destroy-on-close>
            <Scanner @onScan="handleScanResult" />
        </el-dialog>

        <!-- 條碼預覽彈窗 -->
        <el-dialog v-model="showBarcodeDialog" title="條碼預覽" :width="'100%'" center>
            <div v-if="barcodeDataUrl" class="barcode-preview">
                <img :src="barcodeDataUrl" alt="Barcode" />
            </div>
            <template #footer>
                <el-button class="product-secondary-btn"
                    @click="downloadBarcode(currentProduct?.name, currentProduct?.gtin, barcodeDataUrl)">下載圖片</el-button>
                <el-button type="primary" class="product-primary-btn" @click="showBarcodeDialog = false">關閉</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="showImagePreviewDialog" title="商品圖片預覽" width="min(92vw, 760px)" center>
            <div v-if="previewImageUrl" class="image-preview-dialog">
                <img :src="previewImageUrl" :alt="previewImageName || '商品圖片預覽'" class="image-preview-full" />
                <p v-if="previewImageName" class="image-preview-caption">{{ previewImageName }}</p>
            </div>
            <template #footer>
                <el-button type="primary" class="product-primary-btn"
                    @click="showImagePreviewDialog = false">關閉</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import { ElMessage, ElMessageBox } from "element-plus";
import { Camera, Picture } from "@element-plus/icons-vue";
import Scanner from "@/components/Scanner.vue";
import ProductFormDialog from "@/components/ProductFormDialog.vue";
import BatchProductDialog from "@/components/BatchProductDialog.vue";
import { useThemeStore } from "@/stores/theme";
import { useAuth } from "@/composables/useAuth";
import { generateBarcodeImage, downloadBarcode } from '@/utils/barcode'  // 引入剛剛的模組
import {
    fetchProductsPage as fetchProductsFromSupabase,
    insertProduct as insertProductRecord,
    updateProduct as updateProductRecord,
    upsertProducts,
    deleteProductsByIds,
    checkProductCodeExists as checkProductCodeExistsOnServer,
    checkProductGtinExists as checkProductGtinExistsOnServer,
    findExistingProductsByCodesOrGtins,
    type Product,
    type UpsertProductInput,
} from "@/services/products";
import { fetchVendorsPage as fetchVendorsFromSupabase, type Vendor } from "@/services/vendors";

const themeStore = useThemeStore();
const tableThemeClass = computed(() => (themeStore.isDarkTheme ? "table-dark" : "table-light"));
const { user } = useAuth();

interface ImportedVariant {
    id?: number;
    name?: string;
    optionValues?: string;
    sku?: string;
    price?: number;
    sellingPrice?: number;
    stock?: number;
    imageUrl?: string;
}

interface ImportedProductResponse {
    name?: string;
    price?: number;
    sellingPrice?: number;
    isbn?: string;
    imageUrl?: string;
    website?: string;
    source?: "campus" | "sheep100love" | string;
    variants?: ImportedVariant[];
}

interface BatchProductRow {
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    imageUrl: string;
    useGtinAsCode: boolean;
}

const products = ref<Record<string, Product>>({});
const editMode = ref(false);
const searchQuery = ref("");
const scannerVisible = ref(false);
const loadingProducts = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalProducts = ref(0);
let productSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

// 新增商品
const showAddDialog = ref(false);
const showScannerDialog = ref(false);
const addProductDialogRef = ref<InstanceType<typeof ProductFormDialog> | null>(null);
const editProductDialogRef = ref<InstanceType<typeof ProductFormDialog> | null>(null);

const createEmptyProduct = (): Omit<Product, "id" | "createdBy" | "updatedBy"> => ({
    gtin: "",
    code: "",
    name: "",
    price: 0,
    sellingPrice: 0,
    cost: 0,
    stock: 0,
    supplierName: "",
    supplierCode: "",
    imageUrl: "",
    website: "",
    note: "",
    created: Date.now(),
});

const newProduct = ref<Omit<Product, "id" | "createdBy" | "updatedBy">>(createEmptyProduct());

const showProductImportDialog = ref(false);
const productImportSource = ref<"campus" | "sheep100love">("campus");
const productImportUrl = ref("");
const productImportLoading = ref(false);

function openProductImportDialog() {
    productImportSource.value = "sheep100love";
    productImportUrl.value = "";
    showProductImportDialog.value = true;
}

function openAddDialog() {
    newProduct.value = createEmptyProduct();
    showAddDialog.value = true;
}

function matchesImportSource(url: string, source: "campus" | "sheep100love") {
    try {
        const hostname = new URL(url).hostname.toLowerCase();
        return source === "campus"
            ? hostname.includes("campus")
            : hostname === "sheep100love.shopstore.tw";
    } catch {
        return false;
    }
}

function buildImportedProductName(product: ImportedProductResponse, variant?: ImportedVariant) {
    const baseName = (product.name || "").trim();
    const variantName = (variant?.name || variant?.optionValues || "").trim();
    return variantName ? `${baseName} - ${variantName}` : baseName;
}

function openImportedProductInAddDialog(product: ImportedProductResponse, url: string) {
    newProduct.value = {
        ...createEmptyProduct(),
        name: buildImportedProductName(product),
        gtin: product.isbn || "",
        code: product.isbn || "",
        price: product.price ?? 0,
        sellingPrice: product.sellingPrice ?? product.price ?? 0,
        stock: 0,
        imageUrl: product.imageUrl || "",
        website: product.website || url,
        note: `導入自 ${productImportSource.value === "campus" ? "校園網站" : "百羊官網"}`,
    };

    showProductImportDialog.value = false;
    showAddDialog.value = true;
}

function openImportedVariantsInBatchDialog(product: ImportedProductResponse, url: string) {
    batchBase.value = {
        ...createEmptyBatchBase(),
        price: product.price ?? 0,
        sellingPrice: product.sellingPrice ?? product.price ?? 0,
        website: product.website || url,
        note: "",
    };

    batchList.value = (product.variants || []).map((variant) => {
        const sku = (variant.sku || "").trim();
        const rowName = buildImportedProductName(product, variant);
        const price = variant.price ?? product.price ?? 0;
        const sellingPrice = variant.sellingPrice ?? price;
        return {
            gtin: sku,
            code: sku,
            name: rowName,
            price,
            sellingPrice,
            cost: 0,
            stock: variant.stock ?? 0,
            imageUrl: variant.imageUrl || product.imageUrl || "",
            useGtinAsCode: Boolean(sku),
        };
    });

    showProductImportDialog.value = false;
    showBatchDialog.value = true;
}

async function importProduct() {
    const url = productImportUrl.value.trim();

    if (!url) {
        ElMessage.warning("請先輸入商品網址");
        return;
    }

    if (!matchesImportSource(url, productImportSource.value)) {
        ElMessage.warning(productImportSource.value === "campus"
            ? "請輸入正確的「校園網站」商品網址"
            : "請輸入正確的「百羊官網」商品網址");
        return;
    }

    productImportLoading.value = true;

    try {
        const res = await axios.get<ImportedProductResponse>("https://product-worker.servant1001.workers.dev/api/product", {
            params: { url },
        });

        const data = res.data;
        const variants = data.variants || [];
        const shouldOpenBatch = data.source === "sheep100love" && variants.length > 0;

        if (shouldOpenBatch) {
            openImportedVariantsInBatchDialog(data, url);
            ElMessage.success(`此商品共導入 ${variants.length} 筆品項`);
            return;
        }

        openImportedProductInAddDialog(data, url);
        ElMessage.success("已抓取商品資料，請確認後新增");
    } catch (error: any) {
        console.error(error);
        ElMessage.error(
            error.response?.data?.message ||
            error.response?.data?.error ||
            "導入商品資料時發生錯誤"
        );
    } finally {
        productImportLoading.value = false;
    }
}
const rules = {
    gtin: [{ required: true, message: "請輸入 GTIN", trigger: "blur" }],
    code: [{ required: true, message: "請輸入商品編號", trigger: "blur" }],
    name: [{ required: true, message: "請輸入商品名稱", trigger: "blur" }],
    price: [{ required: true, message: "請輸入定價", trigger: "blur" }],
    sellingPrice: [{ required: true, message: "請輸入售價", trigger: "blur" }],
    cost: [{ required: true, message: "請輸入成本", trigger: "blur" }],
    stock: [{ required: true, message: "請輸入庫存", trigger: "change" }],
};

// GTIN 同步到 商品編號
function syncGtinToCode() {
    if (newProduct.value.gtin) {
        newProduct.value.code = newProduct.value.gtin;
    }
}

// 編輯彈窗
const showEditDialog = ref(false);
const editProduct = ref<Product | null>(null);

const scanTargetRow = ref<any>(null);

function startScanGTIN(row: any) {
    scanTargetRow.value = row;
    showScannerDialog.value = true;
}

function startScanNewProduct() {
    scanTargetRow.value = newProduct.value;
    showScannerDialog.value = true;
}

// 掃描條碼
function handleScanResult(result: string) {
    if (scanTargetRow.value) {
        scanTargetRow.value.gtin = result; // 將掃描結果填入對應 row
        scanTargetRow.value = null; // 清除目標
    } else if (editProduct.value) {
        editProduct.value.gtin = result;  // 編輯模式填入 GTIN
    } else {
        newProduct.value.gtin = result;   // 新增模式填入 GTIN
    }
    showScannerDialog.value = false;

    ElMessage({
        message: `已掃描GTIN: ${result} `,
        type: "success",
        duration: 1000
    });
}


function getCurrentUserDisplayName(): string | undefined {
    return user.value?.displayName ?? undefined;
}

function createProductMap(productList: Product[]) {
    return productList.reduce<Record<string, Product>>((result, product) => {
        result[product.id] = product;
        return result;
    }, {});
}

function createProductId() {
    return globalThis.crypto?.randomUUID?.() ?? `product-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function upsertLocalProduct(product: Product) {
    products.value = {
        ...products.value,
        [product.id]: product,
    };
}

async function fetchProducts() {
    try {
        loadingProducts.value = true;
        const result = await fetchProductsFromSupabase({
            page: currentPage.value,
            pageSize: pageSize.value,
            keyword: searchQuery.value,
            supplierCode: selectedVendor.value,
            sortProp: sortState.value.prop || null,
            sortOrder: sortState.value.order,
        });

        products.value = createProductMap(result.items);
        totalProducts.value = result.total;

        const maxPage = Math.max(1, Math.ceil(result.total / pageSize.value));
        if (currentPage.value > maxPage) {
            currentPage.value = maxPage;
            if (result.total > 0) {
                await fetchProducts();
            }
        }
    } catch (error) {
        console.error(error);
        ElMessage.error("載入商品資料失敗");
        products.value = {};
        totalProducts.value = 0;
    } finally {
        loadingProducts.value = false;
    }
}

const pageProducts = computed(() => Object.values(products.value));

const scannerRef = ref<InstanceType<typeof Scanner> | null>(null);
// 打開掃描框
function openScanner() {
    scannerVisible.value = true;
}

// 處理掃描結果
function handleScanGTIN(gtin: string) {
    scannerRef.value?.stopScanner();
    scannerVisible.value = false;
    searchQuery.value = gtin;
    handleSearchInput();
    ElMessage.success(`已套用 GTIN 搜尋：${gtin}`);
}

function formatDate(row: Product, column?: any) {
    const timestamp = column?.property === "updated" ? row.updated : row.created;
    return timestamp ? new Date(timestamp).toLocaleString() : "";
}

function toggleEditMode() {
    editMode.value = !editMode.value;
}

function openEditDialog(product: Product) {
    editProduct.value = { ...product };
    showEditDialog.value = true;
}

// 編輯商品(更新)、複製商品(新增)
async function saveEditProduct() {
    if (!editProduct.value) return;

    // 商品編號必填檢查
    const code = editProduct.value.code?.trim();
    if (!code) {
        ElMessage.warning("請輸入商品編號");
        return;
    }

    try {
        if (isCopyMode.value) {
            // 複製模式(新增商品)
            const gtin = editProduct.value.gtin?.trim();
            // GTIN & code 必填檢查
            if (!gtin) {
                ElMessage.warning("請輸入 GTIN");
                return;
            }

            if (await checkGTINExists(gtin)) {
                ElMessage.error(`GTIN「${gtin}」已存在，請修改`);
                return;
            }

            if (await checkCodeExists(code)) {
                ElMessage.error(`商品編號「${code}」已存在，請修改`);
                return;
            }

            const currentUser = getCurrentUserDisplayName();
            const productData: UpsertProductInput = {
                ...editProduct.value,
                id: createProductId(),
                gtin,
                code,
                created: Date.now(),
                createdBy: currentUser,
            };

            await insertProductRecord(productData);
            currentPage.value = 1;
            await fetchProducts();
            ElMessage.success("✅ 商品複製成功");
        } else {
            const now = Date.now();
            const currentUser = getCurrentUserDisplayName();
            const existingProduct = products.value[editProduct.value.id];

            if (existingProduct && existingProduct.code !== code && await checkCodeExists(code, editProduct.value.id)) {
                ElMessage.error(`商品編號「${code}」已存在，請修改`);
                return;
            }

            const updateData: UpsertProductInput = {
                ...editProduct.value,
                code,
                updated: now,
                updatedBy: currentUser,
            };

            const updatedProduct = await updateProductRecord(updateData);
            upsertLocalProduct(updatedProduct);
            ElMessage.success("✅ 商品更新成功");
        }

    } catch (error) {
        console.error(error);
        ElMessage.error("商品儲存失敗");
    }

    showEditDialog.value = false;
    editProduct.value = null;
    isCopyMode.value = false; // 重置
}

// 刪除前確認
function deleteProduct(product: Product) {
    if (!product.id) return;

    ElMessageBox.confirm(
        `確定要刪除「${product.name}」嗎？此操作無法復原。`,
        "刪除確認",
        {
            confirmButtonText: "刪除",
            cancelButtonText: "取消",
            type: "warning",
        }
    )
        .then(async () => {
            try {
                await deleteProductsByIds([product.id]);
                await fetchProducts();

                if (activeProductId.value === product.id) {
                    clearActiveProductSelection();
                }

                ElMessage.success("刪除成功");
            } catch (error) {
                console.error(error);
                ElMessage.error("刪除失敗");
            }
        })
        .catch(() => { });
}

// 檢查 GTIN 是否已存在（排除特定 ID）
async function checkGTINExists(gtin: string, excludeId?: string): Promise<boolean> {
    return await checkProductGtinExistsOnServer(gtin, excludeId);
}

// 檢查商品編號是否已存在
async function checkCodeExists(code: string, excludeId?: string): Promise<boolean> {
    return await checkProductCodeExistsOnServer(code, excludeId);
}

// 新增商品（必填驗證 + 編號檢查）
async function submitAddProduct() {
    const valid = await addProductDialogRef.value?.validate?.();
    if (!valid) {
        ElMessage.warning("請完整填寫所有欄位");
        return;
    }

    // 🔍 檢查 GTIN 是否重複
    if (await checkGTINExists(newProduct.value.gtin)) {
        ElMessage.error(`GTIN「${newProduct.value.gtin}」已存在，請修改後再新增`);
        return;
    }

    // 🔍 檢查商品編號是否重複
    const codeExists = await checkProductCodeExists(newProduct.value.code);
    if (codeExists) {
        ElMessage.error(`商品編號「${newProduct.value.code}」已存在，請修改後再新增`);
        return;
    }

    addProduct();
}

async function checkProductCodeExists(code: string): Promise<boolean> {
    return checkCodeExists(code);
}

const isCopyMode = ref(false);
function copyProduct(product: Product) {
    // 開啟複製模式
    isCopyMode.value = true;

    // 複製資料，重設 id 與時間
    editProduct.value = {
        ...product,
        id: undefined,
        gtin: "", // 讓 GTIN 可重新輸入
        name: `${product.name} (複製)`,
        created: Date.now(),
        createdBy: getCurrentUserDisplayName(),
    } as unknown as Product;

    showEditDialog.value = true;
}

async function addProduct() {
    try {
        const currentUser = getCurrentUserDisplayName();
        const productData: UpsertProductInput = {
            ...newProduct.value,
            id: createProductId(),
            gtin: newProduct.value.gtin.trim(),
            code: newProduct.value.code.trim(),
            name: newProduct.value.name.trim(),
            created: Date.now(),
            createdBy: currentUser,
        };

        await insertProductRecord(productData);
        currentPage.value = 1;
        await fetchProducts();

        showAddDialog.value = false;
        newProduct.value = createEmptyProduct();
        ElMessage.success("商品新增成功");
    } catch (error) {
        console.error(error);
        ElMessage.error("商品新增失敗");
    }
}

// 篩選後的結果
const filteredVendors = ref<Vendor[]>([])

// 搜尋過濾方法
function filterVendors(query: string) {
    if (!query) {
        filteredVendors.value = vendorList.value
        return
    }
    const lowerQuery = query.toLowerCase()
    filteredVendors.value = vendorList.value.filter(
        v =>
            v.vendorId.toLowerCase().includes(lowerQuery) ||
            v.vendorName.toLowerCase().includes(lowerQuery)
    )
}


// 查詢廠商名稱
// 支援從 <el-select @change="findVendorByCode"> 傳入的值（可被忽略）
// 以及從複製/編輯模式呼叫時傳入 'edit' 作為 context
async function findVendorByCode(arg?: string) {
    // 若傳入 'edit'，代表要用 editProduct；否則預設使用 newProduct（el-select 的 change 會傳 vendorId，但我們使用 v-model 的值）
    const context: 'new' | 'edit' = arg === 'edit' ? 'edit' : 'new';

    let code = "";
    if (context === 'edit') {
        if (!editProduct.value) {
            ElMessage.warning("編輯的商品資料不存在");
            return;
        }
        code = (editProduct.value.supplierCode || "").trim();
    } else {
        code = (newProduct.value.supplierCode || "").trim();
    }

    if (!code) {
        ElMessage.warning("請先輸入廠商編號");
        return;
    }

    if (!vendorList.value.length) {
        ElMessage.error("目前沒有任何廠商資料");
        return;
    }

    const matched = vendorList.value.find(
        (v) => v.vendorId?.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
        if (context === 'edit' && editProduct.value) {
            editProduct.value.supplierName = matched.vendorName;
        } else {
            newProduct.value.supplierName = matched.vendorName;
        }
        ElMessage.success(`已找到廠商：${matched.vendorName}`);
    } else {
        if (context === 'edit' && editProduct.value) {
            editProduct.value.supplierName = "";
        } else {
            newProduct.value.supplierName = "";
        }
        ElMessage.warning("找不到對應的廠商");
    }
}

// 🧩 批量新增商品
const showBatchDialog = ref(false);
const batchDialogRef = ref<InstanceType<typeof BatchProductDialog> | null>(null);

const createEmptyBatchBase = () => ({
    price: 0,
    sellingPrice: 0,
    cost: 0,
    stock: 0,
    supplierName: "",
    supplierCode: "",
    website: "",
    note: "",
});

const batchBase = ref(createEmptyBatchBase());
const batchList = ref<BatchProductRow[]>([]);

const batchRules = {
    price: [{ required: true, message: "請輸入定價", trigger: "blur" }],
    sellingPrice: [{ required: true, message: "請輸入售價", trigger: "blur" }],
    cost: [{ required: true, message: "請輸入成本", trigger: "blur" }],
    stock: [{ required: true, message: "請輸入庫存", trigger: "change" }],
};


const addBatchRow = () => {
    const last = batchList.value[batchList.value.length - 1];
    let newGtin = "";
    let useGtinAsCode = false;

    if (last && last.gtin) {
        const match = last.gtin.match(/(\d+)$/);
        if (match) {
            const prefix = last.gtin.slice(0, match.index);
            const num = match[1] ?? "0";
            const nextNum = String(Number(num) + 1).padStart(num.length, "0");
            newGtin = prefix + nextNum;
        } else {
            newGtin = last.gtin;
        }

        useGtinAsCode = !!last.useGtinAsCode;
    } else {
        newGtin = "CN00100101";
    }

    batchList.value.push({
        gtin: newGtin,
        code: useGtinAsCode ? newGtin : "",
        name: "",
        price: batchBase.value.price,
        sellingPrice: batchBase.value.sellingPrice,
        cost: batchBase.value.cost,
        stock: batchBase.value.stock,
        imageUrl: "",
        useGtinAsCode,
    });
};

function syncBatchField(field: "price" | "sellingPrice" | "cost" | "stock") {
    if (!batchList.value.length) {
        ElMessage.warning("請先輸入商品資料");
        return;
    }

    const fieldValue = batchBase.value[field] ?? 0;
    batchList.value.forEach((item) => {
        item[field] = fieldValue;
    });
    ElMessage.success("已同步欄位值");
}
const clearAllBatchRows = async () => {
    try {
        await ElMessageBox.confirm(
            "確定要清空所有商品嗎？此動作無法復原！",
            "確認清空",
            {
                confirmButtonText: "確認",
                cancelButtonText: "取消",
                type: "warning",
            }
        );

        // 使用者按下確認後執行清空
        batchList.value = [];
        ElMessage.success("已清空商品列表");
    } catch {
        // 使用者按取消
        ElMessage.info("已取消清空");
    }
};

function removeBatchRow(index: number) {
    batchList.value.splice(index, 1);
}

async function findVendorByCodeBatch() {
    const code = batchBase.value.supplierCode.trim();
    if (!code) {
        ElMessage.warning("請先輸入廠商編號");
        return;
    }

    if (!vendorList.value.length) {
        ElMessage.error("目前沒有任何廠商資料");
        return;
    }

    const matched = vendorList.value.find(
        (v) => v.vendorId?.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
        batchBase.value.supplierName = matched.vendorName;
        ElMessage.success(`已找到廠商：${matched.vendorName}`);
    } else {
        batchBase.value.supplierName = "";
        ElMessage.warning("找不到對應的廠商");
    }
}

async function submitBatchProducts() {
    const valid = await batchDialogRef.value?.validate?.();
    if (!valid) {
        ElMessage.warning("請完整填寫批量新增的基本欄位");
        return;
    }

    if (!batchList.value.length) {
        ElMessage.warning("請至少新增一筆商品");
        return;
    }

    const currentUser = getCurrentUserDisplayName();
    const now = Date.now();

    const incompleteRows = batchList.value
        .map((item, index) => {
            const missingFields: string[] = [];

            if (!item.gtin?.trim()) missingFields.push("GTIN");
            if (!item.code?.trim()) missingFields.push("商品編號");
            if (!item.name?.trim()) missingFields.push("商品名稱");

            if (!missingFields.length) return null;

            return `第 ${index + 1} 筆：${missingFields.join("、")}`;
        })
        .filter((row): row is string => Boolean(row));

    if (incompleteRows.length > 0) {
        ElMessage.error(`以下商品資料未填完整，請補齊後再提交：${incompleteRows.join("；")}`);
        return;
    }

    const duplicateCodes: string[] = [];
    const duplicateGTINs: string[] = [];
    const existingMatches = await findExistingProductsByCodesOrGtins(
        batchList.value.map((item) => item.code),
        batchList.value.map((item) => item.gtin)
    );
    for (const item of batchList.value) {
        const code = item.code.trim().toLowerCase();
        const gtin = item.gtin.trim().toLowerCase();

        if (existingMatches.codes.has(code)) duplicateCodes.push(code);
        if (existingMatches.gtins.has(gtin)) duplicateGTINs.push(gtin);
    }

    if (duplicateCodes.length > 0) {
        ElMessage.error(`以下商品編號已存在，請修改後再提交：${duplicateCodes.join(", ")}`);
        return;
    }
    if (duplicateGTINs.length > 0) {
        ElMessage.error(`以下 GTIN 已存在，請修改後再提交：${duplicateGTINs.join(", ")}`);
        return;
    }

    const productInputs: UpsertProductInput[] = batchList.value.map((item) => {
        const id = createProductId();
        return {
            id,
            code: item.code.trim(),
            gtin: item.gtin.trim(),
            name: item.name.trim(),
            price: batchBase.value.price,
            sellingPrice: batchBase.value.sellingPrice,
            cost: batchBase.value.cost,
            stock: item.stock,
            supplierName: batchBase.value.supplierName,
            supplierCode: batchBase.value.supplierCode,
            imageUrl: item.imageUrl,
            website: batchBase.value.website,
            note: batchBase.value.note,
            created: now,
            createdBy: currentUser,
        };
    });

    try {
        await upsertProducts(productInputs);
        currentPage.value = 1;
        await fetchProducts();
        ElMessage.success(`成功新增 ${batchList.value.length} 筆商品`);
        showBatchDialog.value = false;
        batchList.value = [];
        batchBase.value = {
            price: 0,
            sellingPrice: 0,
            cost: 0,
            stock: 0,
            supplierName: "",
            supplierCode: "",
            website: "",
            note: "",
        };
    } catch (err) {
        console.error(err);
        ElMessage.error("批量新增失敗");
    }
}

// 用於存放已勾選的商品
const selectedProducts = ref<Product[]>([]);
const productTable = ref<any>(null);
const activeProductId = ref<string | null>(null);
const selectedProductIds = computed(() => new Set(selectedProducts.value.map((product) => product.id)));
const activeProduct = computed<Product | null>(() => {
    if (!activeProductId.value) return null;
    return products.value[activeProductId.value] ?? null;
});

// 監聽勾選變化
function handleSelectionChange(val: Product[]) {
    selectedProducts.value = val;
}

function handleCurrentProductChange(product: Product | null) {
    activeProductId.value = product?.id ?? null;
}

function handleRowClick(row: Product) {
    activeProductId.value = row.id;
    productTable.value?.setCurrentRow?.(row);
}

function clearActiveProductSelection() {
    activeProductId.value = null;
    productTable.value?.setCurrentRow?.(undefined);
}

function getRowClassName({ row }: { row: Product }) {
    return selectedProductIds.value.has(row.id) ? "multi-selected-row" : "";
}

// ✅ 當 GTIN 改變時，如果「使用為編號」有勾選，立即同步更新商品編號
const onGtinChange = (row: any) => {
    if (row.useGtinAsCode) {
        row.code = row.gtin;
    }
};

// ✅ 當 checkbox 勾選/取消時控制行為
const onUseGtinAsCodeChange = (row: any) => {
    if (row.useGtinAsCode) {
        // 勾選後立即套用 GTIN 當作編號
        row.code = row.gtin;
    }
    // 若取消勾選，可選擇是否清空或保留
    // 若要清空商品編號可加上：
    // else {
    //     row.code = "";
    // }
};

// 批次刪除勾選商品
function deleteSelectedProducts() {
    if (!selectedProducts.value.length) {
        ElMessage.warning("請先勾選要刪除的商品");
        return;
    }

    ElMessageBox.confirm(
        `確定要刪除 ${selectedProducts.value.length} 筆商品嗎？此操作無法復原。`,
        "刪除確認",
        {
            confirmButtonText: "刪除",
            cancelButtonText: "取消",
            type: "warning",
        }
    )
        .then(async () => {
            try {
                const ids = selectedProducts.value.map((product) => product.id).filter(Boolean);
                await deleteProductsByIds(ids);
                await fetchProducts();
                ElMessage.success("已刪除選中的商品");
                selectedProducts.value = [];
                // 清除表格勾選
                productTable.value.clearSelection();
            } catch (err) {
                console.error(err);
                ElMessage.error("刪除失敗");
            }
        })
        .catch(() => { });
}

const totalPages = computed(() => Math.max(1, Math.ceil(totalProducts.value / pageSize.value)));

// 分頁事件
function handlePageChange(page: number) {
    currentPage.value = page;
    void fetchProducts();
}

function handlePageSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1;
    void fetchProducts();
}

// 排序狀態
const sortState = ref<{ prop: string; order: 'ascending' | 'descending' | null }>({
    prop: '',
    order: null
});

// 排序事件處理
function handleSortChange({ prop, order }: any) {
    sortState.value = { prop, order };
    currentPage.value = 1;
    void fetchProducts();
}

const selectedVendor = ref<string | null>(null); // 選擇的廠商編號
const vendorList = ref<Vendor[]>([]); // 廠商列表

// 取得廠商列表
async function fetchVendors() {
    try {
        const result = await fetchVendorsFromSupabase({
            page: 1,
            pageSize: 1000,
            country: "all",
        });
        vendorList.value = result.items;
        // 同步更新篩選用的清單
        filteredVendors.value = vendorList.value;
    } catch (error) {
        console.error(error);
        vendorList.value = [];
        filteredVendors.value = [];
        ElMessage.error("載入廠商資料失敗");
    }
}

function handleSearchInput() {
    if (productSearchDebounceTimer) {
        clearTimeout(productSearchDebounceTimer);
    }

    productSearchDebounceTimer = setTimeout(() => {
        currentPage.value = 1;
        void fetchProducts();
    }, 300);
}

function handleVendorChange() {
    currentPage.value = 1;
    void fetchProducts();
}

watch(pageProducts, (rows) => {
    if (!activeProductId.value) return;

    const stillVisible = rows.some((row) => row.id === activeProductId.value);
    if (!stillVisible) {
        clearActiveProductSelection();
    }
});

function syncBatchStock() {
    if (!batchList.value.length) {
        ElMessage.warning("列表中沒有任何商品，無法同步庫存");
        return;
    }

    const stockValue = batchBase.value.stock ?? 0;
    batchList.value.forEach(item => {
        item.stock = stockValue;
    });
    ElMessage.success(`已將庫存同步為 ${stockValue}`);
}

// 條碼 Dialog 狀態
const showBarcodeDialog = ref(false)
const barcodeDataUrl = ref('')
const currentProduct = ref<{ name: string; gtin: string; price?: number } | null>(null)
const showImagePreviewDialog = ref(false)
const previewImageUrl = ref('')
const previewImageName = ref('')

// 點擊「生成條碼」
async function handleGenerateBarcode(product: { name: string; gtin: string; sellingPrice?: number }) {
    try {
        if (!product.gtin) {
            ElMessage.warning('該商品沒有 GTIN')
            return
        }
        currentProduct.value = product
        barcodeDataUrl.value = await generateBarcodeImage(product.name, product.gtin, product.sellingPrice ?? 0)
        showBarcodeDialog.value = true
    } catch (error) {
        console.error(error)
        ElMessage.error('生成條碼時發生錯誤')
    }
}

function openImagePreview(product: { imageUrl?: string; name?: string }) {
    if (!product.imageUrl) return

    previewImageUrl.value = product.imageUrl
    previewImageName.value = product.name || ''
    showImagePreviewDialog.value = true
}

// 在 onMounted 中呼叫
onMounted(async () => {
    await Promise.all([fetchProducts(), fetchVendors()]);
});
</script>

<style scoped>
.product-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

.table-dark .darkThemeColor {
    color: #ffffff;
}

.table-light .darkThemeColor {
    color: #000000;
}

.titleBar,
.top-bar {
    border: 1px solid var(--surface-border);
    border-radius: 28px;
    background: var(--surface-card);
    box-shadow: var(--surface-shadow);
}

.titleBar {
    margin: 0;
    padding: 30px 32px;
    background:
        radial-gradient(circle at top right, rgba(77, 131, 180, 0.18), transparent 28%),
        linear-gradient(135deg, rgba(12, 31, 54, 0.96), rgba(26, 64, 99, 0.9));
}

.title-col {
    text-align: left;
}

.title-shell {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
}

.page-eyebrow,
.section-eyebrow {
    display: inline-flex;
    color: var(--accent-color);
    font-size: 0.76rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

.title-col h2 {
    margin: 10px 0 0;
    color: #f5f8fc;
    font-size: clamp(1.9rem, 3vw, 2.7rem);
    line-height: 1.08;
    font-weight: 700;
    letter-spacing: -0.04em;
}

.page-description {
    margin-top: 14px;
    max-width: 640px;
    color: rgba(232, 238, 246, 0.8);
    line-height: 1.8;
}

.title-meta {
    display: flex;
    justify-content: flex-end;
    flex-shrink: 0;
}

.hero-badge {
    min-width: 160px;
    padding: 20px 22px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.06);
}

.hero-badge strong {
    display: block;
    color: #f5f8fc;
    font-size: 2rem;
    font-weight: 700;
}

.hero-badge span {
    display: block;
    margin-top: 6px;
    color: rgba(232, 238, 246, 0.68);
}

.top-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    padding: 24px;
}

.filters-group {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    width: 100%;
}

.search-input {
    flex: 1 1 320px;
    min-width: 220px;
}

.vendor-select {
    flex: 0 0 220px;
}

.secondary-row {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    width: 100%;
    align-items: center;
}

.action-row,
.button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
}

.action-row {
    flex: 0 1 auto;
}

.button-group {
    flex: 0 1 auto;
    margin-left: auto;
    justify-content: flex-end;
}

.danger-zone {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    border: 1px solid rgba(217, 78, 78, 0.14);
    border-radius: 16px;
    background: rgba(217, 78, 78, 0.06);
}

.selection-hint {
    color: var(--muted-text);
    font-size: 0.92rem;
}

.action-row :deep(.el-button + .el-button),
.button-group :deep(.el-button + .el-button),
.gtin-actions :deep(.el-button + .el-button),
.stock-field :deep(.el-button + .el-button) {
    margin-left: 0;
}

.action-row :deep(.el-button),
.button-group :deep(.el-button) {
    min-height: 44px;
    border-radius: 14px;
    font-weight: 600;
}

.button-group :deep(.el-button) {
    min-width: 132px;
}

.danger-zone :deep(.el-button) {
    min-height: 44px;
    border-radius: 14px;
    font-weight: 600;
}

.product-primary-btn,
.product-secondary-btn,
.product-accent-btn,
.product-danger-btn,
.product-row-btn {
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease,
        color 0.18s ease,
        filter 0.18s ease;
}

.product-primary-btn:hover,
.product-primary-btn:focus-visible,
.product-secondary-btn:hover,
.product-secondary-btn:focus-visible,
.product-accent-btn:hover,
.product-accent-btn:focus-visible,
.product-danger-btn:hover,
.product-danger-btn:focus-visible,
.product-row-btn:hover,
.product-row-btn:focus-visible {
    transform: translateY(-1px);
}

.product-primary-btn {
    border-color: rgba(185, 122, 55, 0.38);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.24), transparent 48%),
        linear-gradient(180deg, rgba(17, 40, 66, 0.98), rgba(24, 54, 86, 0.96));
    color: #f7fbff;
    font-weight: 700;
    box-shadow: 0 14px 28px rgba(16, 36, 58, 0.18);
}

.product-primary-btn:hover,
.product-primary-btn:focus-visible {
    border-color: rgba(214, 164, 107, 0.56);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.3), transparent 46%),
        linear-gradient(180deg, rgba(14, 34, 58, 1), rgba(22, 49, 79, 0.98));
    color: #ffffff;
    box-shadow: 0 18px 32px rgba(16, 36, 58, 0.22);
}

.product-secondary-btn {
    border-color: rgba(20, 36, 58, 0.1);
    background: rgba(255, 255, 255, 0.92);
    color: #10243c;
    font-weight: 600;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.08);
}

.product-secondary-btn:hover,
.product-secondary-btn:focus-visible {
    border-color: rgba(77, 131, 180, 0.28);
    background: rgba(247, 250, 252, 1);
    color: #10243c;
    box-shadow: 0 14px 24px rgba(16, 36, 58, 0.12);
}

.product-accent-btn {
    border-color: rgba(235, 181, 106, 0.52);
    background:
        radial-gradient(circle at top right, rgba(255, 244, 212, 0.38), transparent 42%),
        linear-gradient(135deg, #be6825 0%, #df9c45 48%, #f4c87d 100%);
    color: #10243c;
    font-weight: 700;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.34),
        0 18px 32px rgba(190, 104, 37, 0.24);
}

.product-accent-btn:hover,
.product-accent-btn:focus-visible {
    border-color: rgba(240, 191, 118, 0.72);
    color: #10243c;
    filter: saturate(1.06) brightness(1.02);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.38),
        0 22px 36px rgba(190, 104, 37, 0.3);
}

.product-danger-btn {
    border-color: rgba(217, 92, 92, 0.2);
    background: linear-gradient(180deg, rgba(191, 72, 72, 0.96), rgba(170, 58, 58, 0.94));
    color: #fff8f8;
    font-weight: 700;
    box-shadow: 0 10px 20px rgba(191, 72, 72, 0.18);
}

.product-danger-btn:hover,
.product-danger-btn:focus-visible {
    border-color: rgba(217, 92, 92, 0.34);
    background: linear-gradient(180deg, rgba(176, 60, 60, 1), rgba(155, 48, 48, 0.98));
    color: #ffffff;
    box-shadow: 0 14px 24px rgba(191, 72, 72, 0.24);
}

.product-dock-btn,
.product-inline-btn,
.product-sync-btn,
.product-table-btn {
    min-height: 36px;
    border-radius: 12px;
    font-weight: 600;
    padding-inline: 14px;
}

.product-inline-btn,
.product-sync-btn,
.product-table-btn {
    box-shadow: 0 8px 18px rgba(16, 36, 58, 0.1);
}

.product-inline-btn {
    background-clip: padding-box;
}

.product-sync-btn {
    min-width: 108px;
    border-color: rgba(77, 131, 180, 0.2);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(242, 247, 252, 0.94));
    color: #17324f;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.75),
        0 10px 22px rgba(16, 36, 58, 0.1);
}

.product-sync-btn:hover,
.product-sync-btn:focus-visible {
    border-color: rgba(77, 131, 180, 0.34);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(236, 244, 251, 0.98));
    color: #10243c;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.8),
        0 14px 26px rgba(16, 36, 58, 0.14);
}

.product-table-btn {
    min-width: 90px;
}

.product-row-btn {
    width: 100%;
    min-height: 34px;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
}

.product-row-btn--edit {
    border-color: rgba(77, 131, 180, 0.26);
    background: linear-gradient(180deg, rgba(24, 54, 86, 0.96), rgba(35, 74, 113, 0.94));
    color: #f7fbff;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.16);
}

.product-row-btn--edit:hover,
.product-row-btn--edit:focus-visible {
    border-color: rgba(77, 131, 180, 0.4);
    background: linear-gradient(180deg, rgba(20, 46, 74, 1), rgba(31, 66, 101, 0.98));
    color: #ffffff;
}

.product-row-btn--copy {
    border-color: rgba(214, 164, 107, 0.32);
    background:
        radial-gradient(circle at top right, rgba(255, 239, 205, 0.3), transparent 42%),
        linear-gradient(135deg, rgba(185, 120, 55, 0.94), rgba(214, 164, 107, 0.92));
    color: #10243c;
    box-shadow: 0 10px 20px rgba(185, 122, 55, 0.18);
}

.product-row-btn--copy:hover,
.product-row-btn--copy:focus-visible {
    border-color: rgba(214, 164, 107, 0.48);
    color: #10243c;
    box-shadow: 0 14px 24px rgba(185, 122, 55, 0.24);
}

.product-row-btn--delete {
    border-color: rgba(217, 92, 92, 0.2);
    background: linear-gradient(180deg, rgba(191, 72, 72, 0.96), rgba(170, 58, 58, 0.94));
    color: #fff8f8;
    box-shadow: 0 10px 20px rgba(191, 72, 72, 0.18);
}

.product-row-btn--delete:hover,
.product-row-btn--delete:focus-visible {
    border-color: rgba(217, 92, 92, 0.34);
    background: linear-gradient(180deg, rgba(176, 60, 60, 1), rgba(155, 48, 48, 0.98));
    color: #ffffff;
}

.button-icon {
    margin-right: 4px;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-textarea__inner) {
    border-radius: 14px;
    box-shadow: 0 0 0 1px rgba(31, 47, 70, 0.08) inset;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-textarea__inner:focus) {
    box-shadow:
        0 0 0 1px #b97837 inset,
        0 0 0 4px rgba(185, 120, 55, 0.12);
}

.product-table {
    margin-top: 0;
    border: 1px solid var(--surface-border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--surface-shadow);
}

:deep(.product-table.el-table) {
    --el-table-border-color: var(--surface-border);
    --el-table-border: 1px solid var(--surface-border);
    --el-table-tr-bg-color: transparent;
    --el-table-row-hover-bg-color: rgba(185, 120, 55, 0.08);
    --el-table-current-row-bg-color: rgba(185, 120, 55, 0.12);
    border-radius: 24px;
    overflow: hidden;
    background: transparent;
}

:deep(.product-table .el-table__inner-wrapper::before) {
    display: none;
}

:deep(.product-table th.el-table__cell) {
    font-weight: 700;
    text-align: center;
}

:deep(.product-table td.el-table__cell),
:deep(.product-table th.el-table__cell.is-leaf) {
    border-bottom-color: var(--surface-border);
}

:deep(.product-table .el-table__body td.el-table__cell) {
    background: transparent;
}

:deep(.product-table .el-table__fixed),
:deep(.product-table .el-table__fixed-right) {
    box-shadow: none;
}

:deep(.product-table .el-table__fixed-body-wrapper td.el-table__cell),
:deep(.product-table .el-table__fixed-header-wrapper th.el-table__cell) {
    background: inherit;
}

.table-light :deep(.product-table .el-table__body tr:hover > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.08) !important;
}

.table-dark :deep(.product-table .el-table__header-wrapper th.el-table__cell) {
    background:
        linear-gradient(180deg, rgba(18, 45, 72, 0.98), rgba(14, 33, 54, 0.96)) !important;
    color: #eef4fb !important;
    border-bottom-color: rgba(255, 255, 255, 0.08) !important;
}

.table-dark :deep(.product-table .el-table__body tr > td.el-table__cell) {
    background: linear-gradient(180deg, rgba(11, 27, 45, 0.92), rgba(9, 23, 38, 0.9)) !important;
    color: #d9e2ef;
    border-bottom-color: rgba(255, 255, 255, 0.06) !important;
}

.table-dark :deep(.product-table .el-table__body tr:nth-child(even) > td.el-table__cell) {
    background: linear-gradient(180deg, rgba(13, 31, 50, 0.94), rgba(10, 24, 41, 0.92)) !important;
}

.table-dark :deep(.product-table .el-table__body tr:hover > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.12), transparent 28%),
        linear-gradient(180deg, rgba(18, 38, 60, 0.98), rgba(12, 29, 48, 0.96)) !important;
}

.table-dark :deep(.product-table .el-table__fixed-body-wrapper tr > td.el-table__cell),
.table-dark :deep(.product-table .el-table__fixed-header-wrapper th.el-table__cell) {
    background: inherit !important;
}

.table-dark :deep(.product-table .el-table__empty-block) {
    background: linear-gradient(180deg, rgba(10, 24, 41, 0.92), rgba(8, 20, 34, 0.9));
}

.table-dark :deep(.product-table .el-table__empty-text) {
    color: #95a7bb;
}

.table-card {
    border: 1px solid var(--surface-border);
    border-radius: 28px;
    background: var(--surface-card);
    box-shadow: var(--surface-shadow);
    padding: 24px;
}

.product-table-shell {
    position: relative;
    transition:
        opacity 0.26s ease,
        transform 0.26s ease,
        filter 0.26s ease;
}

.product-table-shell.is-switching :deep(.product-table) {
    opacity: 0.58;
    transform: translateY(8px) scale(0.995);
    filter: saturate(0.88);
}

.table-loading-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    border-radius: 20px;
    background:
        linear-gradient(135deg, rgba(10, 24, 41, 0.18), rgba(17, 40, 66, 0.12)),
        radial-gradient(circle at top, rgba(214, 164, 107, 0.12), transparent 34%);
    backdrop-filter: blur(8px);
    pointer-events: none;
}

.table-loading-panel {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border: 1px solid rgba(214, 164, 107, 0.24);
    border-radius: 18px;
    background: rgba(12, 28, 46, 0.72);
    box-shadow: 0 18px 34px rgba(9, 22, 37, 0.2);
}

.table-loading-panel p {
    margin: 0;
    color: #eef4fb;
    font-size: 0.92rem;
    letter-spacing: 0.08em;
}

.table-loading-dots {
    display: flex;
    align-items: center;
    gap: 8px;
}

.table-loading-dot {
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(180deg, #f0c998, #d6a46b);
    box-shadow: 0 0 0 4px rgba(214, 164, 107, 0.12);
    animation: productLoadingPulse 1.05s ease-in-out infinite;
}

.table-loading-dot:nth-child(2) {
    animation-delay: 0.14s;
}

.table-loading-dot:nth-child(3) {
    animation-delay: 0.28s;
}

.table-fade-enter-active,
.table-fade-leave-active {
    transition: opacity 0.22s ease;
}

.table-fade-enter-from,
.table-fade-leave-to {
    opacity: 0;
}

.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 18px;
}

.table-header h3 {
    margin-top: 8px;
    color: var(--heading-color);
    font-size: 1.45rem;
    font-weight: 700;
}

.table-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.table-meta span {
    padding: 8px 12px;
    border-radius: 999px;
    color: var(--muted-text);
    font-size: 0.84rem;
    background: var(--surface-muted);
}

.floating-action-dock {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 80;
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 16px 18px;
    border: 1px solid rgba(185, 120, 55, 0.22);
    border-radius: 22px;
    background:
        linear-gradient(135deg, rgba(12, 27, 46, 0.96), rgba(24, 46, 73, 0.94));
    box-shadow:
        0 22px 48px rgba(8, 18, 32, 0.28),
        0 0 0 1px rgba(255, 255, 255, 0.04) inset;
    backdrop-filter: blur(14px);
}

.floating-action-copy {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    color: rgba(255, 248, 235, 0.92);
}

.dock-eyebrow {
    font-size: 0.72rem;
    letter-spacing: 0.18em;
    color: rgba(232, 190, 123, 0.86);
}

.floating-action-copy strong {
    font-size: 1rem;
    color: #fffaf0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.dock-meta {
    color: rgba(255, 248, 235, 0.72);
    font-size: 0.82rem;
}

.floating-action-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
}

.floating-action-buttons :deep(.el-button + .el-button) {
    margin-left: 0;
}

.floating-action-buttons :deep(.el-button) {
    min-height: 42px;
    border-radius: 14px;
    font-weight: 600;
}

.floating-action-clear {
    color: rgba(255, 248, 235, 0.78);
}

.floating-action-clear:hover {
    color: #fffaf0;
}

.action-dock-enter-active,
.action-dock-leave-active {
    transition: opacity 0.22s ease, transform 0.22s ease;
}

.action-dock-enter-from,
.action-dock-leave-to {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
}

:deep(.product-table .el-table__body tr.current-row > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.12) !important;
}

:deep(.product-table .el-table__body tr.current-row:hover > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.16) !important;
}

:deep(.product-table .el-table__body tr.multi-selected-row > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.08) !important;
}

:deep(.product-table .el-table__body tr.multi-selected-row:hover > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.12) !important;
}

:deep(.product-table .el-table__body tr.multi-selected-row > td.selection-column) {
    box-shadow: inset 3px 0 0 rgba(185, 120, 55, 0.9);
}

.table-dark :deep(.product-table .el-table__body tr.current-row > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.16), transparent 28%),
        linear-gradient(180deg, rgba(20, 44, 69, 0.98), rgba(14, 33, 54, 0.96)) !important;
}

.table-dark :deep(.product-table .el-table__body tr.current-row:hover > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.2), transparent 30%),
        linear-gradient(180deg, rgba(23, 49, 77, 1), rgba(16, 37, 61, 0.98)) !important;
}

.table-dark :deep(.product-table .el-table__body tr.multi-selected-row > td.el-table__cell) {
    background:
        linear-gradient(180deg, rgba(18, 38, 60, 0.96), rgba(12, 29, 48, 0.94)) !important;
}

.table-dark :deep(.product-table .el-table__body tr.multi-selected-row:hover > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.1), transparent 28%),
        linear-gradient(180deg, rgba(20, 42, 67, 0.98), rgba(14, 33, 54, 0.96)) !important;
}

.table-dark :deep(.selection-column .el-checkbox__inner) {
    border-color: rgba(155, 176, 198, 0.45);
    background: rgba(10, 24, 41, 0.88);
}

.table-dark :deep(.selection-column .el-checkbox.is-checked .el-checkbox__inner),
.table-dark :deep(.selection-column .el-checkbox.is-indeterminate .el-checkbox__inner) {
    border-color: #d6a46b;
    background: #d6a46b;
}

.pagination-bar {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
}

.pagination-bar :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
}

.pagination-bar :deep(.btn-prev),
.pagination-bar :deep(.btn-next),
.pagination-bar :deep(.el-pager li) {
    transition:
        transform 0.18s ease,
        background-color 0.18s ease,
        color 0.18s ease,
        box-shadow 0.18s ease;
}

.pagination-bar :deep(.btn-prev:hover),
.pagination-bar :deep(.btn-next:hover),
.pagination-bar :deep(.el-pager li:hover) {
    transform: translateY(-1px);
}

.pagination-bar :deep(.el-pager li.is-active) {
    background: linear-gradient(180deg, rgba(190, 104, 37, 0.98), rgba(223, 156, 69, 0.94));
    color: #10243c;
    box-shadow: 0 10px 18px rgba(190, 104, 37, 0.22);
}

.empty-state,
.product-page>div[style*='margin-top: 1rem'] {
    margin-top: 16px;
    padding: 18px 20px;
    border: 1px dashed var(--surface-border);
    border-radius: 18px;
    color: var(--muted-text);
    background: var(--surface-muted);
}

.empty-state strong {
    display: block;
    color: var(--heading-color);
    font-size: 1rem;
    font-weight: 700;
}

.empty-state p {
    margin-top: 8px;
    line-height: 1.7;
}

.empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 14px;
}

.empty-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}

.price-text {
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
}

.price-value {
    color: #d94e4e;
    font-size: 1.2rem;
    font-weight: 700;
}

.stock-text {
    display: inline-flex;
    align-items: center;
}

.stock-value {
    font-size: 1.15rem;
    font-weight: 700;
}

.product-link,
.site-link {
    color: #2f6fa8;
    text-decoration: none;
    font-weight: 500;
}

.product-link:hover,
.site-link:hover {
    text-decoration: underline;
}

.table-dark .product-link,
.table-dark .site-link {
    color: #9bc2ec;
}

.table-dark .product-link:hover,
.table-dark .site-link:hover {
    color: #d8eaff;
}

.barcode-preview {
    display: flex;
    justify-content: center;
    align-items: center;
}

:deep(.no-padding-cell .cell) {
    padding: 0 !important;
}

:deep(.selection-column .cell) {
    padding-left: 4px !important;
    padding-right: 4px !important;
}

:deep(.selection-column .el-checkbox) {
    opacity: 0.28;
    transform: scale(0.9);
    transform-origin: center;
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}

:deep(.product-table .el-table__header-wrapper th.selection-column:hover .el-checkbox),
:deep(.product-table .el-table__body tr:hover td.selection-column .el-checkbox),
:deep(.product-table .el-table__body tr.multi-selected-row td.selection-column .el-checkbox),
:deep(.product-table .el-table__body tr.current-row td.selection-column .el-checkbox),
:deep(.selection-column .el-checkbox.is-checked),
:deep(.selection-column .el-checkbox.is-indeterminate) {
    opacity: 1;
}

.index-text {
    font-size: 12px;
}

.row-action-stack {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    max-width: 76px;
    margin: 0 auto;
}

.row-action-stack :deep(.el-button + .el-button) {
    margin-left: 0;
}

.row-action-btn {
    width: 100%;
}

.product-image-box {
    width: 70px;
    height: 70px;
    margin: 0 auto;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.product-image-button {
    padding: 0;
    border: 1px solid rgba(20, 36, 58, 0.08);
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
}

.product-image-button:hover:not(:disabled) {
    transform: scale(1.03);
    border-color: rgba(47, 111, 168, 0.28);
    box-shadow: 0 10px 24px rgba(20, 36, 58, 0.14);
}

.product-image-button:disabled {
    cursor: default;
}

.product-image-box--clickable {
    position: relative;
}

.product-image-box--clickable::after {
    content: "放大";
    position: absolute;
    right: 8px;
    bottom: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(16, 36, 58, 0.78);
    color: #f5f8fc;
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1;
    pointer-events: none;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-image-fallback {
    font-size: 32px;
    color: #ccc;
}

.image-preview-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.image-preview-full {
    max-width: 100%;
    max-height: min(70vh, 720px);
    border-radius: 20px;
    object-fit: contain;
    box-shadow: 0 18px 36px rgba(20, 36, 58, 0.18);
}

.image-preview-caption {
    color: var(--muted-text);
    text-align: center;
    line-height: 1.6;
}

.gtin-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    width: 100%;
}

.gtin-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.batch-add-dialog {
    overflow: hidden;
}

.stock-item {
    width: 100%;
}

.stock-field {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    max-width: 100%;
}

:deep(.add-product-dialog .el-dialog),
:deep(.product-import-dialog .el-dialog),
:deep(.edit-product-dialog .el-dialog),
:deep(.batch-add-dialog .el-dialog) {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.98);
}

:deep(.add-product-dialog .el-dialog__header),
:deep(.product-import-dialog .el-dialog__header),
:deep(.edit-product-dialog .el-dialog__header),
:deep(.batch-add-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 24px 24px 0;
}

:deep(.add-product-dialog .el-dialog__body),
:deep(.product-import-dialog .el-dialog__body),
:deep(.edit-product-dialog .el-dialog__body),
:deep(.batch-add-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
}

.import-source-group {
    display: inline-flex;
    padding: 6px;
    border-radius: 18px;
    background: rgba(243, 247, 252, 0.96);
    border: 1px solid rgba(20, 36, 58, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.import-source-group :deep(.el-radio-button__inner) {
    min-width: 112px;
    min-height: 42px;
    padding: 0 18px;
    border: 0 !important;
    border-radius: 14px !important;
    background: transparent;
    color: #32465b;
    font-weight: 700;
    line-height: 42px;
    box-shadow: none !important;
    transition:
        transform 0.18s ease,
        background 0.18s ease,
        color 0.18s ease,
        box-shadow 0.18s ease;
}

.import-source-group :deep(.el-radio-button__inner:hover) {
    color: #10243c;
    background: rgba(255, 255, 255, 0.74);
}

.import-source-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background:
        radial-gradient(circle at top right, rgba(255, 244, 212, 0.38), transparent 42%),
        linear-gradient(135deg, #be6825 0%, #df9c45 48%, #f4c87d 100%);
    color: #10243c;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.38),
        0 12px 24px rgba(190, 104, 37, 0.22);
}

.import-source-group :deep(.el-radio-button:first-child .el-radio-button__inner),
.import-source-group :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 14px !important;
}

@media (max-width: 1024px) {
    .title-shell {
        flex-direction: column;
        align-items: flex-start;
    }

    .title-meta {
        width: 100%;
        justify-content: flex-start;
    }

    .filters-group,
    .secondary-row {
        align-items: stretch;
    }

    .button-group {
        margin-left: 0;
    }
}

@media (max-width: 768px) {
    .product-page {
        gap: 16px;
    }

    .titleBar {
        padding: 22px 20px;
    }

    .title-col::after {
        font-size: 0.95rem;
        line-height: 1.65;
    }

    .top-bar {
        padding: 18px;
        gap: 10px;
    }

    .search-input,
    .vendor-select,
    .action-row,
    .button-group,
    .danger-zone {
        width: 100%;
        flex-basis: 100%;
    }

    .floating-action-dock {
        left: 12px;
        right: 12px;
        bottom: 16px;
        flex-direction: column;
        align-items: stretch;
        gap: 14px;
        padding: 16px;
        border-radius: 20px;
    }

    .floating-action-buttons {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .floating-action-clear {
        align-self: flex-end;
    }

    .action-row,
    .button-group,
    .empty-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .action-row :deep(.el-button),
    .button-group :deep(.el-button),
    .empty-actions :deep(.el-button) {
        width: 100%;
        min-width: 0;
    }

    .table-card {
        padding: 18px;
    }

    .table-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .stock-field {
        flex-direction: column;
        align-items: stretch;
    }

    .stock-field .el-button {
        width: 100%;
    }
}

@media (max-width: 640px) {

    .action-row,
    .button-group,
    .empty-actions {
        grid-template-columns: 1fr;
    }

    .gtin-actions {
        width: 100%;
    }

    .gtin-row .el-button,
    .gtin-actions .el-button {
        flex: 1;
    }

    .pagination-bar {
        justify-content: center;
    }

    .pagination-bar :deep(.el-pagination) {
        justify-content: center;
    }
}

@keyframes productLoadingPulse {
    0%,
    100% {
        transform: translateY(0) scale(0.92);
        opacity: 0.56;
    }

    50% {
        transform: translateY(-4px) scale(1);
        opacity: 1;
    }
}
</style>
