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
                    {{ editMode ? "編輯完成" : "編輯" }}
                </el-button>
                <el-button type="success" @click="showAddDialog = true">
                    新增商品
                </el-button>
            </div>
        </div>


        <!-- 商品列表表格 -->
        <el-table :data="filteredProducts" style="width: 100%" border :class="tableThemeClass"
            :header-cell-style="{ background: `var(--table-header-bg)`, color: `var(--table-header-text)` }">

            <el-table-column prop="name" label="商品名稱" width="140">
                <template #default="{ row }">
                    <el-input v-if="editMode" v-model="editableProducts[row.id]!.name" />
                    <span v-else>{{ row.name }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="price" label="定價" width="60">
                <template #default="{ row }">
                    <el-input v-if="editMode" type="number" min="0" v-model.number="editableProducts[row.id]!.price" />
                    <span v-else>{{ row.price }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="cost" label="成本" width="60">
                <template #default="{ row }">
                    <el-input v-if="editMode" type="number" min="0" v-model.number="editableProducts[row.id]!.cost" />
                    <span v-else>{{ row.cost }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="stock" label="庫存數量" width="100">
                <template #default="{ row }">
                    <el-input-number v-if="editMode" :min="0" style="width: 100px;"
                        v-model.number="editableProducts[row.id]!.stock" />
                    <span v-else>{{ row.stock }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="code" label="商品編號" width="140">
                <template #default="{ row }">
                    <el-input v-if="editMode" v-model="editableProducts[row.id]!.code" />
                    <span v-else>{{ row.code }}</span>
                </template>
            </el-table-column>

            <el-table-column prop="created" label="新增時間" width="190" :formatter="formatDate" />
            <el-table-column prop="updated" label="更新時間" width="190" :formatter="formatDate" />
        </el-table>

        <div v-if="!filteredProducts.length" style="margin-top: 1rem">暫無商品資料</div>

        <!-- ✅ 新增商品對話框 -->
        <el-dialog title="新增商品" v-model="showAddDialog" :width="'90%'">
            <el-form :model="newProduct">
                <el-form-item label="商品編號" :label-width="80">
                    <div style="display: flex; gap: 10px;">
                        <el-input v-model="newProduct.code" placeholder="例如：A001 或條碼號" />
                        <el-button type="primary" @click="showScannerDialog = true">掃描</el-button>
                    </div>
                </el-form-item>
                <el-form-item label="商品名稱" :label-width="80">
                    <el-input v-model="newProduct.name" />
                </el-form-item>
                <el-form-item label="定價" :label-width="80">
                    <el-input type="number" min="0" v-model.number="newProduct.price" />
                </el-form-item>
                <el-form-item label="成本" :label-width="80">
                    <el-input type="number" min="0" v-model.number="newProduct.cost" />
                </el-form-item>
                <el-form-item label="庫存" :label-width="80">
                    <el-input-number :min="0" v-model.number="newProduct.stock" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="addProduct">新增</el-button>
            </template>
        </el-dialog>

        <!-- ✅ 掃描器彈窗 -->
        <el-dialog title="掃描條碼" v-model="showScannerDialog" width="400px" destroy-on-close>
            <Scanner @onScan="handleScanResult" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { db } from "@/firebase";
import { ref as dbRef, onValue, update, push } from "firebase/database";
import Scanner from "@/components/Scanner.vue"; // ✅ 掃描元件
import { useThemeStore } from "@/stores/theme"; // ✅ 引入 Pinia 主題 store

const themeStore = useThemeStore(); // ✅ 使用主題 store

// 根據主題動態套用表格樣式
const tableThemeClass = computed(() => {
    return themeStore.isDarkTheme ? "table-dark" : "table-light";
});

interface Product {
    id: string;
    code: string;
    name: string;
    price: number;
    cost: number;
    stock: number;
    created: number;
    updated?: number;
}

const products = ref<Record<string, Product>>({});
const editableProducts = ref<Record<string, Product>>({});
const editMode = ref(false);
const searchQuery = ref("");

// 新增商品對話框
const showAddDialog = ref(false);
const showScannerDialog = ref(false); // ✅ 掃描彈窗控制

const newProduct = ref<Omit<Product, "id">>({
    code: "",
    name: "",
    price: 0,
    cost: 0,
    stock: 0,
    created: Date.now(),
});

// ✅ 掃描結果回傳
function handleScanResult(result: string) {
    newProduct.value.code = result;
    showScannerDialog.value = false;
}

// 讀取資料
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
        editableProducts.value = {};
        for (const [id, prod] of Object.entries(result)) {
            editableProducts.value[id] = { ...prod };
        }
    });
}

// 排序
const sortedProductsArray = computed(() => {
    const list = editMode.value ? Object.values(editableProducts.value) : Object.values(products.value);
    return list.sort((a, b) => b.created - a.created);
});

// 搜尋
const filteredProducts = computed(() => {
    if (!searchQuery.value) return sortedProductsArray.value;
    return sortedProductsArray.value.filter((p) =>
        [p.name, p.code].some((f) => f.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );
});

function formatDate(row: Product, column?: any) {
    const timestamp = column?.property === "updated" ? row.updated : row.created;
    return timestamp ? new Date(timestamp).toLocaleString() : "";
}

function toggleEditMode() {
    if (editMode.value) saveAllChanges();
    editMode.value = !editMode.value;
    for (const [id, product] of Object.entries(products.value)) {
        if (!editableProducts.value[id]) editableProducts.value[id] = { ...product };
    }
}

function saveAllChanges() {
    const now = Date.now();
    for (const [id, product] of Object.entries(editableProducts.value)) {
        const productRef = dbRef(db, `products/${id}`);
        update(productRef, { ...product, updated: now }).catch(console.error);
    }
    products.value = JSON.parse(JSON.stringify(editableProducts.value));
}

function addProduct() {
    if (!newProduct.value.name) return;
    const productsRef = dbRef(db, "products");
    const productData = { ...newProduct.value, created: Date.now() };
    const newRef = push(productsRef);
    const id = newRef.key!;
    update(newRef, { ...productData, id })
        .then(() => {
            showAddDialog.value = false;
            newProduct.value = { code: "", name: "", price: 0, cost: 0, stock: 0, created: Date.now() };
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
    text-align: center;
    /* 水平置中 */
}

.title-col h2 {
    margin: 0;
    /* 去掉多餘 margin */
    font-weight: 600;
    /* 可選：字體粗細 */
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
