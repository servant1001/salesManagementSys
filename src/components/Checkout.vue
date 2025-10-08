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
            <el-table-column prop="price" label="單價" width="100">
                <template #default="{ row }">{{ row.price }} 元</template>
            </el-table-column>
            <el-table-column prop="quantity" label="數量" width="80" />
            <el-table-column label="小計" width="120">
                <template #default="{ row }">{{ row.price * row.quantity }} 元</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
                <template #default="{ $index }">
                    <el-button type="danger" size="mini" @click="removeItem($index)">刪除</el-button>
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
import { ref as dbRef, get, child, push, set } from "firebase/database";

interface CartItem {
    barcode: string;
    name: string;
    price: number;
    quantity: number;
}

const cart = reactive<CartItem[]>([]);

const total = computed(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

// 提示音 (可自定義)
const beepSound = new Audio("/scanner-beep.mp3"); // 放在 public/beep.mp3

// 記錄最近掃描的 code
const recentScans = new Set<string>();

const SCAN_COOLDOWN = 1000; // 1秒內重複掃描忽略

interface Product {
    code: string;
    name: string;
    price: number;
}

async function handleScan(scannedCode: string) {
    if (recentScans.has(scannedCode)) {
        // 短時間內已掃過，不重複處理
        return;
    }

    // 加入 recentScans
    recentScans.add(scannedCode);
    setTimeout(() => recentScans.delete(scannedCode), SCAN_COOLDOWN);

    // --------- 以下是原本查 DB 與加入購物車邏輯 ---------
    const dbRoot = dbRef(db);
    const snapshot = await get(child(dbRoot, "products"));

    if (snapshot.exists()) {
        const productsData = snapshot.val();

        const productEntry = Object.entries(productsData).find(
            ([key, value]: [string, any]) => (value as Product).code === scannedCode
        );

        if (productEntry) {
            const [barcode, data] = productEntry;
            const product = data as Product;

            cart.push({
                barcode,
                name: product.name,
                price: product.price,
                quantity: 1
            });

            ElMessage({
                message: `已掃描: ${product.name} / ${product.price}元`,
                type: "success",
                duration: 1000
            });

            beepSound.currentTime = 0;
            beepSound.play();
        } else {
            ElMessage({
                message: `找不到代碼 ${scannedCode} 的商品`,
                type: "warning",
                duration: 1500
            });
        }
    } else {
        ElMessage({
            message: "資料庫中沒有商品資料",
            type: "warning",
            duration: 1500
        });
    }
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


// 確認結帳
async function confirmCheckout() {
    if (!cart.length) return;

    const salesRef = dbRef(db, "sales");
    const newSaleRef = push(salesRef); // 生成唯一 key
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

    await set(newSaleRef, saleData);

    ElMessage({
        message: "結帳完成！",
        type: "success",
        duration: 1500
    });

    cart.splice(0, cart.length); // 清空購物車
}
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
</style>