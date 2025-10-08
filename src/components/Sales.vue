<template>
    <div class="sales-page">
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>銷售紀錄</h2>
            </el-col>
        </el-row>

        <el-table v-if="sales.length" :data="sales" border style="width:100%">
            <el-table-column prop="timestamp" label="時間" width="170">
                <template #default="{ row }">{{ formatDate(row.timestamp) }}</template>
            </el-table-column>

            <el-table-column prop="total" label="總金額" width="80">
                <template #default="{ row }">{{ row.total }} 元</template>
            </el-table-column>

            <el-table-column label="商品明細">
                <template #default="{ row }">
                    <el-button type="primary" size="mini" @click="showDetails(row.items)">
                        查看明細
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <div v-else>尚無銷售紀錄</div>

        <!-- 彈窗顯示商品明細 -->
        <el-dialog title="商品明細" v-model="dialogVisible" width="90%" :before-close="() => (dialogVisible = false)">
            <el-table :data="selectedItems" border style="width: 100%;" size="small">
                <el-table-column prop="name" label="名稱" />
                <el-table-column prop="price" label="單價" width="100">
                    <template #default="{ row }">{{ row.price }} 元</template>
                </el-table-column>
                <el-table-column prop="quantity" label="數量" width="80" />
                <el-table-column label="小計" width="120">
                    <template #default="{ row }">{{ row.price * row.quantity }} 元</template>
                </el-table-column>
            </el-table>

            <!-- 顯示總金額 -->
            <div style="text-align: right; margin-top: 10px; font-weight: bold; font-size: 1.1rem;">
                總金額：{{selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)}} 元
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { ref as dbRef, get, child } from "firebase/database";

interface SaleItem {
    barcode: string;
    name: string;
    price: number;
    quantity: number;
}

interface Sale {
    timestamp: number;
    total: number;
    items: SaleItem[];
}

const sales = ref<Sale[]>([]);
const selectedItems = ref<SaleItem[]>([]);
const dialogVisible = ref(false);

function formatDate(ts: number) {
    return new Date(ts).toLocaleString();
}

function showDetails(items: SaleItem[]) {
    selectedItems.value = items;
    dialogVisible.value = true;
}

async function loadSales() {
    const snapshot = await get(child(dbRef(db), "sales"));
    if (snapshot.exists()) {
        const data = snapshot.val();
        sales.value = (Object.values(data) as Sale[]).sort(
            (a, b) => b.timestamp - a.timestamp
        );
    }
}

onMounted(loadSales);
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