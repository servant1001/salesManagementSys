<template>
    <div class="checkout-page">
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>結帳</h2>
            </el-col>
        </el-row>

        <div class="top-bar">
            <!-- 掃描元件 -->
            <Scanner @onScan="handleScan" />

            <!-- 手動輸入商品編號/GTIN -->
            <el-input v-model="manualGtin" placeholder="輸入商品編號或 GTIN" style="width: 200px;"
                @keyup.enter="addManualItem" />

            <!-- 手動輸入數量 -->
            <el-input-number v-model.number="manualQuantity" :min="1" style="width: 100px;"
                @keyup.enter="addManualItem" />

            <!-- 加入購物車按鈕 -->
            <el-button type="primary" @click="addManualItem">加入購物車</el-button>

        </div>

        <h3 style="margin-top: 20px;">已掃描商品列表</h3>
        <el-table v-if="cart.length" :data="cart" border style="width: 100%; margin-top: 10px;">
            <el-table-column label="商品圖片" width="120" align="center">
                <template #default="{ row }">
                    <div
                        style="width: 100px; height: 100px; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                        <img v-if="row.imageUrl" :src="row.imageUrl" alt="商品圖片"
                            style="width: 100%; height: 100%; object-fit: cover;" />
                        <el-icon v-else style="font-size: 32px; color: #ccc;">
                            <Picture />
                        </el-icon>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名稱" width="180" />
            <el-table-column prop="code" label="商品編號" width="180" />
            <el-table-column prop="gtin" label="GTIN" width="180" />
            <el-table-column label="售價" width="100">
                <template #default="{ row }">
                    <el-input v-if="row.editing" v-model.number="row.sellingPrice" size="small" />
                    <span v-else>{{ row.sellingPrice }} 元</span>
                </template>
            </el-table-column>
            <el-table-column label="數量" width="110">
                <template #default="{ row }">
                    <el-input-number v-if="row.editing" v-model.number="row.quantity" size="small" style="width: 80px;"
                        min="0" />
                    <span v-else>{{ row.quantity }}</span>
                </template>
            </el-table-column>
            <el-table-column label="小計" width="120">
                <template #default="{ row }">{{ row.sellingPrice * row.quantity }} 元</template>
            </el-table-column>

            <el-table-column label="操作" width="170">
                <template #default="{ row, $index }">
                    <el-button type="primary" size="mini" @click="toggleEdit(row)">
                        {{ row.editing ? "完成" : "編輯" }}
                    </el-button>
                    <el-button type="danger" size="mini" style="margin-left: 5px" @click="removeItem($index)">
                        刪除
                    </el-button>
                </template>
            </el-table-column>

            <el-table-column prop="price" label="定價" width="100">
                <template #default="{ row }">{{ row.price }} 元</template>
            </el-table-column>

            <el-table-column prop="cost" label="成本" width="80">
                <template #default="{ row }">{{ row.cost }} 元</template>
            </el-table-column>

            <el-table-column prop="estimatedProfit" label="預估毛利" width="100">
                <template #default="{ row }">
                    <span
                        :style="{ color: (row.sellingPrice - row.cost) >= 0 ? '#00fc2a' : '#fc0000', fontWeight: 'bold' }">
                        {{ (row.sellingPrice - row.cost).toFixed(0) }} 元
                    </span>
                </template>
            </el-table-column>

            <el-table-column prop="supplierName" label="廠商名稱" width="120" />

            <el-table-column prop="supplierCode" label="廠商編號" />
        </el-table>

        <div v-if="cart.length" style="margin-top: 10px; font-weight: bold; font-size: 1.2rem;">
            總金額：{{ total }} 元
        </div>
        <div v-else style="margin-top: 10px;">尚未掃描任何商品</div>

        <!-- 「全部清空」按鈕 -->
        <el-button type="warning" style="margin-top: 20px;" :disabled="cart.length === 0" @click="clearCart">
            全部清空
        </el-button>

        <el-button type="success" style="margin-top: 20px;" :disabled="cart.length === 0" @click="confirmCheckout">
            確認結帳
        </el-button>
    </div>
</template>

<script setup lang="ts">
import { reactive, computed, ref } from "vue";
import Scanner from "@/components/Scanner.vue";
import { Picture } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { db } from "@/firebase";
import { ref as dbRef, get, child, push, set, update } from "firebase/database";
import { useAuth } from "@/composables/useAuth";

const { user } = useAuth();

interface CartItem {
    barcode: string;
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    supplierName?: string;
    supplierCode?: string;
    imageUrl?: string;
    quantity: number;
    editing?: boolean; // 編輯狀態
    estimatedProfit?: number; // 預估毛利
}

const cart = reactive<CartItem[]>([]);

const total = computed(() =>
    cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
);

interface Product {
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice?: number;
    cost: number;
    imageUrl?: string;
}

async function handleScan(scannedGtin: string, quantity = 1) {
    const dbRoot = dbRef(db);
    const snapshot = await get(child(dbRoot, "products"));
    if (!snapshot.exists()) {
        ElMessage({ message: "資料庫中沒有商品資料", type: "warning", duration: 1500 });
        return;
    }

    const productsData = snapshot.val() as Record<string, any>;

    // 用 scannedGtin 去找對應商品
    const productEntry = Object.entries(productsData).find(
        ([id, data]) => (data as Product).gtin === scannedGtin
    );
    console.log("掃描結果:", productEntry);

    if (!productEntry) {
        ElMessage({ message: `找不到 GTIN ${scannedGtin} 的商品`, type: "warning", duration: 1500 });
        return;
    }

    const [barcode, data] = productEntry;
    const product = data as Product;

    const existingItem = cart.find(item => item.barcode === barcode);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        const cost = product.cost ?? 0;
        const sellingPrice = product.sellingPrice ?? product.price ?? 0;

        cart.push({
            barcode,              // Firebase 內部 id
            gtin: product.gtin,   // 用掃描值查到的 GTIN
            code: product.code ?? "",
            name: product.name,
            price: product.price,
            sellingPrice,
            cost,
            supplierName: (data as any).supplierName ?? "",
            supplierCode: (data as any).supplierCode ?? "",
            imageUrl: product.imageUrl,
            quantity,
            editing: false,
            estimatedProfit: sellingPrice - cost
        });
    }

    ElMessage({
        message: `已掃描: ${product.name} / ${product.sellingPrice}元`,
        type: "success",
        duration: 1000
    });
}


// 刪除某筆資料
function removeItem(index: number) {
    cart.splice(index, 1);
}

// 清空購物車
function clearCart() {
    cart.splice(0, cart.length);
    ElMessage({
        message: "購物車已全部清空",
        type: "info",
        duration: 1000
    });
}

// 切換編輯
function toggleEdit(item: CartItem) {
    item.editing = !item.editing;
}

// 確認結帳
async function confirmCheckout() {
    if (!cart.length) return;

    const salesRef = dbRef(db, "sales");
    const productsRef = dbRef(db, "products"); // 商品資料庫參考

    const snapshot = await get(productsRef);
    if (!snapshot.exists()) {
        ElMessage({ message: "資料庫中沒有商品資料", type: "warning" });
        return;
    }
    const productsData = snapshot.val() as Record<string, any>;

    const updates: Record<string, any> = {};
    for (const item of cart) {
        const productEntry = Object.entries(productsData).find(
            ([id, data]) => id === item.barcode || data.code === item.barcode
        );
        if (!productEntry) continue;
        const [id, data] = productEntry;
        const currentStock = data.stock ?? 0;
        const newStock = Math.max(currentStock - item.quantity, 0); // 避免庫存變負數
        updates[`${id}/stock`] = newStock;
        updates[`${id}/updated`] = Date.now(); // 更新時間
    }

    const newSaleRef = push(salesRef);
    const totalProfit = cart.reduce(
        (sum, item) => sum + (item.sellingPrice - item.cost) * item.quantity,
        0
    );
    const saleData = {
        timestamp: Date.now(),
        operator: user.value?.displayName || user.value?.email || "",
        items: cart.map(item => ({
            barcode: item.barcode,
            gtin: item.gtin,
            code: item.code,
            name: item.name,
            price: item.price,
            sellingPrice: item.sellingPrice,
            cost: item.cost,
            supplierName: item.supplierName,
            supplierCode: item.supplierCode,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            estimatedProfit: item.estimatedProfit
        })),
        total: total.value,
        totalProfit: totalProfit
    };

    try {
        await Promise.all([
            update(productsRef, updates),   // 更新庫存
            set(newSaleRef, saleData)      // 新增銷售紀錄
        ]);
        ElMessage({ message: "結帳完成，庫存已更新！", type: "success", duration: 1500 });
        cart.splice(0, cart.length); // 清空購物車
    } catch (error) {
        console.error(error);
        ElMessage({ message: "結帳失敗，請重試", type: "error", duration: 1500 });
    }
}

const manualGtin = ref("");
const manualQuantity = ref(1); // 預設數量 1

async function addManualItem() {
    const scannedGtin = manualGtin.value.trim();
    const quantity = manualQuantity.value;

    if (!scannedGtin || quantity <= 0) return;

    // 使用原本掃描邏輯新增商品
    await handleScan(scannedGtin, quantity);

    // 清空輸入框並重置數量
    manualGtin.value = "";
    manualQuantity.value = 1;
}

</script>
<style scoped>
.titleBar {
    margin: 0 0 10px 0;
}

.title-col {
    text-align: left;
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
    gap: 8px;
    margin-bottom: 10px;
}
</style>