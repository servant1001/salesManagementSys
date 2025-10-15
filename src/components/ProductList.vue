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
                    {{ editMode ? "完成編輯模式" : "編輯" }}
                </el-button>
                <el-button type="success" @click="showAddDialog = true">
                    新增商品
                </el-button>
            </div>
        </div>

        <!-- 商品列表表格 -->
        <el-table :data="filteredProducts" style="width: 100%" border :class="tableThemeClass"
            :header-cell-style="{ background: `var(--table-header-bg)`, color: `var(--table-header-text)` }">

            <!-- 操作欄整欄隨編輯模式顯示 -->
            <el-table-column v-if="editMode" label="操作" fixed="left" width="150">
                <template #default="{ row }">
                    <div style="display: flex; gap: 8px;">
                        <el-button type="primary" size="small" @click="openEditDialog(row)">編輯</el-button>
                        <el-button type="danger" size="small" @click="deleteProduct(row)">刪除</el-button>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="name" label="商品名稱" min-width="140" />
            <el-table-column prop="price" label="定價" min-width="60" />
            <el-table-column prop="sellingPrice" label="售價" min-width="60">
                <template #default="{ row }">
                    <span style="font-weight: bold;">{{ row.sellingPrice }} 元</span>
                </template>
            </el-table-column>
            <el-table-column prop="cost" label="成本" min-width="60" />
            <el-table-column prop="stock" label="庫存數量" min-width="100" />
            <el-table-column prop="code" label="商品編號" min-width="140" />
            <el-table-column prop="supplierName" label="廠商名稱" min-width="120" />
            <el-table-column prop="supplierCode" label="廠商編號" min-width="120" />
            <el-table-column prop="createdBy" label="創建者" min-width="100" />
            <el-table-column prop="updatedBy" label="更新者" min-width="100" />
            <el-table-column prop="created" label="新增時間" min-width="190" :formatter="formatDate" />
            <el-table-column prop="updated" label="更新時間" min-width="190" :formatter="formatDate" />
        </el-table>

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
                    <el-input v-model="newProduct.supplierCode" />
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
            </el-form>

            <template #footer>
                <el-button @click="showEditDialog = false">取消</el-button>
                <el-button type="primary" @click="saveEditProduct">保存</el-button>
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
import { ref as dbRef, onValue, update, push, remove } from "firebase/database";
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

function getCurrentUserDisplayName() {
    return user.value?.displayName;
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
function saveEditProduct() {
    if (!editProduct.value) return;
    const now = Date.now();
    const currentUser = getCurrentUserDisplayName();
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
function submitAddProduct() {
    addForm.value.validate((valid: boolean) => {
        if (!valid) {
            ElMessage.warning("請完整填寫所有欄位");
            return;
        }
        addProduct();
    });
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
                created: Date.now(),
            };
        })
        .catch(console.error);
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
</style>
