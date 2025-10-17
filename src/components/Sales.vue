<template>
    <div class="sales-page">
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>銷售紀錄</h2>
            </el-col>
        </el-row>

        <el-row class="filterBar" :gutter="10" style="margin-bottom: 10px; align-items: center;">
            <!-- 搜尋框 -->
            <el-col :xs="24" :sm="12" :md="6">
                <el-input v-model="searchKeyword" placeholder="搜尋商品名稱" clearable @input="filterSales"
                    style="width: 100%;" />
            </el-col>

            <!-- 日期 + 編輯模式 -->
            <el-col :xs="24" :sm="12" :md="8">
                <div class="toolbar">
                    <el-date-picker v-model="selectedMonth" type="month" placeholder="選擇年月" format="YYYY-MM"
                        value-format="YYYY-MM" clearable @change="() => loadSalesByMonth(selectedMonth)"
                        class="date-picker" style="width: 100%; max-width: 350px;" />
                    <el-button :type="showActions ? 'warning' : 'info'" @click="toggleEditMode" class="edit-btn">
                        {{ showActions ? '退出編輯模式' : '進入編輯模式' }}
                    </el-button>
                </div>
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
            <!-- ✅ 操作欄（只有在編輯模式時顯示） -->
            <el-table-column v-if="showActions" fixed="left" label="操作" width="150">
                <template #default="{ row }">
                    <el-button size="small" type="primary"
                        @click="editingRow === row ? saveEdit(row) : editingRow = row">
                        {{ editingRow === row ? '儲存' : '編輯' }}
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteSale(row)">刪除</el-button>
                </template>
            </el-table-column>

            <el-table-column prop="timestamp" label="時間" width="170">
                <template #default="{ row }">{{ formatDate(row.timestamp) }}</template>
            </el-table-column>

            <el-table-column prop="total" label="總金額" width="80">
                <template #default="{ row }">
                    <div v-if="editingRow === row">
                        <el-input-number v-model="row.total" :min="0" size="small" />
                    </div>
                    <div v-else>
                        {{ row.total }} 元
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="totalProfit" label="總毛利" width="80">
                <template #default="{ row }">
                    <div v-if="editingRow === row">
                        <el-input-number v-model="row.totalProfit" size="small" />
                    </div>
                    <div v-else>
                        <span
                            :style="{ color: (row.totalProfit ?? 0) >= 0 ? '#00fc2a' : '#fc0000', fontWeight: 'bold' }">
                            {{ row.totalProfit ?? 0 }} 元
                        </span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="operator" label="操作人員" width="100" />
            <el-table-column label="商品明細" width="120">
                <template #default="{ row }">
                    <el-button type="primary" size="mini"
                        @click="showDetails(row.items, row.operator, row.total, row.totalProfit, row.id)">
                        查看明細
                    </el-button>
                </template>
            </el-table-column>
            <el-table-column prop="updater" label="修改者" />
        </el-table>

        <div v-else>尚無銷售紀錄</div>

        <!-- 彈窗顯示商品明細 -->
        <el-dialog title="商品明細" v-model="dialogVisible" width="90%" @close="onDetailDialogClose">
            <!-- 操作人員與總金額 -->
            <div class="detail-header">
                <!-- 左側統計資訊 -->
                <el-card shadow="hover" class="summary-card">
                    <div class="summary-content">
                        <div class="summary-item"><strong>💰 銷售：</strong><span class="highlight">{{ selectedTotal }}
                                元</span>
                        </div>
                        <div class="summary-item"><strong>📈 毛利：</strong><span class="highlight profit">{{
                            selectedProfit }}
                                元</span></div>
                        <div class="summary-item"><strong>👤 人員：</strong>{{ selectedOperator }}</div>
                    </div>
                </el-card>

                <!-- 右側按鈕 -->
                <div class="summary-actions">
                    <el-button size="small" type="primary" @click="addNewDetailItem">
                        新增商品
                    </el-button>
                    <el-button size="small" :type="showDetailActions ? 'warning' : 'info'"
                        @click="toggleDetailEditMode">
                        {{ showDetailActions ? '退出編輯模式' : '進入編輯模式' }}
                    </el-button>
                </div>
            </div>



            <el-table :data="selectedItems" border style="width: 100%;" size="small">
                <el-table-column v-if="showDetailActions" label="操作" width="150">
                    <template #default="{ row }">
                        <!-- 編輯模式 -->
                        <div v-if="editingDetailRow === row">
                            <el-button size="mini" type="primary" @click="saveDetailEdit(row)">
                                儲存
                            </el-button>
                            <el-button size="mini" type="warning" @click="editingDetailRow = null">
                                取消
                            </el-button>
                        </div>

                        <!-- 非編輯模式 -->
                        <div v-else>
                            <el-button size="mini" type="primary" @click="editingDetailRow = row">
                                編輯
                            </el-button>
                            <el-button size="mini" type="danger" @click="deleteDetailItem(row)">
                                刪除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="名稱">
                    <template #default="{ row }">
                        <div v-if="editingDetailRow === row">
                            <el-input v-model="row.name" size="small" placeholder="輸入商品名稱" />
                        </div>
                        <div v-else>{{ row.name }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="sellingPrice" label="售價" width="120">
                    <template #default="{ row }">
                        <div v-if="editingDetailRow === row">
                            <el-input-number style="width: 100px;" v-model="row.sellingPrice" :min="0" size="small" />
                        </div>
                        <div v-else>{{ row.sellingPrice }} 元</div>
                    </template>
                </el-table-column>

                <el-table-column prop="quantity" label="數量" width="120">
                    <template #default="{ row }">
                        <div v-if="editingDetailRow === row">
                            <el-input-number style="width: 100px;" v-model="row.quantity" :min="0" size="small" />
                        </div>
                        <div v-else>{{ row.quantity }}</div>
                    </template>
                </el-table-column>

                <el-table-column label="小計" width="120">
                    <template #default="{ row }">{{ row.sellingPrice * row.quantity }} 元</template>
                </el-table-column>

                <el-table-column prop="price" label="定價" width="100" />
                <el-table-column prop="cost" label="成本" width="100" />
                <el-table-column prop="estimatedProfit" label="毛利(單個)" width="120">
                    <template #default="{ row }">
                        <span :style="{ color: (row.sellingPrice - row.cost) >= 0 ? '#00fc2a' : '#fc0000' }">
                            {{ (row.sellingPrice - row.cost).toFixed(0) }} 元
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="預估總毛利" width="120">
                    <template #default="{ row }">
                        <span
                            :style="{ color: (row.sellingPrice - row.cost) >= 0 ? '#00fc2a' : '#fc0000', fontWeight: 'bold' }">
                            {{ ((row.sellingPrice - row.cost) * row.quantity).toFixed(0) }} 元
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
import { query, orderByChild, startAt, endAt, get, child, ref as dbRef, remove, update } from "firebase/database";
import { ElMessage, ElMessageBox } from "element-plus";
import { useAuth } from "@/composables/useAuth";
const { user } = useAuth();

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
    id?: string;
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

const showActions = ref(false); // ✅ 控制編輯模式

const editingRow = ref<Sale | null>(null); // 正在編輯的行
// ✅ 切換編輯模式
function toggleEditMode() {
    showActions.value = !showActions.value;
}

// 取得設備資訊
function getDeviceInfoShort(): string {
    const ua = navigator.userAgent;
    const platform = navigator.platform;

    // 簡單判斷 Chrome / Firefox / Edge / Safari
    let browser = "未知瀏覽器";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Safari")) browser = "Safari";

    return `${browser} / ${platform}`;
}

// ✅ 儲存編輯
async function saveEdit(row: Sale) {
    if (!row.id) {
        ElMessage.error('找不到紀錄 ID，無法儲存');
        return;
    }

    // 更新 Firebase
    await update(dbRef(db, `sales/${row.id}`), {
        total: row.total,
        totalProfit: row.totalProfit,
        updater: user.value?.displayName + "(" + getDeviceInfoShort() + ")", // 新增更新者欄位
        // 若要更新 items 或其他欄位，也可以加上
    });

    ElMessage.success('編輯已儲存');
    editingRow.value = null;
    await loadSalesByMonth(selectedMonth.value);
}


// ✅ 刪除銷售紀錄
async function deleteSale(sale: Sale) {
    try {
        await ElMessageBox.confirm("確定要刪除這筆銷售紀錄嗎？", "刪除確認", {
            confirmButtonText: "確定刪除",
            cancelButtonText: "取消",
            type: "warning",
        });

        if (sale.id) {
            await remove(child(dbRef(db), `sales/${sale.id}`));
            ElMessage.success("刪除成功");
            await loadSalesByMonth(selectedMonth.value);
        } else {
            ElMessage.error("找不到紀錄 ID，無法刪除");
        }
    } catch {
        ElMessage.info("已取消刪除");
    }
}

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

// function showDetails(rowItems: SaleItem[], operator: string, total: number, totalProfit: number) {
//     selectedItems.value = rowItems;
//     selectedOperator.value = operator;
//     selectedTotal.value = total;
//     selectedProfit.value = totalProfit || 0;
//     dialogVisible.value = true;
// }

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
        sales.value = Object.entries(data).map(([key, val]) => ({
            id: key,   // <- 這裡存 key
            ...(val as Sale)
        })).sort((a, b) => b.timestamp - a.timestamp) as Sale[];

        filterSales();
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


// ----明細編輯相關----
const showDetailActions = ref(false); // 彈窗編輯模式開關
const editingDetailRow = ref<SaleItem | null>(null);
let currentEditingSaleId: string | null = null; // 記錄彈窗對應的 sale.id

function showDetails(rowItems: SaleItem[], operator: string, total: number, totalProfit: number, saleId?: string) {
    selectedItems.value = rowItems.map(item => ({ ...item })); // 複製一份，避免直接綁定
    selectedOperator.value = operator;
    selectedTotal.value = total;
    selectedProfit.value = totalProfit || 0;
    dialogVisible.value = true;
    currentEditingSaleId = saleId || null;
}

// 新增商品明細
function addNewDetailItem() {
    if (!currentEditingSaleId) {
        ElMessage.error("找不到紀錄 ID，無法新增");
        return;
    }

    const newItem: SaleItem = {
        barcode: `new-${Date.now()}`, // 簡單生成唯一條碼
        name: '',
        price: 0,
        sellingPrice: 0,
        quantity: 1,
        cost: 0,
    };

    selectedItems.value.push(newItem);
    editingDetailRow.value = newItem; // 新增後自動進入編輯模式
    showDetailActions.value = true;   // 確保編輯模式開啟
}

// 儲存明細編輯
async function saveDetailEdit(item: SaleItem) {
    if (!currentEditingSaleId) {
        ElMessage.error("找不到紀錄 ID，無法儲存");
        return;
    }

    // 更新 selectedItems
    const index = selectedItems.value.findIndex(i => i.barcode === item.barcode);
    if (index !== -1) selectedItems.value[index] = { ...item };

    // 計算新的總額、毛利
    const newTotal = selectedItems.value.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0);
    const newProfit = selectedItems.value.reduce((sum, i) => sum + ((i.sellingPrice - (i.cost ?? 0)) * i.quantity), 0);

    // 更新 Firebase
    await update(dbRef(db, `sales/${currentEditingSaleId}`), {
        items: selectedItems.value,
        total: newTotal,
        totalProfit: newProfit,
        updater: user.value?.displayName + "(" + getDeviceInfoShort() + ")"
    });

    // 更新彈窗顯示
    selectedTotal.value = newTotal;
    selectedProfit.value = newProfit;

    // 更新主表格
    await loadSalesByMonth(selectedMonth.value);

    ElMessage.success('明細已儲存');
    editingDetailRow.value = null;
}

// 刪除明細商品（帶確認提示）
function deleteDetailItem(row: SaleItem) {
    ElMessageBox.confirm(
        '確定要刪除這個商品明細嗎？',
        '刪除確認',
        {
            confirmButtonText: '確定',
            cancelButtonText: '取消',
            type: 'warning',
        }
    )
        .then(() => {
            const index = selectedItems.value.indexOf(row);
            if (index !== -1) {
                selectedItems.value.splice(index, 1);
                ElMessage.success('明細已刪除');

                // 同步更新 Firebase
                updateDetailItemsInFirebase();
            }
        })
        .catch(() => {
            ElMessage.info('已取消刪除');
        });
}

// 同步明細到 Firebase
async function updateDetailItemsInFirebase() {
    // 使用在 showDetails 中設定的 currentEditingSaleId 作為 saleId
    const saleId = currentEditingSaleId;
    if (!saleId) return;

    // 計算總金額與毛利
    const total = selectedItems.value.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const totalProfit = selectedItems.value.reduce((sum, item) => sum + ((item.sellingPrice - (item.cost ?? 0)) * item.quantity), 0);

    await update(dbRef(db, `sales/${saleId}`), {
        items: selectedItems.value,
        total,
        totalProfit,
        updater: user.value?.displayName + "(" + getDeviceInfoShort() + ")",
    });

    // 更新主表格
    await loadSalesByMonth(selectedMonth.value);
}

function onDetailDialogClose() {
    dialogVisible.value = false;
    showDetailActions.value = false; // 退出編輯模式
    editingDetailRow.value = null;   // 清除正在編輯的行
}

function toggleDetailEditMode() {
    if (showDetailActions.value) {
        // 退出編輯模式
        editingDetailRow.value = null; // 隱藏所有編輯框
        showDetailActions.value = false;
    } else {
        // 進入編輯模式
        showDetailActions.value = true;
    }
}

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

.toolbar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

/* ✅ 外層容器一定要 block 且 100% */
.date-picker-wrapper {
    display: block;
    width: 100%;
}

.date-picker {
    width: 100%;
}

/* ✅ 重點：強制內層的 el-input 與 wrapper 撐滿 */
.date-picker .el-input,
.date-picker .el-input__wrapper {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
}

.edit-btn {
    white-space: nowrap;
}

/* ✅ 手機模式 */
@media (max-width: 768px) {
    .toolbar {
        margin: 10px 0 0 0;
        flex-direction: column;
        align-items: stretch;
    }

    .date-picker-wrapper,
    .date-picker,
    .edit-btn {
        width: 100%;
    }
}

.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    /* ✅ 允許手機自動換行 */
    gap: 10px;
    margin-bottom: 12px;
}

/* 統計資訊卡片 */
.summary-card {
    flex: 1;
    min-width: 250px;
    border-radius: 10px;
}

/* 卡片內容：可自動換行 */
.summary-content {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 20px;
    font-size: 1rem;
    font-weight: 500;
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 4px;
}

.highlight {
    color: #409eff;
    font-weight: 600;
}

.profit {
    color: #67c23a;
}

/* 按鈕區 */
.summary-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

/* 手機排版：上下排列 */
@media (max-width: 768px) {
    .detail-header {
        flex-direction: column;
        align-items: stretch;
    }

    .summary-actions {
        justify-content: flex-start;
    }
}
</style>
