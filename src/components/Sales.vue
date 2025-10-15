<template>
    <div class="sales-page">
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>銷售紀錄</h2>
            </el-col>
        </el-row>

        <el-row class="filterBar" style="margin-bottom: 10px; align-items: center; gap: 10px;">
            <el-col :span="6">
                <el-input v-model="searchKeyword" placeholder="搜尋商品名稱" clearable @input="filterSales" />
            </el-col>
            <el-col :span="6">
                <el-date-picker v-model="selectedMonth" type="month" placeholder="選擇年月" format="YYYY-MM"
                    value-format="YYYY-MM" clearable @change="() => loadSalesByMonth(selectedMonth)" />
            </el-col>
        </el-row>

        <el-row class="statsBar" style="
            display: flex;
            flex-wrap: wrap;       /* 手機板可換行 */
            gap: 20px;             /* 欄位間距 */
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 1.1rem;
            justify-content: flex-start; /* 整個 row 靠左 */
        ">
            <div>總銷售額：{{ totalFilteredSales }} 元</div>
            <div>總毛利：{{ totalFilteredProfit }} 元</div>
            <div>今日銷售額：{{ todaySales }} 元</div>
            <div>今日毛利：{{ todayProfit }} 元</div>
        </el-row>

        <el-table v-if="filteredSales.length" :data="filteredSales" border style="width:100%">
            <el-table-column prop="timestamp" label="時間" width="170">
                <template #default="{ row }">{{ formatDate(row.timestamp) }}</template>
            </el-table-column>

            <el-table-column prop="total" label="總金額" width="80">
                <template #default="{ row }">{{ row.total }} 元</template>
            </el-table-column>

            <el-table-column prop="totalProfit" label="總毛利" width="80">
                <template #default="{ row }">
                    <span :style="{ color: (row.totalProfit ?? 0) >= 0 ? '#00fc2a' : '#fc0000', fontWeight: 'bold' }">
                        {{ row.totalProfit ?? 0 }} 元
                    </span>
                </template>
            </el-table-column>

            <el-table-column prop="operator" label="操作人員" width="100" />

            <el-table-column label="商品明細">
                <template #default="{ row }">
                    <el-button type="primary" size="mini"
                        @click="showDetails(row.items, row.operator, row.total, row.totalProfit)">
                        查看明細
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <div v-else>尚無銷售紀錄</div>

        <!-- 彈窗顯示商品明細 -->
        <el-dialog title="商品明細" v-model="dialogVisible" width="90%" :before-close="() => (dialogVisible = false)">
            <!-- 操作人員與總金額 -->
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
                font-weight: bold;
                font-size: 1.05rem;
            ">
                <span>總銷售/毛利：{{ selectedTotal }}元/{{ selectedProfit }}元</span>
                <span>人員：{{ selectedOperator }}</span>
            </div>

            <el-table :data="selectedItems" border style="width: 100%;" size="small">
                <el-table-column prop="name" label="名稱" />

                <el-table-column prop="sellingPrice" label="售價" width="100">
                    <template #default="{ row }">{{ row.sellingPrice }} 元</template>
                </el-table-column>
                <el-table-column prop="quantity" label="數量" width="80" />
                <el-table-column label="小計" width="120">
                    <template #default="{ row }">{{ row.sellingPrice * row.quantity }} 元</template>
                </el-table-column>
                <el-table-column prop="price" label="定價" width="100">
                    <template #default="{ row }">{{ row.price }} 元</template>
                </el-table-column>
                <el-table-column prop="cost" label="成本" width="100">
                    <template #default="{ row }">{{ row.cost }} 元</template>
                </el-table-column>
                <el-table-column prop="estimatedProfit" label="預估毛利" width="120">
                    <template #default="{ row }">
                        <span :style="{ color: (row.sellingPrice - row.cost) >= 0 ? '#00fc2a' : '#fc0000' }">
                            {{ (row.sellingPrice - row.cost).toFixed(0) }} 元
                        </span>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { db } from "@/firebase";
import { query, orderByChild, startAt, endAt, get, child, ref as dbRef } from "firebase/database";

interface SaleItem {
    barcode: string;
    name: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    cost?: number;
    supplierName?: string;
    supplierCode?: string;
}

interface Sale {
    timestamp: number;
    total: number;
    totalProfit?: number;
    items: SaleItem[];
    operator: string;
}

const sales = ref<Sale[]>([]);
const filteredSales = ref<Sale[]>([]);

const selectedItems = ref<SaleItem[]>([]);
const selectedOperator = ref("");
const selectedTotal = ref(0);
const selectedProfit = ref(0);
const dialogVisible = ref(false);

const searchKeyword = ref("");
// 取得當前年月 YYYY-MM
function getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // 補 0
    return `${year}-${month}`;
}

const selectedMonth = ref<string>(getCurrentYearMonth());

function formatDate(ts: number) {
    return new Date(ts).toLocaleString();
}

function showDetails(rowItems: SaleItem[], operator: string, total: number, totalProfit: number) {
    selectedItems.value = rowItems;
    selectedOperator.value = operator;
    selectedTotal.value = total;
    selectedProfit.value = totalProfit || 0;
    dialogVisible.value = true;
}

// 篩選函式：商品名稱 + 年月
function filterSales() {
    filteredSales.value = sales.value.filter(sale => {
        // 年月過濾
        let monthMatch = true;
        if (selectedMonth.value) {
            const [year, month] = selectedMonth.value.split("-").map(Number);
            const saleDate = new Date(sale.timestamp);
            monthMatch =
                saleDate.getFullYear() === year && saleDate.getMonth() + 1 === month;
        }

        // 商品名稱模糊搜尋
        const keywordMatch = searchKeyword.value
            ? sale.items.some(item =>
                item.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
            )
            : true;

        return monthMatch && keywordMatch;
    });
}

async function loadSalesByMonth(selectedMonth: string | null) {
    const salesRef = child(dbRef(db), "sales");
    let salesQuery;

    if (selectedMonth) {
        console.log(selectedMonth)
        const parts = selectedMonth.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]);

        // 型別安全檢查
        if (isNaN(year) || isNaN(month)) {
            console.warn("選擇的月份格式不正確:", selectedMonth);
            return;
        }

        // 計算當月起迄 timestamp
        const monthStart = new Date(year, month - 1, 1).getTime();
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999).getTime();

        salesQuery = query(
            salesRef,
            orderByChild("timestamp"),
            startAt(monthStart),
            endAt(monthEnd)
        );
    } else {
        // 如果沒選月份，抓全部
        salesQuery = query(salesRef, orderByChild("timestamp"));
    }

    const snapshot = await get(salesQuery);
    if (snapshot.exists()) {
        const data = snapshot.val();
        sales.value = (Object.values(data) as Sale[]).sort(
            (a, b) => b.timestamp - a.timestamp
        );
        filterSales(); // 前端依關鍵字再篩選一次
    } else {
        sales.value = [];
        filteredSales.value = [];
    }
}

// 總銷售額（根據篩選結果）
const totalFilteredSales = computed(() =>
    filteredSales.value.reduce((sum, sale) => sum + sale.total, 0)
);

// 總毛利（根據篩選結果）
const totalFilteredProfit = computed(() =>
    filteredSales.value.reduce((sum, sale) => sum + (sale.totalProfit ?? 0), 0)
);

// 計算今天零時零分零秒
function getTodayStart(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

// 今日銷售額
const todaySales = computed(() => {
    const start = getTodayStart();
    return sales.value
        .filter(sale => sale.timestamp >= start)
        .reduce((sum, sale) => sum + sale.total, 0);
});

// 今日毛利
const todayProfit = computed(() => {
    const start = getTodayStart();
    return sales.value
        .filter(sale => sale.timestamp >= start)
        .reduce((sum, sale) => sum + (sale.totalProfit ?? 0), 0);
});

onMounted(() => loadSalesByMonth(selectedMonth.value));

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
</style>
