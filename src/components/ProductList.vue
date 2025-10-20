<template>
    <div>
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>商品列表</h2>
            </el-col>
        </el-row>

        <!-- 查詢 + 按鈕區 -->
        <div class="top-bar">
            <el-input v-model="searchQuery" placeholder="搜尋商品名稱或編號" clearable class="search-input" />

            <div class="button-group">
                <el-button type="primary" @click="toggleEditMode">
                    {{ editMode ? "退出編輯模式" : "進入編輯模式" }}
                </el-button>
                <el-button type="success" @click="showAddDialog = true">
                    新增商品
                </el-button>
                <el-button type="warning" @click="showBatchDialog = true">
                    批量新增商品
                </el-button>
                <el-button type="danger" @click="deleteSelectedProducts">
                    刪除勾選商品
                </el-button>
            </div>
        </div>

        <!-- 商品列表表格 -->
        <el-table :data="pagedProducts" style="width: 100%" border :class="tableThemeClass"
            :header-cell-style="{ background: `var(--table-header-bg)`, color: `var(--table-header-text)` }"
            @selection-change="handleSelectionChange" ref="productTable">

            <!-- checkbox欄位 -->
            <el-table-column v-if="editMode" type="selection" width="55" align="center">
            </el-table-column>

            <!-- 序號欄位 -->
            <el-table-column label="#" width="50" align="center">
                <template #default="scope">
                    {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
                </template>
            </el-table-column>

            <!-- 操作欄整欄隨編輯模式顯示 -->
            <el-table-column v-if="editMode" label="操作" width="210">
                <template #default="{ row }">
                    <div style="display: flex;">
                        <el-button type="primary" size="small" @click="openEditDialog(row)">編輯</el-button>
                        <el-button type="warning" size="small" @click="copyProduct(row)">複製</el-button>
                        <el-button type="danger" size="small" @click="deleteProduct(row)">刪除</el-button>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="name" label="商品名稱" min-width="140">
                <template #default="{ row }">
                    <template v-if="row.website">
                        <a :href="row.website" target="_blank" rel="noopener noreferrer"
                            style="color: #409eff; font-weight: 500; text-decoration: underline;">
                            {{ row.name }}
                        </a>
                    </template>
                    <template v-else>
                        {{ row.name }}
                    </template>
                </template>
            </el-table-column>

            <el-table-column prop="price" label="定價" min-width="70" />
            <el-table-column prop="sellingPrice" label="售價" min-width="70">
                <template #default="{ row }">
                    <span style="font-weight: bold;">{{ row.sellingPrice }} 元</span>
                </template>
            </el-table-column>
            <el-table-column prop="cost" label="成本" min-width="70" />
            <el-table-column prop="stock" label="庫存數量" min-width="100" />
            <el-table-column prop="code" label="商品編號" min-width="140" />
            <el-table-column prop="supplierName" label="廠商名稱" min-width="120" />
            <el-table-column prop="supplierCode" label="廠商編號" min-width="120" />
            <el-table-column prop="website" label="網站" min-width="100">
                <template #default="{ row }">
                    <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer"
                        style="color: #409eff; text-decoration: underline;">連結</a>
                </template>
            </el-table-column>
            <el-table-column prop="note" label="備註" min-width="120" />
            <el-table-column prop="createdBy" label="創建者" min-width="100" />
            <el-table-column prop="updatedBy" label="更新者" min-width="100" />
            <el-table-column prop="created" label="新增時間" min-width="190" :formatter="formatDate" />
            <el-table-column prop="updated" label="更新時間" min-width="190" :formatter="formatDate" />
        </el-table>

        <!-- 分頁 -->
        <el-pagination background layout="prev, pager, next, sizes, total" :total="totalProducts" :page-size="pageSize"
            :current-page.sync="currentPage" :page-sizes="[10, 20, 50, 100]" @size-change="handlePageSizeChange"
            @current-change="handlePageChange" style="margin-top: 20px; text-align: right;">
        </el-pagination>

        <div v-if="!filteredProducts.length" style="margin-top: 1rem">暫無商品資料</div>

        <!-- 新增商品對話框 -->
        <el-dialog title="新增商品" v-model="showAddDialog" :width="'90%'" class="add-product-dialog">
            <el-form :model="newProduct" :rules="rules" ref="addForm" label-width="120px">
                <el-form-item label="商品編號" prop="code">
                    <div style="display: flex; gap: 10px;">
                        <el-input v-model="newProduct.code" placeholder="例如：A001 或條碼號" />
                        <el-button type="primary" @click="showScannerDialog = true">掃描</el-button>
                    </div>
                </el-form-item>

                <el-form-item label="商品名稱" prop="name">
                    <el-input v-model="newProduct.name" />
                </el-form-item>

                <el-form-item label="定價" prop="price">
                    <el-input type="number" min="0" v-model.number="newProduct.price" />
                </el-form-item>

                <el-form-item label="售價" prop="sellingPrice">
                    <el-input type="number" min="0" v-model.number="newProduct.sellingPrice" />
                </el-form-item>

                <el-form-item label="成本" prop="cost">
                    <el-input type="number" min="0" v-model.number="newProduct.cost" />
                </el-form-item>

                <el-form-item label="庫存" prop="stock">
                    <el-input-number :min="0" v-model.number="newProduct.stock" />
                </el-form-item>

                <el-form-item label="廠商名稱" prop="supplierName">
                    <el-input v-model="newProduct.supplierName" />
                </el-form-item>

                <el-form-item label="廠商編號" prop="supplierCode">
                    <div style="display: flex; gap: 10px;">
                        <el-input v-model="newProduct.supplierCode" placeholder="請輸入廠商編號" />
                        <el-button type="primary" @click="findVendorByCode">查詢</el-button>
                    </div>
                </el-form-item>

                <!-- 🆕 網站 -->
                <el-form-item label="網站">
                    <el-input v-model="newProduct.website" placeholder="請輸入網站連結 (例如：https://example.com)" />
                </el-form-item>

                <!-- 🆕 備註 -->
                <el-form-item label="備註">
                    <el-input v-model="newProduct.note" placeholder="請輸入備註" type="textarea" rows="2" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="submitAddProduct">新增</el-button>
            </template>
        </el-dialog>


        <!-- 編輯商品彈窗 -->
        <el-dialog title="編輯商品" v-model="showEditDialog" :width="'90%'" class="edit-product-dialog">
            <el-form v-if="editProduct" :model="editProduct" label-width="120px">
                <el-form-item label="商品編號">
                    <el-input v-model="editProduct.code" />
                </el-form-item>

                <el-form-item label="商品名稱">
                    <el-input v-model="editProduct.name" />
                </el-form-item>

                <el-form-item label="定價">
                    <el-input type="number" min="0" v-model.number="editProduct.price" />
                </el-form-item>

                <el-form-item label="售價" prop="sellingPrice">
                    <el-input type="number" min="0" v-model.number="editProduct.sellingPrice" />
                </el-form-item>

                <el-form-item label="成本">
                    <el-input type="number" min="0" v-model.number="editProduct.cost" />
                </el-form-item>

                <el-form-item label="庫存">
                    <el-input-number :min="0" v-model.number="editProduct.stock" />
                </el-form-item>

                <el-form-item label="廠商名稱">
                    <el-input v-model="editProduct.supplierName" />
                </el-form-item>

                <el-form-item label="廠商編號">
                    <el-input v-model="editProduct.supplierCode" />
                </el-form-item>

                <el-form-item label="網站">
                    <el-input v-model="editProduct.website" placeholder="請輸入網站連結" />
                </el-form-item>

                <el-form-item label="備註">
                    <el-input v-model="editProduct.note" type="textarea" rows="2" />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button type="primary" @click="saveEditProduct">保存</el-button>
            </template>
        </el-dialog>

        <!-- 🧩 批量新增商品彈窗 -->
        <el-dialog title="批量新增商品" v-model="showBatchDialog" :width="'90%'" class="batch-add-dialog">
            <el-form :model="batchBase" :rules="batchRules" ref="batchForm" label-width="120px"
                style="margin-bottom: 20px;">
                <el-form-item label="定價" prop="price">
                    <el-input type="number" min="0" v-model.number="batchBase.price" />
                </el-form-item>

                <el-form-item label="售價" prop="sellingPrice">
                    <el-input type="number" min="0" v-model.number="batchBase.sellingPrice" />
                </el-form-item>

                <el-form-item label="成本" prop="cost">
                    <el-input type="number" min="0" v-model.number="batchBase.cost" />
                </el-form-item>

                <el-form-item label="庫存" prop="stock">
                    <el-input-number :min="0" v-model.number="batchBase.stock" />
                </el-form-item>

                <el-form-item label="廠商名稱">
                    <el-input v-model="batchBase.supplierName" />
                </el-form-item>

                <el-form-item label="廠商編號">
                    <div style="display: flex; gap: 10px;">
                        <el-input v-model="batchBase.supplierCode" placeholder="請輸入廠商編號" />
                        <el-button type="primary" @click="findVendorByCodeBatch">查詢</el-button>
                    </div>
                </el-form-item>

                <el-form-item label="網站">
                    <el-input v-model="batchBase.website" placeholder="請輸入網站連結" />
                </el-form-item>

                <el-form-item label="備註">
                    <el-input v-model="batchBase.note" type="textarea" rows="2" />
                </el-form-item>
            </el-form>

            <h4 style="margin-bottom: 10px;">商品清單</h4>
            <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
                <el-button type="primary" @click="addBatchRow">新增一列</el-button>
            </div>

            <el-table :data="batchList" border style="width: 100%">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="code" label="商品編號" width="200">
                    <template #default="{ row }">
                        <el-input v-model="row.code" placeholder="商品編號" />
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="商品名稱">
                    <template #default="{ row }">
                        <el-input v-model="row.name" placeholder="商品名稱" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ $index }">
                        <el-button type="danger" size="small" @click="removeBatchRow($index)">刪除</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <template #footer>
                <el-button @click="showBatchDialog = false">取消</el-button>
                <el-button type="primary" @click="submitBatchProducts">提交</el-button>
            </template>
        </el-dialog>


        <!-- 掃描器彈窗 -->
        <el-dialog title="掃描條碼" v-model="showScannerDialog" width="400px" destroy-on-close>
            <Scanner @onScan="handleScanResult" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { db } from "@/firebase";
import { ref as dbRef, onValue, update, push, remove, get, child } from "firebase/database";
import { ElMessage, ElMessageBox } from "element-plus";
import Scanner from "@/components/Scanner.vue";
import { useThemeStore } from "@/stores/theme";
import { useAuth } from "@/composables/useAuth";

const themeStore = useThemeStore();
const tableThemeClass = computed(() => (themeStore.isDarkTheme ? "table-dark" : "table-light"));
const { user } = useAuth();

interface Product {
    id: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    supplierName: string;
    supplierCode: string;
    website?: string;
    note?: string;
    created: number;
    updated?: number;
    createdBy?: string;
    updatedBy?: string;
}

const products = ref<Record<string, Product>>({});
const editMode = ref(false);
const searchQuery = ref("");

// 新增商品
const showAddDialog = ref(false);
const showScannerDialog = ref(false);
const addForm = ref<any>(null);

const newProduct = ref<Omit<Product, "id" | "createdBy" | "updatedBy">>({
    code: "",
    name: "",
    price: 0,
    sellingPrice: 0,
    cost: 0,
    stock: 0,
    supplierName: "",
    supplierCode: "",
    website: "",
    note: "",
    created: Date.now(),
});

// 驗證規則
const rules = {
    code: [{ required: true, message: "請輸入商品編號", trigger: "blur" }],
    name: [{ required: true, message: "請輸入商品名稱", trigger: "blur" }],
    price: [{ required: true, message: "請輸入定價", trigger: "blur" }],
    sellingPrice: [{ required: true, message: "請輸入售價", trigger: "blur" }],
    cost: [{ required: true, message: "請輸入成本", trigger: "blur" }],
    stock: [{ required: true, message: "請輸入庫存", trigger: "change" }],
    // supplierName: [{ required: true, message: "請輸入廠商名稱", trigger: "blur" }],
    // supplierCode: [{ required: true, message: "請輸入廠商編號", trigger: "blur" }],
};

// 編輯彈窗
const showEditDialog = ref(false);
const editProduct = ref<Product | null>(null);

// 掃描條碼
function handleScanResult(result: string) {
    newProduct.value.code = result;
    showScannerDialog.value = false;
}

function getCurrentUserDisplayName(): string | undefined {
    return user.value?.displayName ?? undefined;
}

function fetchProducts() {
    const productsRef = dbRef(db, "products");
    onValue(productsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const result: Record<string, Product> = {};
        for (const [id, p] of Object.entries(data)) {
            const prod = p as Omit<Product, "id">;
            result[id] = { id, ...prod };
        }
        products.value = result;
    });
}

const sortedProductsArray = computed(() => Object.values(products.value).sort((a, b) => b.created - a.created));
const filteredProducts = computed(() => {
    if (!searchQuery.value) return sortedProductsArray.value;
    return sortedProductsArray.value.filter((p) =>
        [p.name, p.code].some((f) => f?.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

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

// 單筆更新
async function saveEditProduct() {
    if (!editProduct.value) return;
    const now = Date.now();
    const currentUser = getCurrentUserDisplayName();

    // 新增或複製商品
    if (!editProduct.value.id) {
        const codeExists = await checkProductCodeExists(editProduct.value.code);
        if (codeExists) {
            ElMessage.warning("商品編號已存在，請使用不同的編號");
            return;
        }

        const productsRef = dbRef(db, "products");
        const newRef = push(productsRef);
        const id = newRef.key!;
        update(newRef, { ...editProduct.value, id, created: now, createdBy: currentUser })
            .then(() => {
                ElMessage.success(`已新增商品：${editProduct.value?.name}`);
                showEditDialog.value = false;
                editProduct.value = null;
            })
            .catch(console.error);

    } else {
        // 更新商品
        const productRef = dbRef(db, `products/${editProduct.value.id}`);
        const updateData = {
            name: editProduct.value.name || "",
            code: editProduct.value.code || "",
            price: editProduct.value.price ?? 0,
            sellingPrice: editProduct.value.sellingPrice ?? 0,
            cost: editProduct.value.cost ?? 0,
            stock: editProduct.value.stock ?? 0,
            supplierName: editProduct.value.supplierName || "",
            supplierCode: editProduct.value.supplierCode || "",
            website: editProduct.value.website || "",
            note: editProduct.value.note || "",
            updated: now,
            updatedBy: currentUser,
        };
        update(productRef, updateData)
            .then(() => {
                showEditDialog.value = false;
                editProduct.value = null;
            })
            .catch(console.error);
    }
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
        .then(() => {
            const productRef = dbRef(db, `products/${product.id}`);
            remove(productRef)
                .then(() => ElMessage.success("刪除成功"))
                .catch(console.error);
        })
        .catch(() => { });
}



// 新增商品（必填驗證）
// 新增商品（必填驗證 + 編號檢查）
async function submitAddProduct() {
    addForm.value.validate(async (valid: boolean) => {
        if (!valid) {
            ElMessage.warning("請完整填寫所有欄位");
            return;
        }

        // 🔍 檢查商品編號是否已存在
        const codeExists = await checkProductCodeExists(newProduct.value.code);
        if (codeExists) {
            ElMessage.error(`商品編號「${newProduct.value.code}」已存在，請修改後再新增`);
            return;
        }

        // 新增商品
        addProduct();
    });
}

async function checkProductCodeExists(code: string): Promise<boolean> {
    const productsRef = dbRef(db, "products");
    const snapshot = await get(productsRef);
    if (!snapshot.exists()) return false;

    const productsData = snapshot.val() as Record<string, Product>;
    return Object.values(productsData).some((p) => p.code === code);
}


function copyProduct(product: Product) {
    // 複製原商品資料，但 id 先不帶，名稱加上 "(複製)"
    editProduct.value = {
        ...product,
        id: undefined, // 新增時 Firebase 會自動生成 id
        name: `${product.name} (複製)`,
        created: Date.now(),
        createdBy: getCurrentUserDisplayName(),
    } as unknown as Product;

    showEditDialog.value = true; // 顯示編輯彈窗
}

function addProduct() {
    const currentUser = getCurrentUserDisplayName();
    const productsRef = dbRef(db, "products");
    const productData = { ...newProduct.value, created: Date.now(), createdBy: currentUser };
    const newRef = push(productsRef);
    const id = newRef.key!;
    update(newRef, { ...productData, id })
        .then(() => {
            showAddDialog.value = false;
            newProduct.value = {
                code: "",
                name: "",
                price: 0,
                sellingPrice: 0,
                cost: 0,
                stock: 0,
                supplierName: "",
                supplierCode: "",
                website: "",
                note: "",
                created: Date.now(),
            };
        })
        .catch(console.error);
}

interface Vendor {
    vendorId: string;
    vendorName: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: number;
    updatedAt?: number;
}

// 查詢廠商名稱
async function findVendorByCode() {
    const code = newProduct.value.supplierCode.trim();
    if (!code) {
        ElMessage.warning("請先輸入廠商編號");
        return;
    }

    const vendorsRef = dbRef(db);
    const snapshot = await get(child(vendorsRef, "vendors"));

    if (!snapshot.exists()) {
        ElMessage.error("目前沒有任何廠商資料");
        return;
    }

    const vendors = snapshot.val() as Record<string, Vendor>; // ✅ 明確型別
    const matched = Object.values(vendors).find(
        (v) => v.vendorId?.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
        newProduct.value.supplierName = matched.vendorName;
        ElMessage.success(`已找到廠商：${matched.vendorName}`);
    } else {
        newProduct.value.supplierName = "";
        ElMessage.warning("找不到對應的廠商");
    }
}

// 🧩 批量新增商品
const showBatchDialog = ref(false);
const batchBase = ref({
    price: 0,
    sellingPrice: 0,
    cost: 0,
    stock: 0,
    supplierName: "",
    supplierCode: "",
    website: "",
    note: "",
});
const batchList = ref<{ code: string; name: string }[]>([]);

const batchForm = ref<any>(null);

const batchRules = {
    price: [{ required: true, message: "請輸入定價", trigger: "blur" }],
    sellingPrice: [{ required: true, message: "請輸入售價", trigger: "blur" }],
    cost: [{ required: true, message: "請輸入成本", trigger: "blur" }],
    stock: [{ required: true, message: "請輸入庫存", trigger: "change" }],
};


function addBatchRow() {
    batchList.value.push({ code: "", name: "" });
}

function removeBatchRow(index: number) {
    batchList.value.splice(index, 1);
}

async function findVendorByCodeBatch() {
    const code = batchBase.value.supplierCode.trim();
    if (!code) {
        ElMessage.warning("請先輸入廠商編號");
        return;
    }

    const vendorsRef = dbRef(db);
    const snapshot = await get(child(vendorsRef, "vendors"));
    if (!snapshot.exists()) {
        ElMessage.error("目前沒有任何廠商資料");
        return;
    }

    const vendors = snapshot.val() as Record<string, Vendor>;
    const matched = Object.values(vendors).find(
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
    batchForm.value.validate(async (valid: boolean) => {
        if (!valid) {
            ElMessage.warning("請完整填寫批量新增的基本欄位");
            return;
        }

        if (!batchList.value.length) {
            ElMessage.warning("請至少新增一筆商品");
            return;
        }

        const currentUser = getCurrentUserDisplayName();
        const productsRef = dbRef(db, "products");
        const now = Date.now();

        // 先抓現有商品資料以檢查重複
        const snapshot = await get(productsRef);
        const existingProducts = snapshot.exists() ? (snapshot.val() as Record<string, Product>) : {};
        const existingCodes = new Set(Object.values(existingProducts).map(p => p.code));

        // 找出所有輸入中重複的編號
        const duplicateCodes: string[] = [];
        for (const item of batchList.value) {
            if (!item.code || !item.name) continue;
            if (existingCodes.has(item.code)) {
                duplicateCodes.push(item.code);
            }
        }

        // 🚫 若有重複，不送出
        if (duplicateCodes.length > 0) {
            ElMessage.error(`以下商品編號已存在，請修改後再提交：${duplicateCodes.join(", ")}`);
            return;
        }

        // 檢查是否至少有一筆完整商品
        const validList = batchList.value.filter(item => item.code && item.name);
        if (!validList.length) {
            ElMessage.warning("請至少填寫一筆完整商品（編號與名稱）");
            return;
        }

        // 組合資料
        const updates: Record<string, Product> = {};
        for (const item of validList) {
            const newRef = push(productsRef);
            const id = newRef.key!;
            updates[id] = {
                id,
                code: item.code,
                name: item.name,
                price: batchBase.value.price,
                sellingPrice: batchBase.value.sellingPrice,
                cost: batchBase.value.cost,
                stock: batchBase.value.stock,
                supplierName: batchBase.value.supplierName,
                supplierCode: batchBase.value.supplierCode,
                website: batchBase.value.website,
                note: batchBase.value.note,
                created: now,
                createdBy: currentUser,
            };
        }

        try {
            await update(productsRef, updates);
            ElMessage.success(`成功新增 ${validList.length} 筆商品`);
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
    });
}

// 用於存放已勾選的商品
const selectedProducts = ref<Product[]>([]);
const productTable = ref<any>(null);

// 監聽勾選變化
function handleSelectionChange(val: Product[]) {
    selectedProducts.value = val;
}

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
                const updates: Record<string, null> = {};
                selectedProducts.value.forEach((p) => {
                    if (p.id) updates[p.id] = null; // Firebase 刪除
                });

                await update(dbRef(db, "products"), updates);
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

// 分頁控制
const currentPage = ref(1);
const pageSize = ref(10); // 每頁顯示數量，可修改
const totalProducts = computed(() => filteredProducts.value.length);

// 計算分頁後要顯示的資料
const pagedProducts = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    const end = start + pageSize.value;
    return filteredProducts.value.slice(start, end);
});

// 分頁事件
function handlePageChange(page: number) {
    currentPage.value = page;
}

function handlePageSizeChange(size: number) {
    pageSize.value = size;
    currentPage.value = 1; // 重新回到第1頁
}

onMounted(fetchProducts);
</script>

<style scoped>
.titleBar {
    margin: 0 0 10px 0;
}

.title-col {
    text-align: left;
}

.title-col h2 {
    margin: 0;
    font-weight: 600;
}

.top-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 1rem;
}

.search-input {
    flex: 1;
    min-width: 150px;
    max-width: 300px;
}

.button-group {
    display: flex;
}

.batch-dialog .el-table th,
.batch-dialog .el-table td {
    text-align: center;
}
</style>
