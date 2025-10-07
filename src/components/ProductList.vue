<template>
    <div>
        <h2>商品列表</h2>

        <!-- 查詢輸入框 -->
        <div style="margin-bottom: 1rem; text-align: center;">
            <el-input v-model="searchQuery" placeholder="搜尋商品名稱" clearable style="width: 300px" />
        </div>

        <!-- 編輯模式 & 新增商品按鈕 -->
        <div style="margin-bottom: 1rem; text-align: center; display: flex; justify-content: center; gap: 10px;">
            <el-button type="primary" @click="toggleEditMode">
                {{ editMode ? "編輯完成" : "編輯" }}
            </el-button>
            <el-button type="success" @click="showAddDialog = true">
                新增商品
            </el-button>
        </div>

        <!-- 商品列表表格 -->
        <el-table :data="filteredProducts" style="width: 100%" stripe border>
            <!-- 商品名稱 -->
            <el-table-column prop="name" label="商品名稱">
                <template #default="{ row }">
                    <el-input v-if="editMode" v-model="editableProducts[row.id]!.name" />
                    <span v-else>{{ row.name }}</span>
                </template>
            </el-table-column>

            <!-- 定價 -->
            <el-table-column prop="price" label="定價">
                <template #default="{ row }">
                    <el-input v-if="editMode" type="number" min="0" v-model.number="editableProducts[row.id]!.price" />
                    <span v-else>{{ row.price }}</span>
                </template>
            </el-table-column>

            <!-- 成本 -->
            <el-table-column prop="cost" label="成本">
                <template #default="{ row }">
                    <el-input v-if="editMode" type="number" min="0" v-model.number="editableProducts[row.id]!.cost" />
                    <span v-else>{{ row.cost }}</span>
                </template>
            </el-table-column>

            <!-- 庫存 -->
            <el-table-column prop="stock" label="庫存數量" :width="130">
                <template #default="{ row }">
                    <el-input-number v-if="editMode" :min="0" style="width: 100px;"
                        v-model.number="editableProducts[row.id]!.stock" />
                    <span v-else>{{ row.stock }}</span>
                </template>
            </el-table-column>

            <!-- 新增時間 -->
            <el-table-column prop="created" label="新增時間" :formatter="formatDate" />

            <!-- 更新時間 -->
            <el-table-column prop="updated" label="更新時間" :formatter="formatDate" />
        </el-table>

        <div v-if="!filteredProducts.length" style="margin-top: 1rem">暫無商品資料</div>

        <!-- 新增商品對話框 -->
        <el-dialog title="新增商品" v-model="showAddDialog" :width="'90%'">
            <el-form :model="newProduct">
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
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { db } from "@/firebase";
import { ref as dbRef, onValue, update, push } from "firebase/database";

interface Product {
    id: string;
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

// 新增商品
const showAddDialog = ref(false);
const newProduct = ref<Omit<Product, "id">>({
    name: "",
    price: 0,
    cost: 0,
    stock: 0,
    created: Date.now(),
});

// 讀取商品資料
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

        // 初始化 editableProducts
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
        p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
});

// 格式化時間
function formatDate(row: Product, column?: any) {
    const timestamp = column?.property === "updated" ? row.updated : row.created;
    return timestamp ? new Date(timestamp).toLocaleString() : "";
}

// 切換編輯模式
function toggleEditMode() {
    if (editMode.value) saveAllChanges();
    editMode.value = !editMode.value;

    // 初始化 editableProducts 確保每個 row.id 都存在
    for (const [id, product] of Object.entries(products.value)) {
        if (!editableProducts.value[id]) editableProducts.value[id] = { ...product };
    }
}

// 批次保存
function saveAllChanges() {
    const now = Date.now();
    for (const [id, product] of Object.entries(editableProducts.value)) {
        const productRef = dbRef(db, `products/${id}`);
        update(productRef, { ...product, updated: now }).catch(console.error);
    }
    products.value = JSON.parse(JSON.stringify(editableProducts.value));
}

// 新增商品
function addProduct() {
    if (!newProduct.value.name) return; // 名稱必填

    const productsRef = dbRef(db, "products");
    const productData = { ...newProduct.value, created: Date.now() };
    const newRef = push(productsRef);
    const id = newRef.key!;
    update(newRef, { ...productData, id })
        .then(() => {
            showAddDialog.value = false;
            newProduct.value = { name: "", price: 0, cost: 0, stock: 0, created: Date.now() };
        })
        .catch(console.error);
}

onMounted(fetchProducts);
</script>
