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
                    <el-button
                        :class="['filter-toolbar-btn', showActions ? 'filter-toolbar-btn--active' : 'filter-toolbar-btn--secondary']"
                        @click="toggleEditMode">
                        {{ showActions ? "關閉編輯模式" : "開啟編輯模式" }}
                    </el-button>
                </div>
            </div>

            <div class="filter-grid">
                <el-input v-model="searchKeyword" placeholder="搜尋商品名稱" clearable class="search-input"
                    @input="filterSales" />

                <el-select v-model="dateFilterMode" class="mode-select">
                    <el-option label="按月份" value="month" />
                    <el-option label="按日期" value="day" />
                </el-select>

                <el-date-picker v-model="selectedDate" :type="dateFilterMode === 'day' ? 'date' : 'month'"
                    :format="dateFilterMode === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM'"
                    :value-format="dateFilterMode === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM'" clearable style="width: 100%" />
            </div>

            <div class="analysis-preview">
                <div class="analysis-preview-head">
                    <div>
                        <span class="preview-eyebrow">分析摘要</span>
                        <strong>付款方式分析</strong>
                    </div>
                    <el-button type="primary" class="analysis-trigger-btn" @click="showPaymentStats">
                        圖表分析
                    </el-button>
                </div>

                <div class="analysis-preview-metrics">
                    <div class="preview-metric">
                        <span>紀錄筆數</span>
                        <strong>{{ totalSalesCount }}</strong>
                    </div>
                    <div class="preview-metric">
                        <span>付款方式數</span>
                        <strong>{{ activePaymentMethodCount }}</strong>
                    </div>
                    <div class="preview-metric">
                        <span>毛利率</span>
                        <strong :class="{ 'profit-negative': filteredProfitRate < 0 }">
                            {{ filteredProfitRate }}%
                        </strong>
                    </div>
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

            <el-table v-if="filteredSales.length" :data="filteredSales" border class="sales-table"
                :class="tableThemeClass"
                :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }">
                <el-table-column class-name="no-padding-cell" label="#" width="38" align="center">
                    <template #default="{ $index }">
                        <span class="index-text">{{ $index + 1 }}</span>
                    </template>
                </el-table-column>

                <el-table-column v-if="showActions" fixed="left" label="操作" width="152" align="center">
                    <template #default="{ row }">
                        <div class="row-action-stack">
                            <el-button v-if="editingRow !== row" size="small" type="primary"
                                class="row-action-btn sales-row-btn sales-row-btn--edit" @click="startEditTime(row)">
                                編輯
                            </el-button>
                            <el-button v-if="editingRow === row" size="small" type="primary"
                                class="row-action-btn sales-row-btn sales-row-btn--save" @click="saveEditTime(row)">
                                儲存
                            </el-button>
                            <el-button v-if="editingRow === row" size="small"
                                class="row-action-btn sales-row-btn sales-row-btn--cancel" @click="cancelEditTime">
                                取消
                            </el-button>
                            <el-button size="small" type="danger"
                                class="row-action-btn sales-row-btn sales-row-btn--delete" @click="deleteSale(row)">
                                刪除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="timestamp" label="日期時間" width="180">
                    <template #default="{ row }">
                        <div v-if="editingRow === row">
                            <el-date-picker v-model="editingTimestamp" type="datetime" format="YYYY-MM-DD HH:mm"
                                value-format="x" size="small" style="width: 150px;" />
                        </div>
                        <div v-else>{{ formatDate(row.timestamp) }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="total" label="總金額" width="140" align="center">
                    <template #default="{ row }">
                        <span class="amount-value">NT$ {{ formatCurrency(row.total) }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="totalProfit" label="總毛利" width="140" align="center">
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
                                <el-option v-for="opt in paymentMethodOptions" :key="opt.value" :label="opt.label"
                                    :value="opt.value" />
                            </el-select>
                        </div>
                        <div v-else>{{ paymentMethodMap[row.paymentMethod || ""] || "-" }}</div>
                    </template>
                </el-table-column>

                <el-table-column prop="operator" label="操作人員" width="120" />

                <el-table-column label="商品明細" width="120" align="center">
                    <template #default="{ row }">
                        <el-button size="small" class="detail-view-btn"
                            @click="showDetails(row.items, row.operator, row.total, row.totalProfit ?? 0, row.id)">
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

        <el-dialog v-model="dialogVisible" width="min(94vw, 1380px)" class="detail-dialog" @close="onDetailDialogClose">
            <template #title>
                <div class="detail-dialog-title">
                    <strong>商品明細</strong>
                    <span>{{ selectedItems.length }} 項商品{{ selectedOperator ? ` / ${selectedOperator}` : "" }}</span>
                </div>
            </template>

            <div class="detail-header">
                <div class="detail-summary-card">
                    <div class="detail-summary-item">
                        <span>銷售總額</span>
                        <strong>NT$ {{ formatCurrency(selectedTotal) }}</strong>
                    </div>
                    <div class="detail-summary-item">
                        <span>總毛利</span>
                        <strong :class="{ 'profit-negative': selectedProfit < 0 }">NT$ {{ formatCurrency(selectedProfit)
                        }}</strong>
                    </div>
                    <div class="detail-summary-item">
                        <span>操作人員</span>
                        <strong>{{ selectedOperator || "-" }}</strong>
                    </div>
                </div>

                <div class="detail-actions">
                    <el-button type="primary" size="small" class="detail-toolbar-btn detail-toolbar-btn--primary"
                        @click="addNewDetailItem">新增商品</el-button>
                    <el-button size="small" class="detail-toolbar-btn detail-toolbar-btn--secondary"
                        @click="toggleDetailEditMode">
                        {{ showDetailActions ? "關閉編輯模式" : "開啟編輯模式" }}
                    </el-button>
                </div>
            </div>

            <div class="detail-table-wrap">
                <el-table :data="selectedItems" border size="small" class="detail-table" :class="tableThemeClass"
                    :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }">
                    <el-table-column label="#" width="48" align="center">
                        <template #default="{ $index }">{{ $index + 1 }}</template>
                    </el-table-column>

                    <el-table-column v-if="showDetailActions" label="操作" width="108" align="center">
                        <template #default="{ row }">
                            <div class="row-action-stack">
                                <template v-if="editingDetailRow === row">
                                    <el-button size="small" type="primary"
                                        class="row-action-btn detail-row-btn detail-row-btn--save"
                                        @click="saveDetailEdit(row)">
                                        儲存
                                    </el-button>
                                    <el-button size="small" class="row-action-btn detail-row-btn detail-row-btn--cancel"
                                        @click="editingDetailRow = null">
                                        取消
                                    </el-button>
                                </template>
                                <template v-else>
                                    <el-button size="small" type="primary"
                                        class="row-action-btn detail-row-btn detail-row-btn--edit"
                                        @click="editingDetailRow = row">
                                        編輯
                                    </el-button>
                                    <el-button size="small" type="danger"
                                        class="row-action-btn detail-row-btn detail-row-btn--delete"
                                        @click="deleteDetailItem(row)">
                                        刪除
                                    </el-button>
                                </template>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column label="商品圖片" width="120" align="center">
                        <template #default="{ row }">
                            <button type="button"
                                :class="['product-image-box', 'product-image-box--large', { 'product-image-box--clickable': !!row.imageUrl }]"
                                :disabled="!row.imageUrl"
                                :aria-label="row.imageUrl ? `放大查看 ${row.name || '商品圖片'}` : '此商品沒有圖片'"
                                @click="row.imageUrl && openDetailImagePreview(row.imageUrl, row.name)">
                                <img v-if="row.imageUrl" :src="row.imageUrl" alt="商品圖片" class="product-image" />
                                <el-icon v-else class="product-image-fallback">
                                    <Picture />
                                </el-icon>
                            </button>
                        </template>
                    </el-table-column>

                    <el-table-column prop="name" label="商品名稱" min-width="180">
                        <template #default="{ row }">
                            <div v-if="editingDetailRow === row">
                                <el-input v-model="row.name" size="small" placeholder="輸入商品名稱" />
                            </div>
                            <div v-else>
                                <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer"
                                    class="product-link">
                                    {{ row.name }}
                                </a>
                                <span v-else>{{ row.name }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="code" label="商品編號" width="120">
                        <template #default="{ row }">
                            <el-input v-if="editingDetailRow === row" v-model="row.code" size="small"
                                placeholder="輸入商品編號" />
                            <div v-else>{{ row.code }}</div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="gtin" label="GTIN" width="120">
                        <template #default="{ row }">
                            <el-input v-if="editingDetailRow === row" v-model="row.gtin" size="small"
                                placeholder="輸入 GTIN" />
                            <div v-else>{{ row.gtin }}</div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="sellingPrice" label="售價" width="120">
                        <template #default="{ row }">
                            <el-input-number v-if="editingDetailRow === row" v-model="row.sellingPrice" :min="0"
                                size="small" class="detail-number" />
                            <div v-else>NT$ {{ formatCurrency(row.sellingPrice) }}</div>
                        </template>
                    </el-table-column>

                    <el-table-column prop="quantity" label="數量" width="110">
                        <template #default="{ row }">
                            <el-input-number v-if="editingDetailRow === row" v-model="row.quantity" :min="0"
                                size="small" class="detail-number" />
                            <div v-else>{{ row.quantity }}</div>
                        </template>
                    </el-table-column>

                    <el-table-column label="小計" width="120">
                        <template #default="{ row }">NT$ {{ formatCurrency(row.sellingPrice * row.quantity)
                            }}</template>
                    </el-table-column>

                    <el-table-column prop="price" label="定價" width="100">
                        <template #default="{ row }">NT$ {{ formatCurrency(row.price) }}</template>
                    </el-table-column>

                    <el-table-column prop="cost" label="成本" width="120">
                        <template #default="{ row }">
                            <el-input-number v-if="editingDetailRow === row" v-model="row.cost" :min="0" size="small"
                                class="detail-number" />
                            <div v-else>NT$ {{ formatCurrency(row.cost ?? 0) }}</div>
                        </template>
                    </el-table-column>

                    <el-table-column label="單件毛利" width="120">
                        <template #default="{ row }">
                            <span
                                :class="['profit-value', { 'profit-negative': row.sellingPrice - (row.cost ?? 0) < 0 }]">
                                NT$ {{ formatCurrency(row.sellingPrice - (row.cost ?? 0)) }}
                            </span>
                        </template>
                    </el-table-column>

                    <el-table-column label="預估總毛利" width="130">
                        <template #default="{ row }">
                            <span
                                :class="['profit-value', { 'profit-negative': (row.sellingPrice - (row.cost ?? 0)) * row.quantity < 0 }]">
                                NT$ {{ formatCurrency((row.sellingPrice - (row.cost ?? 0)) * row.quantity) }}
                            </span>
                        </template>
                    </el-table-column>

                    <el-table-column prop="website" label="網站連結" width="180">
                        <template #default="{ row }">
                            <el-input v-if="editingDetailRow === row" v-model="row.website" size="small"
                                placeholder="輸入網站連結" />
                            <div v-else>
                                <a v-if="row.website" :href="row.website" target="_blank" rel="noopener noreferrer"
                                    class="site-link">連結</a>
                                <span v-else>-</span>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </el-dialog>

        <el-dialog v-model="detailImagePreviewVisible" width="min(92vw, 760px)" class="image-preview-dialog"
            append-to-body>
            <template #title>
                <div class="image-preview-title">
                    <strong>{{ detailImagePreviewName || "商品圖片" }}</strong>
                    <span>點擊外部區域即可關閉</span>
                </div>
            </template>

            <div class="image-preview-frame">
                <img v-if="detailImagePreviewUrl" :src="detailImagePreviewUrl" :alt="detailImagePreviewName || '商品圖片'"
                    class="image-preview-full" />
            </div>

            <template #footer>
                <div class="dialog-footer">
                    <el-button class="detail-toolbar-btn detail-toolbar-btn--secondary" @click="detailImagePreviewVisible = false">
                        關閉
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="salesAnalysisDialog" width="min(94vw, 860px)" class="analysis-dialog">
            <template #title>
                <div class="analysis-title">
                    <strong>銷售分析</strong>
                    <span>{{ paymentStatsDateRangeText }}</span>
                </div>
            </template>

            <div class="analysis-summary">
                <div class="summary-card">
                    <span>總銷售額</span>
                    <strong>NT$ {{ formatCurrency(paymentStatsTotal) }}</strong>
                </div>
                <div class="summary-card">
                    <span>總毛利</span>
                    <strong :class="{ 'profit-negative': paymentStatsTotalProfit < 0 }">
                        NT$ {{ formatCurrency(paymentStatsTotalProfit) }}
                    </strong>
                </div>
                <div class="summary-card">
                    <span>毛利率</span>
                    <strong :class="{ 'profit-negative': paymentStatsProfitRate < 0 }">
                        {{ paymentStatsProfitRate }}%
                    </strong>
                </div>
            </div>

            <div v-if="paymentStats.length" class="analysis-visuals">
                <section class="visual-card">
                    <div class="visual-head">
                        <div>
                            <span class="visual-eyebrow">營收占比</span>
                            <strong>付款方式分布</strong>
                        </div>
                        <span class="visual-highlight">
                            {{ topPaymentMethodLabel }} {{ topPaymentMethodShare.toFixed(1) }}%
                        </span>
                    </div>

                    <div ref="salesDistributionChartRef" class="visual-chart" />

                    <div class="visual-legend">
                        <div v-for="row in paymentChartRows" :key="`${row.method}-sales`" class="legend-item">
                            <span class="legend-dot" :style="{ background: row.color }" />
                            <span class="legend-label">{{ row.label }}</span>
                            <strong class="legend-value">NT$ {{ formatCurrency(row.total) }}</strong>
                            <span class="legend-meta">{{ row.count }} 筆 / {{ row.totalShare.toFixed(1) }}%</span>
                        </div>
                    </div>
                </section>

                <section class="visual-card">
                    <div class="visual-head">
                        <div>
                            <span class="visual-eyebrow">毛利表現</span>
                            <strong>付款方式比較</strong>
                        </div>
                        <span class="visual-highlight">平均客單 NT$ {{ formatCurrency(averageOrderValue) }}</span>
                    </div>

                    <div ref="profitComparisonChartRef" class="visual-chart visual-chart--wide" />
                    <p class="visual-caption">柱狀圖顯示總毛利，折線顯示毛利率。</p>
                </section>

                <section class="visual-card visual-card--full">
                    <div class="visual-head">
                        <div>
                            <span class="visual-eyebrow">時段趨勢</span>
                            <strong>每小時訂單數量</strong>
                        </div>
                        <span class="visual-highlight">{{ busiestHourLabel }} 共有 {{ busiestHourCount }} 筆</span>
                    </div>

                    <div ref="hourlyOrdersChartRef" class="visual-chart visual-chart--timeline" />
                    <p class="visual-caption">依目前篩選條件統計各時段訂單數量，可快速看出尖峰時段。</p>
                </section>
            </div>

            <div v-if="paymentStats.length" class="analysis-table-wrap">
                <el-table :data="paymentStats" border size="small" class="analysis-table" :class="tableThemeClass"
                    :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }">
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
            </div>
            <div v-else class="analysis-empty">
                <strong>目前篩選條件下沒有可分析的付款資料。</strong>
                <p>請調整日期或商品關鍵字後，再重新開啟分析。</p>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import * as echarts from "echarts";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Picture } from "@element-plus/icons-vue";
import { useAuth } from "@/composables/useAuth";
import { useThemeStore } from "@/stores/theme";
import { deleteSaleById, fetchSalesInRange, updateSale } from "@/services/sales";

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

const paymentMethodColorMap: Record<string, string> = {
    cash: "#d6a46b",
    credit_card: "#4d83b4",
    line_pay: "#4fb27a",
    px_pay: "#dd7b55",
    unknown: "#8193a8",
};
const defaultPaymentChartColor = "#8193a8";

const sales = ref<Sale[]>([]);
const filteredSales = ref<Sale[]>([]);
const selectedItems = ref<SaleItem[]>([]);
const selectedOperator = ref("");
const selectedTotal = ref(0);
const selectedProfit = ref(0);
const dialogVisible = ref(false);
const detailImagePreviewVisible = ref(false);
const detailImagePreviewUrl = ref("");
const detailImagePreviewName = ref("");
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
const salesDistributionChartRef = ref<HTMLDivElement | null>(null);
const profitComparisonChartRef = ref<HTMLDivElement | null>(null);
const hourlyOrdersChartRef = ref<HTMLDivElement | null>(null);
const showDetailActions = ref(false);
const editingDetailRow = ref<SaleItem | null>(null);
let currentEditingSaleId: string | null = null;
let salesDistributionChart: ReturnType<typeof echarts.init> | null = null;
let profitComparisonChart: ReturnType<typeof echarts.init> | null = null;
let hourlyOrdersChart: ReturnType<typeof echarts.init> | null = null;

function getSaleById(id?: string | null) {
    if (!id) return null;
    return sales.value.find((sale) => sale.id === id) ?? null;
}

function upsertLocalSale(nextSale: Sale) {
    sales.value = [nextSale, ...sales.value.filter((sale) => sale.id !== nextSale.id)]
        .sort((a, b) => b.timestamp - a.timestamp);
    filterSales();
}

function removeLocalSale(id: string) {
    sales.value = sales.value.filter((sale) => sale.id !== id);
    filterSales();
}

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

    await updateSale({
        id: row.id,
        timestamp: editingTimestamp.value ?? row.timestamp,
        total: row.total,
        totalProfit: newTotalProfit,
        items: row.items,
        operator: row.operator,
        paymentMethod: row.paymentMethod || "",
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    upsertLocalSale({
        ...row,
        timestamp: editingTimestamp.value ?? row.timestamp,
        totalProfit: newTotalProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    ElMessage.success("銷售紀錄已更新。");
    editingRow.value = null;
    editingTimestamp.value = null;
}

async function deleteSale(sale: Sale) {
    try {
        await ElMessageBox.confirm("確定要刪除這筆銷售紀錄嗎？", "刪除確認", {
            confirmButtonText: "刪除",
            cancelButtonText: "取消",
            type: "warning",
        });

        if (sale.id) {
            await deleteSaleById(sale.id);
            removeLocalSale(sale.id);
            ElMessage.success("刪除成功。");
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

    sales.value = await fetchSalesInRange(startTime, endTime);

    filterSales();
}

const totalSalesCount = computed(() => filteredSales.value.length);
const totalFilteredSales = computed(() => filteredSales.value.reduce((sum, sale) => sum + sale.total, 0));
const totalFilteredProfit = computed(() => filteredSales.value.reduce((sum, sale) => sum + (sale.totalProfit ?? 0), 0));
const filteredProfitRate = computed(() =>
    totalFilteredSales.value ? parseFloat(((totalFilteredProfit.value / totalFilteredSales.value) * 100).toFixed(2)) : 0
);
const activePaymentMethodCount = computed(() => new Set(filteredSales.value.map((sale) => sale.paymentMethod || "unknown")).size);
const averageOrderValue = computed(() => (totalSalesCount.value ? totalFilteredSales.value / totalSalesCount.value : 0));
const paymentChartRows = computed(() =>
    paymentStats.value
        .map((stat) => {
            const totalShare = paymentStatsTotal.value ? (stat.total / paymentStatsTotal.value) * 100 : 0;
            return {
                ...stat,
                label: paymentMethodMap[stat.method] || stat.method,
                color: paymentMethodColorMap[stat.method] || defaultPaymentChartColor,
                totalShare,
                averageTicket: stat.count ? stat.total / stat.count : 0,
                profitRate: stat.total ? Number(((stat.profit / stat.total) * 100).toFixed(1)) : 0,
            };
        })
        .sort((a, b) => b.total - a.total)
);
const topPaymentMethodLabel = computed(() => paymentChartRows.value[0]?.label || "—");
const topPaymentMethodShare = computed(() => paymentChartRows.value[0]?.totalShare ?? 0);
const hourlyOrderTrend = computed(() => {
    const hours = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: `${String(hour).padStart(2, "0")}:00 - ${String((hour + 1) % 24).padStart(2, "0")}:00`,
        shortLabel: `${String(hour).padStart(2, "0")}:00`,
        count: 0,
    }));

    filteredSales.value.forEach((sale) => {
        const hour = new Date(sale.timestamp).getHours();
        const targetHour = hours[hour];
        if (targetHour) targetHour.count += 1;
    });

    return hours;
});
const busiestHourEntry = computed(() =>
    hourlyOrderTrend.value.reduce(
        (peak, entry) => (entry.count > peak.count ? entry : peak),
        hourlyOrderTrend.value[0] ?? { hour: 0, label: "00:00 - 01:00", shortLabel: "00:00", count: 0 }
    )
);
const busiestHourLabel = computed(() => busiestHourEntry.value.label);
const busiestHourCount = computed(() => busiestHourEntry.value.count);
const chartTextColor = computed(() => (themeStore.isDarkTheme ? "#d9e2ef" : "#32465b"));
const chartMutedColor = computed(() => (themeStore.isDarkTheme ? "#95a7bb" : "#72859a"));
const chartGridColor = computed(() => (themeStore.isDarkTheme ? "rgba(255, 255, 255, 0.08)" : "rgba(20, 36, 58, 0.08)"));
const chartTooltipBackground = computed(() => (themeStore.isDarkTheme ? "rgba(7, 18, 30, 0.94)" : "rgba(255, 255, 255, 0.96)"));
const chartDialogSurface = computed(() => (themeStore.isDarkTheme ? "#10243c" : "#f7fafc"));
const chartSeriesBorderColor = computed(() => (themeStore.isDarkTheme ? "#10243c" : "#ffffff"));

function ensureChart(
    chartRef: HTMLDivElement | null,
    currentChart: ReturnType<typeof echarts.init> | null
): ReturnType<typeof echarts.init> | null {
    if (!chartRef) return null;
    return currentChart ?? echarts.getInstanceByDom(chartRef) ?? echarts.init(chartRef);
}

function renderAnalysisCharts() {
    if (!salesAnalysisDialog.value || !paymentChartRows.value.length) return;

    salesDistributionChart = ensureChart(salesDistributionChartRef.value, salesDistributionChart);
    profitComparisonChart = ensureChart(profitComparisonChartRef.value, profitComparisonChart);
    hourlyOrdersChart = ensureChart(hourlyOrdersChartRef.value, hourlyOrdersChart);

    if (!salesDistributionChart || !profitComparisonChart || !hourlyOrdersChart) return;

    const rows = paymentChartRows.value;
    const labels: string[] = rows.map((row) => row.label || row.method);
    const colors: string[] = rows.map((row) => row.color || defaultPaymentChartColor);

    salesDistributionChart.setOption({
        animationDuration: 500,
        color: colors,
        tooltip: {
            trigger: "item",
            backgroundColor: chartTooltipBackground.value,
            borderColor: "transparent",
            padding: [10, 12],
            textStyle: { color: chartTextColor.value },
            formatter: (params: { name: string; value: number; percent: number }) =>
                `${params.name}<br/>營收：NT$ ${formatCurrency(params.value)}<br/>占比：${params.percent}%`,
        },
        title: {
            text: `NT$ ${formatCurrency(paymentStatsTotal.value)}`,
            subtext: "總營收",
            left: "center",
            top: "38%",
            textStyle: {
                color: chartTextColor.value,
                fontSize: 20,
                fontWeight: 700,
            },
            subtextStyle: {
                color: chartMutedColor.value,
                fontSize: 12,
                fontWeight: 600,
            },
        },
        series: [
            {
                type: "pie",
                radius: ["56%", "78%"],
                center: ["50%", "52%"],
                avoidLabelOverlap: true,
                minAngle: 8,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: chartSeriesBorderColor.value,
                    borderWidth: 4,
                },
                label: { show: false },
                labelLine: { show: false },
                emphasis: {
                    scale: true,
                    scaleSize: 8,
                },
                data: rows.map((row) => ({
                    name: row.label,
                    value: row.total,
                    itemStyle: { color: row.color },
                })),
            },
        ],
    });

    profitComparisonChart.setOption({
        animationDuration: 500,
        grid: {
            left: 44,
            right: 28,
            top: 34,
            bottom: 42,
        },
        tooltip: {
            trigger: "axis",
            backgroundColor: chartTooltipBackground.value,
            borderColor: "transparent",
            padding: [10, 12],
            textStyle: { color: chartTextColor.value },
            axisPointer: {
                type: "shadow",
                shadowStyle: {
                    color: themeStore.isDarkTheme ? "rgba(255, 255, 255, 0.06)" : "rgba(20, 36, 58, 0.06)",
                },
            },
        },
        legend: {
            top: 0,
            icon: "roundRect",
            itemWidth: 14,
            itemHeight: 10,
            textStyle: { color: chartMutedColor.value },
            data: ["總毛利", "毛利率"],
        },
        xAxis: {
            type: "category",
            data: labels,
            axisLine: { lineStyle: { color: chartGridColor.value } },
            axisLabel: {
                color: chartMutedColor.value,
                fontSize: 12,
            },
            axisTick: { show: false },
        },
        yAxis: [
            {
                type: "value",
                name: "毛利",
                axisLabel: {
                    color: chartMutedColor.value,
                    formatter: (value: number) => `NT$ ${formatCurrency(value)}`,
                },
                splitLine: {
                    lineStyle: {
                        color: chartGridColor.value,
                        type: "dashed",
                    },
                },
            },
            {
                type: "value",
                name: "毛利率",
                axisLabel: {
                    color: chartMutedColor.value,
                    formatter: (value: number) => `${value}%`,
                },
                splitLine: { show: false },
            },
        ],
        series: [
            {
                name: "總毛利",
                type: "bar",
                barWidth: 28,
                itemStyle: {
                    borderRadius: [10, 10, 4, 4],
                },
                data: rows.map((row) => ({
                    value: row.profit,
                    itemStyle: { color: row.profit < 0 ? "#d95c5c" : row.color },
                })),
            },
            {
                name: "毛利率",
                type: "line",
                yAxisIndex: 1,
                smooth: true,
                symbolSize: 9,
                lineStyle: { width: 3, color: "#f0c998" },
                itemStyle: { color: "#f0c998" },
                areaStyle: {
                    color: "rgba(240, 201, 152, 0.14)",
                },
                data: rows.map((row) => row.profitRate),
            },
        ],
    });

    const hourlyLabels: string[] = hourlyOrderTrend.value.map((entry) => entry.shortLabel);
    const hourlyCounts: number[] = hourlyOrderTrend.value.map((entry) => entry.count);

    hourlyOrdersChart.setOption({
        animationDuration: 500,
        grid: {
            left: 34,
            right: 22,
            top: 24,
            bottom: 34,
        },
        tooltip: {
            trigger: "axis",
            backgroundColor: chartTooltipBackground.value,
            borderColor: "transparent",
            padding: [10, 12],
            textStyle: { color: chartTextColor.value },
            formatter: (params: Array<{ axisValue: string; data: number }>) => {
                const point = params[0];
                if (!point) return "";
                const source = hourlyOrderTrend.value.find((entry) => entry.shortLabel === point.axisValue);
                return `${source?.label || point.axisValue}<br/>訂單數量：${point.data} 筆`;
            },
        },
        xAxis: {
            type: "category",
            boundaryGap: false,
            data: hourlyLabels,
            axisLine: { lineStyle: { color: chartGridColor.value } },
            axisLabel: {
                color: chartMutedColor.value,
                fontSize: 11,
                interval: 1,
            },
            axisTick: { show: false },
        },
        yAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: {
                color: chartMutedColor.value,
                formatter: (value: number) => `${value}`,
            },
            splitLine: {
                lineStyle: {
                    color: chartGridColor.value,
                    type: "dashed",
                },
            },
        },
        series: [
            {
                name: "訂單數量",
                type: "line",
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                lineStyle: {
                    width: 3,
                    color: "#4d83b4",
                },
                itemStyle: {
                    color: "#d6a46b",
                    borderColor: chartSeriesBorderColor.value,
                    borderWidth: 2,
                },
                areaStyle: {
                    color: themeStore.isDarkTheme ? "rgba(77, 131, 180, 0.24)" : "rgba(77, 131, 180, 0.16)",
                },
                data: hourlyCounts,
                markPoint: {
                    symbol: "roundRect",
                    symbolSize: [88, 30],
                    itemStyle: {
                        color: "#d6a46b",
                        borderRadius: 10,
                    },
                    label: {
                        color: "#10243c",
                        fontWeight: 700,
                        formatter: ({ data }: { data?: { value?: number } }) => `高峰 ${data?.value ?? 0} 筆`,
                    },
                    data: [
                        {
                            coord: [busiestHourEntry.value.shortLabel, busiestHourEntry.value.count],
                            value: busiestHourEntry.value.count,
                        },
                    ],
                },
            },
        ],
    });
}

function resizeAnalysisCharts() {
    salesDistributionChart?.resize();
    profitComparisonChart?.resize();
    hourlyOrdersChart?.resize();
}

function disposeAnalysisCharts() {
    salesDistributionChart?.dispose();
    profitComparisonChart?.dispose();
    hourlyOrdersChart?.dispose();
    salesDistributionChart = null;
    profitComparisonChart = null;
    hourlyOrdersChart = null;
}

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

function openDetailImagePreview(imageUrl: string, productName?: string) {
    detailImagePreviewUrl.value = imageUrl;
    detailImagePreviewName.value = productName || "商品圖片";
    detailImagePreviewVisible.value = true;
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

    const currentSale = getSaleById(currentEditingSaleId);
    if (!currentSale) {
        ElMessage.error("找不到對應的銷售紀錄");
        return;
    }

    await updateSale({
        id: currentEditingSaleId,
        timestamp: currentSale.timestamp,
        total: newTotal,
        totalProfit: newProfit,
        items: selectedItems.value,
        operator: currentSale.operator,
        paymentMethod: currentSale.paymentMethod || "",
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    upsertLocalSale({
        ...currentSale,
        items: selectedItems.value.map((entry) => ({ ...entry })),
        total: newTotal,
        totalProfit: newProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    selectedTotal.value = newTotal;
    selectedProfit.value = newProfit;

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
                updateDetailItems();
            }
        })
        .catch(() => {
            ElMessage.info("已取消刪除。");
        });
}

async function updateDetailItems() {
    const saleId = currentEditingSaleId;
    if (!saleId) return;

    const currentSale = getSaleById(saleId);
    if (!currentSale) return;

    const total = selectedItems.value.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
    const totalProfit = selectedItems.value.reduce((sum, item) => sum + ((item.sellingPrice - (item.cost ?? 0)) * item.quantity), 0);

    await updateSale({
        id: saleId,
        timestamp: currentSale.timestamp,
        total,
        totalProfit,
        items: selectedItems.value,
        operator: currentSale.operator,
        paymentMethod: currentSale.paymentMethod || "",
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });

    upsertLocalSale({
        ...currentSale,
        items: selectedItems.value.map((entry) => ({ ...entry })),
        total,
        totalProfit,
        updater: `${user.value?.displayName || ""}(${getDeviceInfoShort()})`,
    });
}

function onDetailDialogClose() {
    dialogVisible.value = false;
    showDetailActions.value = false;
    editingDetailRow.value = null;
    detailImagePreviewVisible.value = false;
    detailImagePreviewUrl.value = "";
    detailImagePreviewName.value = "";
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

watch(
    [salesAnalysisDialog, paymentStats, () => themeStore.isDarkTheme],
    async ([isOpen]) => {
        if (!isOpen) {
            disposeAnalysisCharts();
            return;
        }

        await nextTick();
        requestAnimationFrame(() => {
            renderAnalysisCharts();
            resizeAnalysisCharts();
        });
    },
    { deep: true }
);

onMounted(() => {
    window.addEventListener("resize", resizeAnalysisCharts);
    selectedDate.value = getToday();
    loadSalesByDate(selectedDate.value);
});

onBeforeUnmount(() => {
    window.removeEventListener("resize", resizeAnalysisCharts);
    disposeAnalysisCharts();
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

.filter-actions .secondary-btn {
    display: none;
}

.filter-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 120px 220px;
    gap: 12px;
    margin-top: 18px;
    align-items: stretch;
}

.filter-grid>* {
    min-width: 0;
}

.search-input :deep(.el-input__wrapper) {
    min-height: 40px;
}

.analysis-preview {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 16px;
    padding: 18px;
    border: 1px solid var(--surface-border);
    border-radius: 22px;
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.14), transparent 30%),
        linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 92%, transparent), var(--surface-card));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.analysis-preview-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
}

.preview-eyebrow {
    display: inline-flex;
    color: var(--accent-color);
    font-size: 0.74rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
}

.analysis-preview-head strong {
    display: block;
    margin-top: 8px;
    color: var(--heading-color);
    font-size: 1.08rem;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
}

.analysis-trigger-btn {
    min-height: 42px;
    padding: 0 18px;
    border-radius: 14px;
    border: 1px solid rgba(214, 164, 107, 0.38);
    background:
        radial-gradient(circle at top right, rgba(255, 214, 153, 0.24), transparent 42%),
        linear-gradient(135deg, #b97837 0%, #d6a46b 52%, #f0c998 100%);
    color: #10243c;
    font-weight: 700;
    letter-spacing: 0.04em;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.28),
        0 16px 28px rgba(185, 122, 55, 0.26);
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        filter 0.18s ease,
        border-color 0.18s ease;
}

.analysis-trigger-btn:hover,
.analysis-trigger-btn:focus-visible {
    transform: translateY(-1px);
    border-color: rgba(214, 164, 107, 0.62);
    color: #10243c;
    filter: saturate(1.05);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.34),
        0 20px 32px rgba(185, 122, 55, 0.32);
}

.analysis-trigger-btn:active {
    transform: translateY(0);
}

.analysis-preview-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.preview-metric {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--surface-muted) 88%, var(--surface-card));
    border: 1px solid var(--surface-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.preview-metric span {
    color: var(--muted-text);
    font-size: 0.84rem;
}

.preview-metric strong {
    color: var(--heading-color);
    font-size: 1.16rem;
    font-weight: 700;
    text-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
}

.secondary-btn {
    border-color: rgba(20, 36, 58, 0.12);
    background: rgba(255, 255, 255, 0.84);
    color: var(--heading-color);
}

.filter-toolbar-btn {
    min-height: 42px;
    padding: 0 16px;
    border-radius: 14px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease,
        color 0.18s ease,
        filter 0.18s ease;
}

.filter-toolbar-btn:hover,
.filter-toolbar-btn:focus-visible {
    transform: translateY(-1px);
}

.filter-toolbar-btn--secondary {
    border: 1px solid rgba(20, 36, 58, 0.1);
    background: rgba(255, 255, 255, 0.9);
    color: #10243c;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.08);
}

.filter-toolbar-btn--secondary:hover,
.filter-toolbar-btn--secondary:focus-visible {
    border-color: rgba(77, 131, 180, 0.28);
    background: rgba(247, 250, 252, 1);
    color: #10243c;
}

.filter-toolbar-btn--active {
    border-color: rgba(235, 181, 106, 0.52);
    background:
        radial-gradient(circle at top right, rgba(255, 244, 212, 0.38), transparent 42%),
        linear-gradient(135deg, #be6825 0%, #df9c45 48%, #f4c87d 100%);
    color: #10243c;
    font-weight: 700;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.34),
        0 18px 32px rgba(190, 104, 37, 0.24);
}

.filter-toolbar-btn--active:hover,
.filter-toolbar-btn--active:focus-visible {
    border-color: rgba(240, 191, 118, 0.72);
    color: #10243c;
    filter: saturate(1.06) brightness(1.02);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.38),
        0 22px 36px rgba(190, 104, 37, 0.3);
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

:deep(.sales-table.el-table),
:deep(.detail-table.el-table),
:deep(.analysis-table.el-table) {
    --el-table-border-color: var(--surface-border);
    --el-table-border: 1px solid var(--surface-border);
    --el-table-tr-bg-color: transparent;
    --el-table-row-hover-bg-color: rgba(185, 120, 55, 0.08);
    border-radius: 24px;
    overflow: hidden;
    background: transparent;
}

:deep(.sales-table .el-table__inner-wrapper::before),
:deep(.detail-table .el-table__inner-wrapper::before),
:deep(.analysis-table .el-table__inner-wrapper::before) {
    display: none;
}

:deep(.el-table th) {
    font-weight: 700;
    text-align: center;
}

:deep(.sales-table td.el-table__cell),
:deep(.sales-table th.el-table__cell.is-leaf),
:deep(.detail-table td.el-table__cell),
:deep(.detail-table th.el-table__cell.is-leaf),
:deep(.analysis-table td.el-table__cell),
:deep(.analysis-table th.el-table__cell.is-leaf) {
    border-bottom-color: var(--surface-border);
}

:deep(.sales-table .el-table__body td.el-table__cell),
:deep(.detail-table .el-table__body td.el-table__cell),
:deep(.analysis-table .el-table__body td.el-table__cell) {
    background: transparent;
}

:deep(.sales-table .el-table__fixed),
:deep(.sales-table .el-table__fixed-right),
:deep(.detail-table .el-table__fixed),
:deep(.detail-table .el-table__fixed-right),
:deep(.analysis-table .el-table__fixed),
:deep(.analysis-table .el-table__fixed-right) {
    box-shadow: none;
}

:deep(.sales-table .el-table__fixed-body-wrapper td.el-table__cell),
:deep(.sales-table .el-table__fixed-header-wrapper th.el-table__cell),
:deep(.detail-table .el-table__fixed-body-wrapper td.el-table__cell),
:deep(.detail-table .el-table__fixed-header-wrapper th.el-table__cell),
:deep(.analysis-table .el-table__fixed-body-wrapper td.el-table__cell),
:deep(.analysis-table .el-table__fixed-header-wrapper th.el-table__cell) {
    background: inherit;
}

.table-light :deep(.sales-table .el-table__body tr:hover > td.el-table__cell),
.table-light :deep(.detail-table .el-table__body tr:hover > td.el-table__cell),
.table-light :deep(.analysis-table .el-table__body tr:hover > td.el-table__cell) {
    background: rgba(185, 120, 55, 0.08) !important;
}

.table-dark :deep(.sales-table .el-table__header-wrapper th.el-table__cell),
.table-dark :deep(.detail-table .el-table__header-wrapper th.el-table__cell),
.table-dark :deep(.analysis-table .el-table__header-wrapper th.el-table__cell) {
    background:
        linear-gradient(180deg, rgba(18, 45, 72, 0.98), rgba(14, 33, 54, 0.96)) !important;
    color: #eef4fb !important;
    border-bottom-color: rgba(255, 255, 255, 0.08) !important;
}

.table-dark :deep(.sales-table .el-table__body tr > td.el-table__cell),
.table-dark :deep(.detail-table .el-table__body tr > td.el-table__cell),
.table-dark :deep(.analysis-table .el-table__body tr > td.el-table__cell) {
    background: linear-gradient(180deg, rgba(11, 27, 45, 0.92), rgba(9, 23, 38, 0.9)) !important;
    color: #d9e2ef;
    border-bottom-color: rgba(255, 255, 255, 0.06) !important;
}

.table-dark :deep(.sales-table .el-table__body tr:nth-child(even) > td.el-table__cell),
.table-dark :deep(.detail-table .el-table__body tr:nth-child(even) > td.el-table__cell),
.table-dark :deep(.analysis-table .el-table__body tr:nth-child(even) > td.el-table__cell) {
    background: linear-gradient(180deg, rgba(13, 31, 50, 0.94), rgba(10, 24, 41, 0.92)) !important;
}

.table-dark :deep(.sales-table .el-table__body tr:hover > td.el-table__cell),
.table-dark :deep(.detail-table .el-table__body tr:hover > td.el-table__cell),
.table-dark :deep(.analysis-table .el-table__body tr:hover > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.12), transparent 28%),
        linear-gradient(180deg, rgba(18, 38, 60, 0.98), rgba(12, 29, 48, 0.96)) !important;
}

.table-dark :deep(.sales-table .el-table__fixed-body-wrapper tr > td.el-table__cell),
.table-dark :deep(.sales-table .el-table__fixed-header-wrapper th.el-table__cell),
.table-dark :deep(.detail-table .el-table__fixed-body-wrapper tr > td.el-table__cell),
.table-dark :deep(.detail-table .el-table__fixed-header-wrapper th.el-table__cell),
.table-dark :deep(.analysis-table .el-table__fixed-body-wrapper tr > td.el-table__cell),
.table-dark :deep(.analysis-table .el-table__fixed-header-wrapper th.el-table__cell) {
    background: inherit !important;
}

.table-dark :deep(.sales-table .el-table__empty-block),
.table-dark :deep(.detail-table .el-table__empty-block),
.table-dark :deep(.analysis-table .el-table__empty-block) {
    background: linear-gradient(180deg, rgba(10, 24, 41, 0.92), rgba(8, 20, 34, 0.9));
}

.table-dark :deep(.sales-table .el-table__empty-text),
.table-dark :deep(.detail-table .el-table__empty-text),
.table-dark :deep(.analysis-table .el-table__empty-text) {
    color: #95a7bb;
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

.detail-view-btn {
    min-height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--accent-color) 42%, var(--surface-border));
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.18), transparent 48%),
        linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 88%, transparent), color-mix(in srgb, var(--surface-muted) 78%, var(--surface-card)));
    color: var(--heading-color);
    font-weight: 600;
    letter-spacing: 0.01em;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 10px 20px rgba(10, 24, 41, 0.12);
    transition:
        transform 0.18s ease,
        border-color 0.18s ease,
        box-shadow 0.18s ease,
        background 0.18s ease;
}

.detail-view-btn:hover,
.detail-view-btn:focus-visible {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--accent-color) 72%, var(--surface-border));
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.28), transparent 46%),
        linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 82%, transparent), color-mix(in srgb, var(--surface-muted) 90%, var(--surface-card)));
    color: var(--heading-color);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 14px 28px rgba(10, 24, 41, 0.16);
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
    width: auto;
    min-width: 72px;
    align-self: center;
}

.sales-row-btn {
    min-height: 34px;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease,
        color 0.18s ease;
}

.sales-row-btn:hover,
.sales-row-btn:focus-visible {
    transform: translateY(-1px);
}

.sales-row-btn--save,
.sales-row-btn--edit {
    border-color: rgba(77, 131, 180, 0.26);
    background: linear-gradient(180deg, rgba(24, 54, 86, 0.96), rgba(35, 74, 113, 0.94));
    color: #f7fbff;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.16);
}

.sales-row-btn--save:hover,
.sales-row-btn--save:focus-visible,
.sales-row-btn--edit:hover,
.sales-row-btn--edit:focus-visible {
    border-color: rgba(77, 131, 180, 0.4);
    background: linear-gradient(180deg, rgba(20, 46, 74, 1), rgba(31, 66, 101, 0.98));
    color: #ffffff;
}

.sales-row-btn--cancel {
    border: 1px solid rgba(20, 36, 58, 0.1);
    background: rgba(255, 255, 255, 0.92);
    color: #44596f;
}

.sales-row-btn--cancel:hover,
.sales-row-btn--cancel:focus-visible {
    border-color: rgba(129, 147, 168, 0.4);
    background: rgba(244, 247, 250, 1);
    color: #203248;
}

.sales-row-btn--delete {
    border-color: rgba(217, 92, 92, 0.2);
    background: linear-gradient(180deg, rgba(191, 72, 72, 0.96), rgba(170, 58, 58, 0.94));
    color: #fff8f8;
    box-shadow: 0 10px 20px rgba(191, 72, 72, 0.18);
}

.sales-row-btn--delete:hover,
.sales-row-btn--delete:focus-visible {
    border-color: rgba(217, 92, 92, 0.34);
    background: linear-gradient(180deg, rgba(176, 60, 60, 1), rgba(155, 48, 48, 0.98));
    color: #ffffff;
}

.table-dark :deep(.sales-table .el-table__body tr:has(.sales-row-btn--save) > td.el-table__cell),
.table-dark :deep(.sales-table .el-table__body tr:has(.sales-row-btn--edit) > td.el-table__cell) {
    background:
        radial-gradient(circle at left center, rgba(214, 164, 107, 0.08), transparent 26%),
        linear-gradient(180deg, rgba(13, 31, 50, 0.94), rgba(10, 24, 41, 0.92)) !important;
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
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 246, 251, 0.96));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.detail-summary-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.detail-summary-item span {
    color: #516579;
    font-size: 0.9rem;
    font-weight: 600;
}

.detail-summary-item strong {
    color: #10243c;
}

.detail-dialog-title,
.image-preview-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
}

.detail-dialog-title strong,
.image-preview-title strong {
    color: #10243c;
    font-size: 1.2rem;
    font-weight: 700;
}

.detail-dialog-title span,
.image-preview-title span {
    color: #5f7388;
    font-size: 0.9rem;
}

.detail-table-wrap {
    margin-top: 18px;
    overflow-x: auto;
    border-radius: 24px;
    border: 1px solid rgba(20, 36, 58, 0.08);
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 18px 36px rgba(16, 36, 58, 0.08);
}

.detail-toolbar-btn {
    min-height: 38px;
    padding: 0 16px;
    border-radius: 999px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease;
}

.detail-toolbar-btn:hover,
.detail-toolbar-btn:focus-visible {
    transform: translateY(-1px);
}

.detail-toolbar-btn--primary {
    border-color: rgba(185, 122, 55, 0.38);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.24), transparent 48%),
        linear-gradient(180deg, rgba(17, 40, 66, 0.98), rgba(24, 54, 86, 0.96));
    color: #f7fbff;
    box-shadow: 0 14px 28px rgba(16, 36, 58, 0.18);
}

.detail-toolbar-btn--primary:hover,
.detail-toolbar-btn--primary:focus-visible {
    border-color: rgba(214, 164, 107, 0.56);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.3), transparent 46%),
        linear-gradient(180deg, rgba(14, 34, 58, 1), rgba(22, 49, 79, 0.98));
    color: #ffffff;
    box-shadow: 0 18px 32px rgba(16, 36, 58, 0.22);
}

.detail-toolbar-btn--secondary {
    border: 1px solid rgba(20, 36, 58, 0.1);
    background: rgba(255, 255, 255, 0.9);
    color: #10243c;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.08);
}

.detail-toolbar-btn--secondary:hover,
.detail-toolbar-btn--secondary:focus-visible {
    border-color: rgba(77, 131, 180, 0.28);
    background: rgba(247, 250, 252, 1);
    color: #10243c;
}

.detail-row-btn {
    min-height: 34px;
    border-radius: 12px;
    font-weight: 600;
    letter-spacing: 0.01em;
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        background 0.18s ease;
}

.detail-row-btn:hover,
.detail-row-btn:focus-visible {
    transform: translateY(-1px);
}

.detail-row-btn--save,
.detail-row-btn--edit {
    border-color: rgba(77, 131, 180, 0.26);
    background: linear-gradient(180deg, rgba(24, 54, 86, 0.96), rgba(35, 74, 113, 0.94));
    color: #f7fbff;
    box-shadow: 0 10px 20px rgba(16, 36, 58, 0.16);
}

.detail-row-btn--save:hover,
.detail-row-btn--save:focus-visible,
.detail-row-btn--edit:hover,
.detail-row-btn--edit:focus-visible {
    border-color: rgba(77, 131, 180, 0.4);
    background: linear-gradient(180deg, rgba(20, 46, 74, 1), rgba(31, 66, 101, 0.98));
    color: #ffffff;
}

.detail-row-btn--cancel {
    border: 1px solid rgba(20, 36, 58, 0.1);
    background: rgba(255, 255, 255, 0.92);
    color: #44596f;
}

.detail-row-btn--cancel:hover,
.detail-row-btn--cancel:focus-visible {
    border-color: rgba(129, 147, 168, 0.4);
    background: rgba(244, 247, 250, 1);
    color: #203248;
}

.detail-row-btn--delete {
    border-color: rgba(217, 92, 92, 0.2);
    background: linear-gradient(180deg, rgba(191, 72, 72, 0.96), rgba(170, 58, 58, 0.94));
    color: #fff8f8;
    box-shadow: 0 10px 20px rgba(191, 72, 72, 0.18);
}

.detail-row-btn--delete:hover,
.detail-row-btn--delete:focus-visible {
    border-color: rgba(217, 92, 92, 0.34);
    background: linear-gradient(180deg, rgba(176, 60, 60, 1), rgba(155, 48, 48, 0.98));
    color: #ffffff;
}

.product-image-box {
    width: 70px;
    height: 70px;
    margin: 0 auto;
    padding: 0;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    appearance: none;
}

.product-image-box:disabled {
    cursor: default;
    opacity: 0.88;
}

.product-image-box--large {
    width: 92px;
    height: 92px;
}

.product-image-box--clickable {
    position: relative;
    cursor: zoom-in;
    border: 1px solid rgba(20, 36, 58, 0.08);
    box-shadow: 0 12px 24px rgba(15, 31, 49, 0.14);
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease;
}

.product-image-box--clickable:hover,
.product-image-box--clickable:focus-visible {
    transform: translateY(-1px) scale(1.02);
    border-color: rgba(185, 122, 55, 0.35);
    box-shadow: 0 16px 30px rgba(15, 31, 49, 0.18);
}

.product-image-box--clickable::after {
    content: "放大";
    position: absolute;
    right: 8px;
    bottom: 8px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(16, 36, 58, 0.78);
    color: #f5f8fc;
    font-size: 0.72rem;
    letter-spacing: 0.04em;
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

.table-dark .product-link,
.table-dark .site-link {
    color: #9bc2ec;
}

.table-dark .product-link:hover,
.table-dark .site-link:hover {
    color: #d8eaff;
}

.detail-number {
    width: 100%;
}

.image-preview-frame {
    display: grid;
    place-items: center;
    min-height: 320px;
    padding: 8px;
    border-radius: 24px;
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.12), transparent 32%),
        linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(243, 246, 249, 0.96));
}

.image-preview-full {
    display: block;
    max-width: 100%;
    max-height: min(72vh, 760px);
    object-fit: contain;
    border-radius: 20px;
    box-shadow: 0 24px 48px rgba(12, 28, 47, 0.18);
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
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
}

.summary-card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 18px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 94%, transparent), var(--surface-card));
    border: 1px solid var(--surface-border);
    color: var(--muted-text);
}

.summary-card strong {
    color: var(--heading-color);
    font-size: 1.08rem;
}

.analysis-visuals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
}

.visual-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 18px;
    border-radius: 22px;
    border: 1px solid var(--surface-border);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.1), transparent 34%),
        linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 94%, transparent), var(--surface-card));
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.04),
        0 16px 36px rgba(6, 16, 30, 0.12);
}

.visual-card--full {
    grid-column: 1 / -1;
}

.visual-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.visual-eyebrow {
    display: inline-flex;
    color: var(--accent-color);
    font-size: 0.72rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

.visual-head strong {
    display: block;
    margin-top: 8px;
    color: var(--heading-color);
    font-size: 1.08rem;
    letter-spacing: -0.02em;
}

.visual-highlight {
    padding: 9px 13px;
    border-radius: 999px;
    border: 1px solid var(--surface-border);
    background: color-mix(in srgb, var(--surface-muted) 82%, var(--surface-card));
    color: var(--heading-color);
    font-size: 0.84rem;
    font-weight: 600;
    white-space: nowrap;
}

.visual-chart {
    width: 100%;
    height: 288px;
    border-radius: 18px;
}

.visual-chart--wide {
    height: 304px;
}

.visual-chart--timeline {
    height: 320px;
}

.visual-legend {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 12px;
}

.legend-item {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 4px 10px;
    align-items: center;
    padding: 12px 14px;
    border-radius: 16px;
    border: 1px solid var(--surface-border);
    background: color-mix(in srgb, var(--surface-muted) 84%, var(--surface-card));
    transition:
        transform 0.2s ease,
        border-color 0.2s ease,
        background 0.2s ease;
}

.legend-item:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--accent-color) 35%, var(--surface-border));
    background: color-mix(in srgb, var(--surface-muted) 68%, var(--surface-card));
}

.legend-dot {
    grid-row: span 2;
    width: 10px;
    height: 10px;
    border-radius: 999px;
    box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.04);
}

.legend-label {
    color: var(--heading-color);
    font-size: 0.92rem;
    font-weight: 600;
}

.legend-value {
    color: var(--heading-color);
    font-size: 0.92rem;
    text-align: right;
}

.legend-meta {
    color: var(--muted-text);
    font-size: 0.82rem;
    text-align: right;
}

.visual-caption {
    margin: -4px 0 0;
    color: var(--muted-text);
    font-size: 0.84rem;
    line-height: 1.6;
}

.analysis-table-wrap {
    overflow-x: auto;
}

.analysis-empty {
    padding: 18px;
    border: 1px dashed var(--surface-border);
    border-radius: 18px;
    background: var(--surface-muted);
    color: var(--muted-text);
}

.analysis-empty strong {
    display: block;
    color: var(--heading-color);
    font-size: 1rem;
}

.analysis-empty p {
    margin: 8px 0 0;
    line-height: 1.7;
}

:deep(.detail-dialog .el-dialog),
:deep(.analysis-dialog .el-dialog) {
    border-radius: 28px;
    border: 1px solid var(--surface-border);
    background: linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 96%, transparent), var(--surface-card));
    box-shadow: 0 24px 60px rgba(2, 10, 22, 0.28);
}

:deep(.detail-dialog .el-dialog) {
    background: #f7fafc;
}

:deep(.detail-dialog .el-dialog__header),
:deep(.analysis-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 24px 24px 0;
    border-bottom: 1px solid var(--surface-border);
    background:
        radial-gradient(circle at top right, rgba(214, 164, 107, 0.12), transparent 28%),
        linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 98%, transparent), var(--surface-card));
}

:deep(.detail-dialog .el-dialog__header) {
    border-bottom: none;
    background: transparent;
}

:deep(.detail-dialog .el-dialog__body),
:deep(.analysis-dialog .el-dialog__body) {
    padding: 20px 24px 24px;
    background: transparent;
}

:deep(.detail-dialog .el-dialog__body) {
    padding-top: 12px;
}

:deep(.analysis-dialog .el-dialog__title),
:deep(.detail-dialog .el-dialog__title),
:deep(.analysis-dialog .el-dialog__headerbtn .el-dialog__close),
:deep(.detail-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: var(--heading-color);
}

:deep(.analysis-dialog .el-dialog) {
    background: #f7fafc;
}

:deep(.analysis-dialog .el-dialog__header) {
    border-bottom: none;
    background: transparent;
}

:deep(.analysis-dialog .el-dialog__body) {
    background: transparent;
}

:deep(.analysis-dialog .el-dialog__title),
:deep(.analysis-dialog .el-dialog__headerbtn .el-dialog__close),
.analysis-title strong,
.analysis-title span {
    color: #000000;
}

:deep(.image-preview-dialog .el-dialog) {
    border-radius: 28px;
    border: 1px solid rgba(20, 36, 58, 0.08);
    background: #f7fafc;
    box-shadow: 0 24px 60px rgba(2, 10, 22, 0.24);
}

:deep(.image-preview-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 24px 24px 0;
    border-bottom: none;
    background: transparent;
}

:deep(.image-preview-dialog .el-dialog__body) {
    padding: 14px 24px 24px;
}

:deep(.image-preview-dialog .el-dialog__title),
:deep(.image-preview-dialog .el-dialog__headerbtn .el-dialog__close) {
    color: #10243c;
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

    .analysis-summary,
    .analysis-visuals,
    .analysis-preview-metrics {
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

    .analysis-preview-head {
        flex-direction: column;
        align-items: stretch;
    }

    .visual-head {
        flex-direction: column;
        align-items: flex-start;
    }

    .visual-highlight {
        white-space: normal;
    }

    .visual-chart,
    .visual-chart--wide {
        height: 260px;
    }

    .visual-chart--timeline {
        height: 280px;
    }

    .visual-legend {
        grid-template-columns: 1fr;
    }

    .analysis-trigger-btn {
        width: 100%;
    }
}
</style>
