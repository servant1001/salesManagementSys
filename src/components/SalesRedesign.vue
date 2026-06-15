<template>
    <div class="sales-page">
        <section class="sales-hero">
            <div class="hero-copy">
                <span class="page-eyebrow">SALES ARCHIVE</span>
                <h2>銷售紀錄</h2>
                <p>集中檢視交易、付款方式與毛利表現，也能直接修正單筆紀錄與商品明細。</p>
            </div>

            <div class="hero-metrics">
                <div class="hero-badge">
                    <strong>{{ totalSalesCount }}</strong>
                    <span>篩選筆數</span>
                </div>
                <div class="hero-badge">
                    <strong>NT$ {{ formatCurrency(totalFilteredSales) }}</strong>
                    <span>總銷售額</span>
                </div>
                <div class="hero-badge">
                    <strong :class="{ 'profit-negative': totalFilteredProfit < 0 }">
                        NT$ {{ formatCurrency(totalFilteredProfit) }}
                    </strong>
                    <span>總毛利</span>
                </div>
            </div>
        </section>

        <section class="filter-card">
            <div class="filter-head">
                <div>
                    <span class="section-eyebrow">FILTERS</span>
                    <h3>篩選與分析</h3>
                </div>
                <div class="filter-actions">
                    <el-button class="secondary-btn" @click="showPaymentStats">銷售分析</el-button>
                    <el-button :type="showActions ? 'warning' : 'info'" @click="toggleEditMode">
                        {{ showActions ? "關閉編輯模式" : "開啟編輯模式" }}
                    </el-button>
                </div>
            </div>

            <div class="filter-grid">
                <el-input
                    v-model="searchKeyword"
                    placeholder="搜尋商品名稱"
                    clearable
                    class="search-input"
                    @input="filterSales"
                />

                <el-select v-model="dateFilterMode" class="mode-select">
                    <el-option label="按月份" value="month" />
                    <el-option label="按日期" value="day" />
                </el-select>

                <el-date-picker
                    v-model="selectedDate"
                    :type="dateFilterMode === 'day' ? 'date' : 'month'"
                    :format="dateFilterMode === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM'"
                    :value-format="dateFilterMode === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM'"
                    clearable
                    class="date-picker"
                />

                <div class="range-badge">
                    <span>目前區間</span>
                    <strong>{{ paymentStatsDateRangeText || "未選擇" }}</strong>
                </div>
            </div>
        </section>

        <section class="table-card">
            <div class="table-header">
                <div>
                    <span class="section-eyebrow">RECORDS</span>
                    <h3>交易列表</h3>
                </div>

                <div class="table-meta">
                    <span>{{ filteredSales.length }} 筆紀錄</span>
                    <span>總額 NT$ {{ formatCurrency(totalFilteredSales) }}</span>
                    <span>毛利 NT$ {{ formatCurrency(totalFilteredProfit) }}</span>
                </div>
            </div>

            <el-table
                v-if="filteredSales.length"
                :data="filteredSales"
                border
                class="sales-table"
                :class="tableThemeClass"
                :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }"
            >
                <el-table-column class-name="no-padding-cell" label="#" width="38" align="center">
                    <template #default="{ $index }">
                        <span class="index-text">{{ $index + 1 }}</span>
                    </template>
                </el-table-column>

                <el-table-column v-if="showActions" fixed="left" label="操作" width="152" align="center">
                    <template #default="{ row }">
                        <div class="row-action-stack">
                            <el-button
                                v-if="editingRow !== row"
                                size="small"
                                type="primary"
                                class="row-action-btn"
                                @click="startEditTime(row)"
                            >
                                編輯
                            </el-button>
                            <el-button
                                v-if="editingRow === row"
                                size="small"
                                type="primary"
                                class="row-action-btn"
                                @click="saveEditTime(row)"
                            >
                                儲存
                            </el-button>
                            <el-button
                                v-if="editingRow === row"
                                size="small"
                                class="row-action-btn"
                                @click="cancelEditTime"
                            >
                                取消
                            </el-button>
                            <el-button
                                size="small"
                                type="danger"
                                class="row-action-btn"
                                @click="deleteSale(row)"
                            >
                                刪除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="timestamp" label="時間" width="210">
                    <template #default="{ row }">
                        <div v-if="editingRow === row">
                            <el-date-picker
                                v-model="editingTimestamp"
                                type="datetime"
                                format="YYYY-MM-DD HH:mm"
                                value-format="x"
                                size="small"
                            />
                        </div>
                        <div v-else>{{ formatDate(row.timestamp) }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="total" label="總金額" width="140" align="right">
                    <template #default="{ row }">
                        <span class="amount-value">NT$ {{ formatCurrency(row.total) }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="totalProfit" label="總毛利" width="140" align="right">
                    <template #default="{ row }">
                        <span :class="['profit-value', { 'profit-negative': (row.totalProfit ?? 0) < 0 }]">
                            NT$ {{ formatCurrency(row.totalProfit ?? 0) }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column prop="paymentMethod" label="付款方式" width="140" align="center">
                    <template #default="{ row }">
                        <div v-if="editingRow === row">
                            <el-select v-model="row.paymentMethod" size="small" placeholder="選擇付款方式">
                                <el-option
                                    v-for="opt in paymentMethodOptions"
                                    :key="opt.value"
                                    :label="opt.label"
                                    :value="opt.value"
                                />
                            </el-select>
                        </div>
                        <div v-else>{{ paymentMethodMap[row.paymentMethod || ""] || "-" }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="operator" label="操作人員" min-width="120" />

                <el-table-column label="商品明細" width="120" align="center">
                    <template #default="{ row }">
                        <el-button
                            type="primary"
                            size="small"
                            @click="showDetails(row.items, row.operator, row.total, row.totalProfit ?? 0, row.id)"
                        >
                            查看明細
                        </el-button>
                    </template>
                </el-table-column>

                <el-table-column prop="updater" label="修改者" min-width="160" />
            </el-table>

            <div v-else class="empty-state">
                <strong>目前沒有符合條件的銷售紀錄</strong>
                <p>可以切換日期區間、月份或搜尋商品名稱，快速找到想查的交易。</p>
            </div>
        </section>

        <el-dialog v-model="dialogVisible" title="商品明細" width="min(94vw, 1380px)" class="detail-dialog" @close="onDetailDialogClose">
            <div class="detail-header">
                <div class="detail-summary-card">
                    <div class="detail-summary-item">
                        <span>銷售總額</span>
                        <strong>NT$ {{ formatCurrency(selectedTotal) }}</strong>
                    </div>
                    <div class="detail-summary-item">
                        <span>總毛利</span>
                        <strong :class="{ 'profit-negative': selectedProfit < 0 }">NT$ {{ formatCurrency(selectedProfit) }}</strong>
                    </div>
                    <div class="detail-summary-item">
                        <span>操作人員</span>
                        <strong>{{ selectedOperator || "-" }}</strong>
                    </div>
                </div>

                <div class="detail-actions">
                    <el-button type="primary" size="small" @click="addNewDetailItem">新增商品</el-button>
                    <el-button size="small" :type="showDetailActions ? 'warning' : 'info'" @click="toggleDetailEditMode">
                        {{ showDetailActions ? "關閉編輯模式" : "開啟編輯模式" }}
                    </el-button>
                </div>
            </div>

            <el-table
                :data="selectedItems"
                border
                size="small"
                class="detail-table"
                :class="tableThemeClass"
                :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }"
            >
                <el-table-column label="#" width="48" align="center">
                    <template #default="{ $index }">{{ $index + 1 }}</template>
                </el-table-column>

                <el-table-column v-if="showDetailActions" label="操作" width="150" align="center">
                    <template #default="{ row }">
                        <div class="row-action-stack">
                            <template v-if="editingDetailRow === row">
                                <el-button size="small" type="primary" class="row-action-btn" @click="saveDetailEdit(row)">
                                    儲存
                                </el-button>
                                <el-button size="small" class="row-action-btn" @click="editingDetailRow = null">
                                    取消
                                </el-button>
                            </template>
                            <template v-else>
                                <el-button size="small" type="primary" class="row-action-btn" @click="editingDetailRow = row">
                                    編輯
                                </el-button>
                                <el-button size="small" type="danger" class="row-action-btn" @click="deleteDetailItem(row)">
                                    刪除
                                </el-button>
                            </template>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="商品圖片" width="120" align="center">
                    <template #default="{ row }">
                        <div class="product-image-box product-image-box--large">
                            <img v-if="row.imageUrl" :src="row.imageUrl" alt="商品圖片" class="product-image" />
                            <el-icon v-else class="product-image-fallback">
                                <Picture />
                            </el-icon>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="商品名稱" min-width="180">
                    <template #default="{ row }">
                        <div v-if="editingDetailRow === row">
                            <el-input v-model="row.name" size="small" placeholder="輸入商品名稱" />
                        </div>
                        <div v-else>
                            <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer" class="product-link">
                                {{ row.name }}
                            </a>
                            <span v-else>{{ row.name }}</span>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="code" label="商品編號" width="120">
                    <template #default="{ row }">
                        <el-input v-if="editingDetailRow === row" v-model="row.code" size="small" placeholder="輸入商品編號" />
                        <div v-else>{{ row.code }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="gtin" label="GTIN" width="120">
                    <template #default="{ row }">
                        <el-input v-if="editingDetailRow === row" v-model="row.gtin" size="small" placeholder="輸入 GTIN" />
                        <div v-else>{{ row.gtin }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="sellingPrice" label="售價" width="120">
                    <template #default="{ row }">
                        <el-input-number v-if="editingDetailRow === row" v-model="row.sellingPrice" :min="0" size="small" class="detail-number" />
                        <div v-else>NT$ {{ formatCurrency(row.sellingPrice) }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="quantity" label="數量" width="110">
                    <template #default="{ row }">
                        <el-input-number v-if="editingDetailRow === row" v-model="row.quantity" :min="0" size="small" class="detail-number" />
                        <div v-else>{{ row.quantity }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="小計" width="120">
                    <template #default="{ row }">NT$ {{ formatCurrency(row.sellingPrice * row.quantity) }}</template>
                </el-table-column>

                <el-table-column prop="price" label="定價" width="100">
                    <template #default="{ row }">NT$ {{ formatCurrency(row.price) }}</template>
                </el-table-column>

                <el-table-column prop="cost" label="成本" width="120">
                    <template #default="{ row }">
                        <el-input-number v-if="editingDetailRow === row" v-model="row.cost" :min="0" size="small" class="detail-number" />
                        <div v-else>NT$ {{ formatCurrency(row.cost ?? 0) }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="單件毛利" width="120">
                    <template #default="{ row }">
                        <span :class="['profit-value', { 'profit-negative': row.sellingPrice - (row.cost ?? 0) < 0 }]">
                            NT$ {{ formatCurrency(row.sellingPrice - (row.cost ?? 0)) }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column label="預估總毛利" width="130">
                    <template #default="{ row }">
                        <span :class="['profit-value', { 'profit-negative': (row.sellingPrice - (row.cost ?? 0)) * row.quantity < 0 }]">
                            NT$ {{ formatCurrency((row.sellingPrice - (row.cost ?? 0)) * row.quantity) }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column prop="website" label="網站連結" width="180">
                    <template #default="{ row }">
                        <el-input v-if="editingDetailRow === row" v-model="row.website" size="small" placeholder="輸入網站連結" />
                        <div v-else>
                            <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer" class="site-link">連結</a>
                            <span v-else>-</span>
                        </div>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>

        <el-dialog v-model="salesAnalysisDialog" width="min(92vw, 560px)" class="analysis-dialog">
            <template #title>
                <div class="analysis-title">
                    <strong>銷售分析</strong>
                    <span>{{ paymentStatsDateRangeText }}</span>
                </div>
            </template>

            <div class="analysis-summary">
                <div class="summary-row">
                    <span>總銷售額</span>
                    <strong>NT$ {{ formatCurrency(paymentStatsTotal) }}</strong>
                </div>
                <div class="summary-row">
                    <span>總毛利</span>
                    <strong :class="{ 'profit-negative': paymentStatsTotalProfit < 0 }">
                        NT$ {{ formatCurrency(paymentStatsTotalProfit) }}
                    </strong>
                </div>
                <div class="summary-row">
                    <span>毛利率</span>
                    <strong :class="{ 'profit-negative': paymentStatsProfitRate < 0 }">
                        {{ paymentStatsProfitRate }}%
                    </strong>
                </div>
            </div>

            <el-table
                :data="paymentStats"
                border
                size="small"
                class="analysis-table"
                :class="tableThemeClass"
                :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }"
            >
                <el-table-column prop="method" label="付款方式" width="110" align="center">
                    <template #default="{ row }">
                        {{ paymentMethodMap[row.method] || row.method }}
                    </template>
                </el-table-column>
                <el-table-column prop="count" label="筆數" width="70" align="center" />
                <el-table-column prop="total" label="總金額" width="120" align="center">
                    <template #default="{ row }">NT$ {{ formatCurrency(row.total) }}</template>
                </el-table-column>
                <el-table-column prop="profit" label="總毛利" align="center">
                    <template #default="{ row }">
                        <span :class="{ 'profit-negative': row.profit < 0 }">
                            NT$ {{ formatCurrency(row.profit) }}
                        </span>
                    </template>
                </el-table-column>
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { db } from "@/firebase";
import { child, endAt, get, orderByChild, query, ref as dbRef, remove, startAt, update } from "firebase/database";
import { ElMessage, ElMessageBox } from "element-plus";
import { Picture } from "@element-plus/icons-vue";
import { useAuth } from "@/composables/useAuth";
import { useThemeStore } from "@/stores/theme";

const { user } = useAuth();
const themeStore = useThemeStore();
const tableThemeClass = computed(() => (themeStore.isDarkTheme ? "table-dark" : "table-light"));

interface SaleItem {
    barcode: string;
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    quantity: number;
    cost?: number;
    supplierName?: string;
    supplierCode?: string;
    imageUrl?: string;
    website?: string;
}

interface Sale {
    id?: string;
    timestamp: number;
    total: number;
    totalProfit?: number;
    items: SaleItem[];
    operator: string;
    paymentMethod?: string;
    updater?: string;
}

interface PaymentOption {
    label: string;
    value: string;
}

const paymentMethodMap: Record<string, string> = {
    cash: "現金",
    credit_card: "信用卡",
    line_pay: "Line Pay",
    px_pay: "PX Pay",
    unknown: "未設定",
};

const paymentMethodOptions: PaymentOption[] = [
    { label: "現金", value: "cash" },
    { label: "信用卡", value: "credit_card" },
    { label: "Line Pay", value: "line_pay" },
    { label: "PX Pay", value: "px_pay" },
];

const sales = ref<Sale[]>([]);
const filteredSales = ref<Sale[]>([]);
const selectedItems = ref<SaleItem[]>([]);
const selectedOperator = ref("");
const selectedTotal = ref(0);
const selectedProfit = ref(0);
const dialogVisible = ref(false);
const searchKeyword = ref("");
const showActions = ref(false);
const editingRow = ref<Sale | null>(null);
const editingTimestamp = ref<number | null>(null);
const dateFilterMode = ref<"month" | "day">("day");
const selectedDate = ref<string | null>(null);
const salesAnalysisDialog = ref(false);
const paymentStats = ref<{ method: string; count: number; total: number; profit: number }[]>([]);
const paymentStatsTotal = ref(0);
const paymentStatsTotalProfit = ref(0);
const paymentStatsProfitRate = ref(0);
const showDetailActions = ref(false);
const editingDetailRow = ref<SaleItem | null>(null);
let currentEditingSaleId: string | null = null;

function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function toggleEditMode() {
    showActions.value = !showActions.value;
}

function getDeviceInfoShort(): string {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Safari")) browser = "Safari";

    return `${browser} / ${platform}`;
}

function startEditTime(row: Sale) {
    editingRow.value = row;
    editingTimestamp.value = row.timestamp;
}

function cancelEditTime() {
    editingRow.value = null;
    editingTimestamp.value = null;
}

function needHandlingFee(paymentMethod?: string) {
    return ["credit_card", "line_pay", "px_pay"].includes(paymentMethod || "");
}

async function saveEditTime(row: Sale) {
    if (!row.id) return;

    const itemProfitSum = row.items.reduce(
        (sum, item) => sum + ((item.sellingPrice - (item.cost ?? 0)) * item.quantity),
        0
    );

    let newTotalProfit = itemProfitSum;
    if (needHandlingFee(row.paymentMethod)) {
        newTotalProfit = itemProfitSum - Math.round(row.total * 0.02);
    }

    await update(dbRef(db, `sales/${row.id}`), {
        timestamp: editingTimestamp.value,
        paymentMethod: row.paymentMethod || null,
        totalProfit: newTotalProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    ElMessage.success("銷售紀錄已更新。");
    editingRow.value = null;
    editingTimestamp.value = null;
    await loadSalesByDate(selectedDate.value);
}

async function deleteSale(sale: Sale) {
    try {
        await ElMessageBox.confirm("確定要刪除這筆銷售紀錄嗎？", "刪除確認", {
            confirmButtonText: "刪除",
            cancelButtonText: "取消",
            type: "warning",
        });

        if (sale.id) {
            await remove(child(dbRef(db), `sales/${sale.id}`));
            ElMessage.success("刪除成功。");
            await loadSalesByDate(selectedDate.value);
        } else {
            ElMessage.error("找不到這筆紀錄的 ID。");
        }
    } catch {
        ElMessage.info("已取消刪除。");
    }
}

function getCurrentYearMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
}

function getToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getCurrentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(ts: number) {
    return new Date(ts).toLocaleString();
}

function filterSales() {
    filteredSales.value = sales.value.filter((sale) => {
        if (!selectedDate.value) return true;

        const saleDate = new Date(sale.timestamp);
        let dateMatch = false;

        if (dateFilterMode.value === "day") {
            const [y, m, d] = selectedDate.value.split("-").map(Number);
            dateMatch =
                saleDate.getFullYear() === y &&
                saleDate.getMonth() + 1 === m &&
                saleDate.getDate() === d;
        } else {
            const [y, m] = selectedDate.value.split("-").map(Number);
            dateMatch = saleDate.getFullYear() === y && saleDate.getMonth() + 1 === m;
        }

        const keywordMatch = searchKeyword.value
            ? sale.items.some((item) => item.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
            : true;

        return dateMatch && keywordMatch;
    });
}

async function loadSalesByDate(date: string | null) {
    if (!date) return;

    let startTime = 0;
    let endTime = 0;

    if (dateFilterMode.value === "day") {
        const [y, m, d] = date.split("-").map(Number) as [number, number, number];
        startTime = new Date(y, m - 1, d).getTime();
        endTime = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
    } else {
        const [y, m] = date.split("-").map(Number) as [number, number];
        startTime = new Date(y, m - 1, 1).getTime();
        endTime = new Date(y, m, 0, 23, 59, 59, 999).getTime();
    }

    const salesRef = child(dbRef(db), "sales");
    const salesQuery = query(salesRef, orderByChild("timestamp"), startAt(startTime), endAt(endTime));
    const snapshot = await get(salesQuery);

    if (snapshot.exists()) {
        const data = snapshot.val();
        sales.value = Object.entries(data)
            .map(([key, val]) => ({ id: key, ...(val as Sale) }))
            .sort((a, b) => b.timestamp - a.timestamp);
    } else {
        sales.value = [];
    }

    filterSales();
}

const totalSalesCount = computed(() => filteredSales.value.length);
const totalFilteredSales = computed(() => filteredSales.value.reduce((sum, sale) => sum + sale.total, 0));
const totalFilteredProfit = computed(() => filteredSales.value.reduce((sum, sale) => sum + (sale.totalProfit ?? 0), 0));

function calculatePaymentStats() {
    const statsMap: Record<string, { count: number; total: number; profit: number }> = {};
    let totalSum = 0;
    let profitSum = 0;

    filteredSales.value.forEach((sale) => {
        const method = sale.paymentMethod || "unknown";
        if (!statsMap[method]) statsMap[method] = { count: 0, total: 0, profit: 0 };

        statsMap[method].count += 1;
        statsMap[method].total += sale.total;
        statsMap[method].profit += sale.totalProfit ?? 0;

        totalSum += sale.total;
        profitSum += sale.totalProfit ?? 0;
    });

    paymentStats.value = Object.entries(statsMap).map(([method, data]) => ({
        method,
        count: data.count,
        total: data.total,
        profit: data.profit,
    }));

    paymentStatsTotal.value = totalSum;
    paymentStatsTotalProfit.value = profitSum;
    paymentStatsProfitRate.value = totalSum ? parseFloat(((profitSum / totalSum) * 100).toFixed(2)) : 0;
}

function showPaymentStats() {
    calculatePaymentStats();
    salesAnalysisDialog.value = true;
}

const paymentStatsDateRangeText = computed(() => {
    if (!selectedDate.value) return "";

    if (dateFilterMode.value === "day") {
        return selectedDate.value;
    }

    const parts = selectedDate.value.split("-").map(Number);
    const y = parts[0] ?? new Date().getFullYear();
    const m = parts[1] ?? new Date().getMonth() + 1;
    const lastDay = new Date(y, m, 0).getDate();
    return `${selectedDate.value}-01 ~ ${selectedDate.value}-${lastDay.toString().padStart(2, "0")}`;
});

function showDetails(rowItems: SaleItem[], operator: string, total: number, totalProfit: number, saleId?: string) {
    selectedItems.value = rowItems.map((item) => ({ ...item }));
    selectedOperator.value = operator;
    selectedTotal.value = total;
    selectedProfit.value = totalProfit || 0;
    dialogVisible.value = true;
    currentEditingSaleId = saleId || null;
}

function addNewDetailItem() {
    if (!currentEditingSaleId) {
        ElMessage.error("找不到這筆交易的 ID。");
        return;
    }

    const newItem: SaleItem = {
        barcode: `new-${Date.now()}`,
        gtin: "",
        code: "",
        name: "",
        price: 0,
        sellingPrice: 0,
        quantity: 1,
        cost: 0,
        imageUrl: "",
        website: "",
    };

    selectedItems.value.push(newItem);
    editingDetailRow.value = newItem;
    showDetailActions.value = true;
}

async function saveDetailEdit(item: SaleItem) {
    if (!currentEditingSaleId) {
        ElMessage.error("找不到這筆交易的 ID。");
        return;
    }

    const index = selectedItems.value.findIndex((i) => i.barcode === item.barcode);
    if (index !== -1) selectedItems.value[index] = { ...item };

    const newTotal = selectedItems.value.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
    const newProfit = selectedItems.value.reduce((sum, i) => sum + ((i.sellingPrice - (i.cost ?? 0)) * i.quantity), 0);

    await update(dbRef(db, `sales/${currentEditingSaleId}`), {
        items: selectedItems.value,
        total: newTotal,
        totalProfit: newProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    selectedTotal.value = newTotal;
    selectedProfit.value = newProfit;
    await loadSalesByDate(selectedDate.value);

    ElMessage.success("商品明細已更新。");
    editingDetailRow.value = null;
}

function deleteDetailItem(row: SaleItem) {
    ElMessageBox.confirm("確定要刪除這個商品明細嗎？", "刪除確認", {
        confirmButtonText: "刪除",
        cancelButtonText: "取消",
        type: "warning",
    })
        .then(() => {
            const index = selectedItems.value.indexOf(row);
            if (index !== -1) {
                selectedItems.value.splice(index, 1);
                ElMessage.success("商品明細已刪除。");
                updateDetailItemsInFirebase();
            }
        })
        .catch(() => {
            ElMessage.info("已取消刪除。");
        });
}

async function updateDetailItemsInFirebase() {
    const saleId = currentEditingSaleId;
    if (!saleId) return;

    const total = selectedItems.value.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const totalProfit = selectedItems.value.reduce((sum, item) => sum + ((item.sellingPrice - (item.cost ?? 0)) * item.quantity), 0);

    await update(dbRef(db, `sales/${saleId}`), {
        items: selectedItems.value,
        total,
        totalProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    await loadSalesByDate(selectedDate.value);
}

function onDetailDialogClose() {
    dialogVisible.value = false;
    showDetailActions.value = false;
    editingDetailRow.value = null;
}

function toggleDetailEditMode() {
    if (showDetailActions.value) {
        editingDetailRow.value = null;
        showDetailActions.value = false;
    } else {
        showDetailActions.value = true;
    }
}

watch(dateFilterMode, (mode) => {
    if (mode === "day") {
        selectedDate.value = getToday();
    } else {
        selectedDate.value = getCurrentMonth();
    }

    loadSalesByDate(selectedDate.value);
});

watch(selectedDate, (val) => {
    if (!val) return;
    loadSalesByDate(val);
});

onMounted(() => {
    selectedDate.value = getToday();
    loadSalesByDate(selectedDate.value);
});
</script>

<style scoped>
.sales-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

.sales-hero {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    justify-content: space-between;
    gap: 18px;
    padding: 28px;
    border-radius: 30px;
    background:
        radial-gradient(circle at top right, rgba(232, 190, 123, 0.2), transparent 36%),
        linear-gradient(135deg, #0d2037 0%, #173255 52%, #21456d 100%);
    box-shadow: 0 26px 60px rgba(13, 29, 49, 0.22);
}

.hero-copy {
    max-width: 620px;
}

.page-eyebrow,
.section-eyebrow {
    display: inline-block;
    letter-spacing: 0.18em;
    font-size: 0.74rem;
    font-weight: 700;
    color: rgba(232, 190, 123, 0.9);
}

.hero-copy h2 {
    margin: 10px 0 8px;
    color: #f4f8fc;
    font-size: clamp(1.8rem, 2.5vw, 2.5rem);
    font-weight: 700;
}

.hero-copy p {
    margin: 0;
    max-width: 58ch;
    color: rgba(232, 238, 246, 0.8);
    line-height: 1.7;
}

.hero-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(140px, 1fr));
    gap: 14px;
    flex: 1 1 320px;
}

.hero-badge {
    min-height: 112px;
    padding: 18px 20px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    background: rgba(255, 255, 255, 0.06);
}

.hero-badge strong {
    display: block;
    color: #f5f8fc;
    font-size: 1.5rem;
    font-weight: 700;
}

.hero-badge span {
    display: block;
    margin-top: 8px;
    color: rgba(232, 238, 246, 0.72);
}

.filter-card,
.table-card {
    border: 1px solid var(--surface-border);
    border-radius: 28px;
    background: var(--surface-card);
    box-shadow: var(--surface-shadow);
}

.filter-card {
    padding: 24px;
}

.filter-head,
.table-header,
.detail-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
}

.filter-head h3,
.table-header h3 {
    margin: 8px 0 0;
    color: var(--heading-color);
    font-size: 1.45rem;
    font-weight: 700;
}

.filter-actions,
.detail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.filter-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 220px minmax(180px, 240px);
    gap: 12px;
    margin-top: 18px;
}

.range-badge {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    padding: 12px 14px;
    border-radius: 16px;
    background: var(--surface-muted);
    color: var(--muted-text);
}

.range-badge strong {
    color: var(--heading-color);
}

.secondary-btn {
    border-color: rgba(20, 36, 58, 0.12);
    background: rgba(255, 255, 255, 0.84);
    color: var(--heading-color);
}

.table-card {
    padding: 24px;
}

.table-header {
    margin-bottom: 18px;
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

.sales-table,
.detail-table,
.analysis-table {
    border: 1px solid var(--surface-border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--surface-shadow);
}

:deep(.el-table th) {
    font-weight: 700;
    text-align: center;
}

:deep(.no-padding-cell .cell) {
    padding: 0 !important;
}

.index-text {
    font-size: 12px;
}

.amount-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--heading-color);
}

.profit-value {
    color: #1d8f50;
    font-weight: 700;
}

.profit-negative {
    color: #d94e4e !important;
}

.row-action-stack {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.row-action-btn {
    width: 100%;
}

.row-action-stack :deep(.el-button + .el-button),
.filter-actions :deep(.el-button + .el-button),
.detail-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}

.empty-state {
    padding: 20px 22px;
    border: 1px dashed var(--surface-border);
    border-radius: 20px;
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
    margin: 8px 0 0;
    line-height: 1.7;
}

.detail-summary-card {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    flex: 1;
    padding: 18px;
    border: 1px solid var(--surface-border);
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(243, 246, 249, 0.96));
}

.detail-summary-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.detail-summary-item span {
    color: var(--muted-text);
    font-size: 0.9rem;
}

.detail-summary-item strong {
    color: var(--heading-color);
}

.product-image-box {
    width: 70px;
    height: 70px;
    margin: 0 auto;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
}

.product-image-box--large {
    width: 92px;
    height: 92px;
}

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-image-fallback {
    font-size: 32px;
    color: #c4ccd6;
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

.detail-number {
    width: 100%;
}

.analysis-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.analysis-title strong {
    font-size: 1.2rem;
    color: var(--heading-color);
}

.analysis-title span {
    color: var(--muted-text);
}

.analysis-summary {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
}

.summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--surface-muted);
    color: var(--muted-text);
}

.summary-row strong {
    color: var(--heading-color);
    font-size: 1rem;
}

:deep(.detail-dialog .el-dialog),
:deep(.analysis-dialog .el-dialog) {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.98);
}

:deep(.detail-dialog .el-dialog__header),
:deep(.analysis-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 24px 24px 0;
}

:deep(.detail-dialog .el-dialog__body),
:deep(.analysis-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
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

@media (max-width: 1180px) {
    .filter-grid {
        grid-template-columns: 1fr 1fr;
    }

    .hero-metrics {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 900px) {
    .detail-summary-card {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .sales-hero,
    .filter-card,
    .table-card {
        padding: 18px;
        border-radius: 22px;
    }

    .filter-head,
    .table-header,
    .detail-header {
        flex-direction: column;
        align-items: stretch;
    }

    .filter-grid {
        grid-template-columns: 1fr;
    }
}
</style>
