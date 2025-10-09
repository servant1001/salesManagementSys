<template>
    <div class="checkout-page">
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>結帳</h2>
            </el-col>
        </el-row>

        <Scanner @onScan="handleScan" />

        <h3 style="margin-top: 20px;">已掃描商品列表</h3>
        <el-table v-if="cart.length" :data="cart" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="name" label="商品名稱" />
            <el-table-column label="單價" width="100">
                <template #default="{ row }">
                    <el-input v-if="row.editing" v-model.number="row.price" size="small" />
                    <span v-else>{{ row.price }} 元</span>
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
                <template #default="{ row }">{{ row.price * row.quantity }} 元</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
                <template #default="{ row, $index }">
                    <el-button type="primary" size="mini" @click="toggleEdit(row)">
                        {{ row.editing ? "完成" : "編輯" }}
                    </el-button>
                    <el-button type="danger" size="mini" style="margin-left: 5px" @click="removeItem($index)">
                        刪除
                    </el-button>
                </template>
            </el-table-column>
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
import { reactive, computed } from "vue";
import Scanner from "@/components/Scanner.vue";
import { ElMessage } from "element-plus";
import { db } from "@/firebase";
import { ref as dbRef, get, child, push, set, update } from "firebase/database";

interface CartItem {
    barcode: string;
    name: string;
    price: number;
    quantity: number;
    editing?: boolean; // 編輯狀態
}

const cart = reactive<CartItem[]>([]);

const total = computed(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 提示音 (可自定義)
const beepSound = new Audio("/scanner-beep.mp3"); // 放在 public/beep.mp3

// 記錄最近掃描的 code
const recentScans = new Set<string>();

const SCAN_COOLDOWN = 2000; // 2秒內重複掃描忽略

interface Product {
    code: string;
    name: string;
    price: number;
}

async function handleScan(scannedCode: string) {
    // if (recentScans.has(scannedCode)) {
    //     // 短時間內已掃過，不重複處理
    //     return;
    // }

    // recentScans.add(scannedCode);
    // setTimeout(() => recentScans.delete(scannedCode), SCAN_COOLDOWN);

    const dbRoot = dbRef(db);
    const snapshot = await get(child(dbRoot, "products"));
    if (!snapshot.exists()) {
        ElMessage({ message: "資料庫中沒有商品資料", type: "warning", duration: 1500 });
        return;
    }
    const productsData = snapshot.val() as Record<string, any>;
    const productEntry = Object.entries(productsData).find(
        ([id, data]) => (data as Product).code === scannedCode
    );
    if (!productEntry) {
        ElMessage({ message: `找不到代碼 ${scannedCode} 的商品`, type: "warning", duration: 1500 });
        return;
    }

    const [barcode, data] = productEntry;
    const product = data as Product;

    const existingItem = cart.find(item => item.barcode === barcode);
    if (existingItem) {
        existingItem.quantity += 1; // 數量加 1
    } else {
        cart.push({
            barcode,
            name: product.name,
            price: product.price,
            quantity: 1,
            editing: false
        });
    }

    ElMessage({
        message: `已掃描: ${product.name} / ${product.price}元`,
        type: "success",
        duration: 1000
    });

    beepSound.currentTime = 0;
    beepSound.play();
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
    const saleData = {
        timestamp: Date.now(),
        items: cart.map(item => ({
            barcode: item.barcode,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        })),
        total: total.value
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
</style>