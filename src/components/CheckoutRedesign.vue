<template>
    <div class="checkout-page">
        <section class="checkout-hero">
            <div class="hero-copy">
                <span class="page-eyebrow">CHECKOUT STATION</span>
                <h2>結帳作業</h2>
                <p>
                    將掃碼、手動加購與結帳摘要集中在同一個工作區，讓櫃台操作更快、更清楚。
                </p>
            </div>

            <div class="hero-metrics">
                <div class="hero-badge">
                    <strong>{{ totalQuantity }}</strong>
                    <span>商品件數</span>
                </div>
                <div class="hero-badge">
                    <strong>NT$ {{ formatCurrency(total) }}</strong>
                    <span>目前總額</span>
                </div>
                <div class="hero-badge">
                    <strong>{{ paymentLabel }}</strong>
                    <span>付款方式</span>
                </div>
            </div>
        </section>

        <section class="control-grid">
            <article class="control-card scanner-card">
                <div class="control-head">
                    <span class="section-eyebrow">SCAN</span>
                    <h3>掃碼加入購物車</h3>
                    <p>直接掃描 GTIN，或在下方輸入商品編號 / GTIN 與數量快速加入。</p>
                </div>

                <div class="scanner-shell">
                    <Scanner @onScan="handleScan" />
                </div>

                <div class="manual-entry">
                    <el-input
                        v-model="manualGtin"
                        placeholder="輸入商品編號或 GTIN"
                        class="manual-input"
                        @keyup.enter="addManualItem"
                    />
                    <el-input-number
                        v-model.number="manualQuantity"
                        :min="1"
                        class="manual-quantity"
                        @keyup.enter="addManualItem"
                    />
                    <el-button type="primary" class="manual-action" @click="addManualItem">
                        加入購物車
                    </el-button>
                    <el-button class="secondary-btn" @click="showAddDialog = true">
                        手動建立商品
                    </el-button>
                </div>
            </article>

            <article class="control-card summary-card">
                <div class="control-head">
                    <span class="section-eyebrow">SUMMARY</span>
                    <h3>本次結帳摘要</h3>
                    <p>先確認金額與付款方式，再送出交易與更新庫存。</p>
                </div>

                <div class="summary-list">
                    <div class="summary-row">
                        <span>商品件數</span>
                        <strong>{{ totalQuantity }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>商品小計</span>
                        <strong>NT$ {{ formatCurrency(total) }}</strong>
                    </div>
                    <div class="summary-row">
                        <span>預估毛利</span>
                        <strong :class="{ 'profit-negative': totalProfitPreview < 0 }">
                            NT$ {{ formatCurrency(totalProfitPreview) }}
                        </strong>
                    </div>
                </div>

                <div class="payment-panel">
                    <label class="payment-label">付款方式</label>
                    <el-select v-model="selectedPayment" placeholder="選擇付款方式" class="payment-select">
                        <el-option
                            v-for="method in paymentOptions"
                            :key="method.value"
                            :label="method.label"
                            :value="method.value"
                        />
                    </el-select>
                    <p v-if="showPaymentError" class="payment-error">
                        請先選擇付款方式後再確認結帳。
                    </p>
                    <p class="payment-note" v-if="needHandlingFee(selectedPayment)">
                        此付款方式將以 2% 手續費計入預估毛利。
                    </p>
                </div>

                <div class="summary-actions">
                    <el-button class="secondary-btn" :disabled="cart.length === 0" @click="clearCart">
                        清空購物車
                    </el-button>
                    <el-button type="success" :disabled="cart.length === 0" @click="confirmCheckout">
                        確認結帳
                    </el-button>
                </div>
            </article>
        </section>

        <section class="table-card">
            <div class="table-header">
                <div>
                    <span class="section-eyebrow">CART</span>
                    <h3>購物車商品</h3>
                </div>

                <div class="table-meta">
                    <span>{{ cart.length }} 種商品</span>
                    <span>{{ totalQuantity }} 件</span>
                    <span>總額 NT$ {{ formatCurrency(total) }}</span>
                </div>
            </div>

            <el-table
                v-if="cart.length"
                :data="cart"
                border
                class="checkout-table"
                :class="tableThemeClass"
                :header-cell-style="{ background: 'var(--table-header-bg)', color: 'var(--table-header-text)' }"
            >
                <el-table-column class-name="no-padding-cell" label="#" width="38" align="center">
                    <template #default="{ $index }">
                        <span class="index-text">{{ $index + 1 }}</span>
                    </template>
                </el-table-column>

                <el-table-column class-name="no-padding-cell" label="商品圖片" width="96" align="center">
                    <template #default="{ row }">
                        <div class="product-image-box">
                            <img v-if="row.imageUrl" :src="row.imageUrl" alt="商品圖片" class="product-image" />
                            <el-icon v-else class="product-image-fallback">
                                <Picture />
                            </el-icon>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="數量" width="110" align="center">
                    <template #default="{ row }">
                        <el-input-number
                            v-if="row.editing"
                            v-model.number="row.quantity"
                            size="small"
                            :min="1"
                            class="cart-qty-input"
                        />
                        <span v-else class="qty-badge">{{ row.quantity }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="name" label="商品名稱" min-width="220">
                    <template #default="{ row }">
                        <a
                            v-if="row.website"
                            :href="row.website"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="product-link"
                        >
                            {{ row.name }}
                        </a>
                        <span v-else>{{ row.name }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="code" label="商品編號" min-width="120" align="center" />
                <el-table-column prop="gtin" label="GTIN" min-width="120" align="center" />

                <el-table-column label="售價" width="110" align="center">
                    <template #default="{ row }">
                        <el-input-number
                            v-if="row.editing"
                            v-model.number="row.sellingPrice"
                            size="small"
                            :min="0"
                            class="price-input"
                        />
                        <span v-else>NT$ {{ formatCurrency(row.sellingPrice) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="小計" width="120" align="center">
                    <template #default="{ row }">
                        <span class="subtotal-value">NT$ {{ formatCurrency(row.sellingPrice * row.quantity) }}</span>
                    </template>
                </el-table-column>

                <el-table-column prop="price" label="定價" width="96" align="center">
                    <template #default="{ row }">NT$ {{ formatCurrency(row.price) }}</template>
                </el-table-column>

                <el-table-column prop="cost" label="成本" width="96" align="center">
                    <template #default="{ row }">NT$ {{ formatCurrency(row.cost) }}</template>
                </el-table-column>

                <el-table-column label="單件毛利" width="110" align="center">
                    <template #default="{ row }">
                        <span :class="['profit-value', { 'profit-negative': row.sellingPrice - row.cost < 0 }]">
                            NT$ {{ formatCurrency(row.sellingPrice - row.cost) }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column prop="supplierName" label="廠商名稱" min-width="120" align="center" />
                <el-table-column prop="supplierCode" label="廠商編號" min-width="120" align="center" />

                <el-table-column prop="website" label="網站" width="90" align="center">
                    <template #default="{ row }">
                        <a
                            v-if="row.website"
                            :href="row.website"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="site-link"
                        >
                            前往
                        </a>
                        <span v-else>-</span>
                    </template>
                </el-table-column>

                <el-table-column label="操作" width="128" align="center">
                    <template #default="{ row, $index }">
                        <div class="row-action-stack">
                            <el-button type="primary" size="small" class="row-action-btn" @click.stop="toggleEdit(row)">
                                {{ row.editing ? "完成" : "編輯" }}
                            </el-button>
                            <el-button type="danger" size="small" class="row-action-btn" @click.stop="removeItem($index)">
                                刪除
                            </el-button>
                        </div>
                    </template>
                </el-table-column>
            </el-table>

            <div v-else class="empty-state">
                <strong>購物車目前是空的</strong>
                <p>你可以先掃描商品、輸入 GTIN，或手動建立商品後加入購物車。</p>
                <div class="empty-actions">
                    <el-button type="primary" @click="showAddDialog = true">手動建立商品</el-button>
                </div>
            </div>
        </section>

        <el-dialog title="手動建立商品" v-model="showAddDialog" :width="'min(92vw, 760px)'" class="manual-dialog">
            <el-form :model="manualItem" label-width="110px" class="manual-form">
                <div class="manual-form-grid">
                    <el-form-item label="商品名稱">
                        <el-input v-model="manualItem.name" />
                    </el-form-item>
                    <el-form-item label="商品編號">
                        <el-input v-model="manualItem.code" />
                    </el-form-item>
                    <el-form-item label="GTIN">
                        <el-input v-model="manualItem.gtin" />
                    </el-form-item>
                    <el-form-item label="數量">
                        <el-input-number v-model.number="manualItem.quantity" :min="1" />
                    </el-form-item>
                    <el-form-item label="定價">
                        <el-input-number v-model.number="manualItem.price" :min="0" />
                    </el-form-item>
                    <el-form-item label="售價">
                        <el-input-number v-model.number="manualItem.sellingPrice" :min="0" />
                    </el-form-item>
                    <el-form-item label="成本">
                        <el-input-number v-model.number="manualItem.cost" :min="0" />
                    </el-form-item>
                    <el-form-item label="廠商名稱">
                        <el-input v-model="manualItem.supplierName" />
                    </el-form-item>
                    <el-form-item label="廠商編號">
                        <el-input v-model="manualItem.supplierCode" />
                    </el-form-item>
                    <el-form-item label="圖片網址" class="manual-form-span">
                        <el-input v-model="manualItem.imageUrl" placeholder="https://..." />
                    </el-form-item>
                    <el-form-item label="商品網站" class="manual-form-span">
                        <el-input v-model="manualItem.website" placeholder="https://..." />
                    </el-form-item>
                </div>
            </el-form>
            <template #footer>
                <el-button @click="showAddDialog = false">取消</el-button>
                <el-button type="primary" @click="confirmAddManualItem">加入購物車</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import Scanner from "@/components/Scanner.vue";
import { Picture } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { db } from "@/firebase";
import { child, get, push, ref as dbRef, set, update } from "firebase/database";
import { useAuth } from "@/composables/useAuth";
import { useThemeStore } from "@/stores/theme";

const { user } = useAuth();
const themeStore = useThemeStore();
const tableThemeClass = computed(() => (themeStore.isDarkTheme ? "table-dark" : "table-light"));

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
    website?: string;
    quantity: number;
    editing?: boolean;
}

interface Product {
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice?: number;
    cost: number;
    supplierName?: string;
    supplierCode?: string;
    imageUrl?: string;
    website?: string;
    stock?: number;
}

const paymentOptions = [
    { label: "現金", value: "cash" },
    { label: "信用卡", value: "credit_card" },
    { label: "Line Pay", value: "line_pay" },
    { label: "PX Pay", value: "px_pay" },
];

const cart = ref<CartItem[]>([]);
const selectedPayment = ref("");
const showPaymentError = ref(false);
const manualGtin = ref("");
const manualQuantity = ref(1);
const showAddDialog = ref(false);
const manualItem = reactive({
    name: "",
    code: "",
    gtin: "",
    price: 0,
    sellingPrice: 0,
    cost: 0,
    quantity: 1,
    supplierName: "",
    supplierCode: "",
    imageUrl: "",
    website: "",
});

const total = computed(() =>
    cart.value.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0)
);

const totalQuantity = computed(() =>
    cart.value.reduce((sum, item) => sum + item.quantity, 0)
);

const totalProfitPreview = computed(() => {
    const handlingFeeRate = needHandlingFee(selectedPayment.value) ? 0.02 : 0;
    return cart.value.reduce((sum, item) => {
        return sum + (item.sellingPrice - item.cost - item.sellingPrice * handlingFeeRate) * item.quantity;
    }, 0);
});

const paymentLabel = computed(() => {
    return paymentOptions.find((option) => option.value === selectedPayment.value)?.label ?? "尚未選擇";
});

watch(selectedPayment, () => {
    if (selectedPayment.value) {
        showPaymentError.value = false;
    }
});

function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function needHandlingFee(paymentMethod?: string) {
    return ["credit_card", "line_pay", "px_pay"].includes(paymentMethod || "");
}

async function handleScan(scannedGtin: string, quantity = 1) {
    const dbRoot = dbRef(db);
    const snapshot = await get(child(dbRoot, "products"));

    if (!snapshot.exists()) {
        ElMessage({ message: "商品資料不存在。", type: "warning", duration: 1500 });
        return;
    }

    const productsData = snapshot.val() as Record<string, Product>;
    const productEntry = Object.entries(productsData).find(([, data]) => data.gtin === scannedGtin || data.code === scannedGtin);

    if (!productEntry) {
        ElMessage({ message: `找不到商品：${scannedGtin}`, type: "warning", duration: 1500 });
        return;
    }

    const [barcode, product] = productEntry;
    const existingItem = cart.value.find((item) => item.barcode === barcode);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        const sellingPrice = product.sellingPrice ?? product.price ?? 0;
        cart.value.push({
            barcode,
            gtin: product.gtin ?? "",
            code: product.code ?? "",
            name: product.name,
            price: product.price ?? 0,
            sellingPrice,
            cost: product.cost ?? 0,
            supplierName: product.supplierName ?? "",
            supplierCode: product.supplierCode ?? "",
            imageUrl: product.imageUrl ?? "",
            website: product.website ?? "",
            quantity,
            editing: false,
        });
    }

    ElMessage({
        message: `已加入 ${product.name} x ${quantity}`,
        type: "success",
        duration: 1000,
    });
}

async function addManualItem() {
    const scannedGtin = manualGtin.value.trim();
    const quantity = manualQuantity.value;

    if (!scannedGtin || quantity <= 0) {
        ElMessage.warning("請輸入商品編號或 GTIN，並確認數量大於 0。");
        return;
    }

    await handleScan(scannedGtin, quantity);
    manualGtin.value = "";
    manualQuantity.value = 1;
}

function removeItem(index: number) {
    cart.value.splice(index, 1);
}

function clearCart() {
    cart.value.splice(0, cart.value.length);
    ElMessage({
        message: "購物車已全部清空",
        type: "info",
        duration: 1000,
    });
}

function toggleEdit(item: CartItem) {
    item.editing = !item.editing;
    if (item.quantity < 1) item.quantity = 1;
    if (item.sellingPrice < 0) item.sellingPrice = 0;
}

async function confirmCheckout() {
    if (!cart.value.length) return;

    if (!selectedPayment.value) {
        showPaymentError.value = true;
        ElMessage.warning("請先選擇付款方式。");
        return;
    }

    showPaymentError.value = false;

    const salesRef = dbRef(db, "sales");
    const productsRef = dbRef(db, "products");
    const snapshot = await get(productsRef);

    if (!snapshot.exists()) {
        ElMessage({ message: "商品資料不存在。", type: "warning" });
        return;
    }

    const productsData = snapshot.val() as Record<string, Product & { stock?: number }>;
    const updates: Record<string, number> = {};

    for (const item of cart.value) {
        const productEntry = Object.entries(productsData).find(
            ([id, data]) => id === item.barcode || data.code === item.barcode
        );

        if (!productEntry) continue;

        const [id, data] = productEntry;
        const currentStock = data.stock ?? 0;
        const newStock = Math.max(currentStock - item.quantity, 0);
        updates[`${id}/stock`] = newStock;
        updates[`${id}/updated`] = Date.now();
    }

    const newSaleRef = push(salesRef);
    const saleData = {
        timestamp: Date.now(),
        operator: user.value?.displayName || user.value?.email || "",
        paymentMethod: selectedPayment.value,
        items: cart.value.map((item) => ({
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
            website: item.website || "",
            quantity: item.quantity,
            estimatedProfit: item.sellingPrice - item.cost,
        })),
        total: total.value,
        totalProfit: totalProfitPreview.value,
    };

    try {
        await Promise.all([
            update(productsRef, updates),
            set(newSaleRef, saleData),
        ]);

        ElMessage({ message: "結帳完成，庫存已更新。", type: "success", duration: 1500 });
        cart.value.splice(0, cart.value.length);
        selectedPayment.value = "";
        showPaymentError.value = false;
    } catch (error) {
        console.error(error);
        ElMessage({ message: "結帳失敗，請稍後再試。", type: "error", duration: 1500 });
    }
}

function resetManualItem() {
    Object.assign(manualItem, {
        name: "",
        code: "",
        gtin: "",
        price: 0,
        sellingPrice: 0,
        cost: 0,
        quantity: 1,
        supplierName: "",
        supplierCode: "",
        imageUrl: "",
        website: "",
    });
}

function confirmAddManualItem() {
    if (!manualItem.name.trim() || manualItem.quantity <= 0) {
        ElMessage.warning("請至少輸入商品名稱與有效數量。");
        return;
    }

    cart.value.push({
        barcode: `manual_${Date.now()}`,
        gtin: manualItem.gtin || "",
        code: manualItem.code || "",
        name: manualItem.name.trim(),
        price: manualItem.price,
        sellingPrice: manualItem.sellingPrice || manualItem.price,
        cost: manualItem.cost,
        supplierName: manualItem.supplierName,
        supplierCode: manualItem.supplierCode,
        imageUrl: manualItem.imageUrl,
        website: manualItem.website || "",
        quantity: manualItem.quantity,
        editing: false,
    });

    ElMessage.success("商品已手動加入購物車。");
    showAddDialog.value = false;
    resetManualItem();
}
</script>

<style scoped>
.checkout-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
}

.checkout-hero {
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
    max-width: 56ch;
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

.control-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
    gap: 20px;
}

.control-card,
.table-card {
    border: 1px solid var(--surface-border);
    border-radius: 28px;
    background: var(--surface-card);
    box-shadow: var(--surface-shadow);
}

.control-card {
    padding: 24px;
}

.control-head h3,
.table-header h3 {
    margin: 8px 0 0;
    color: var(--heading-color);
    font-size: 1.45rem;
    font-weight: 700;
}

.control-head p {
    margin: 10px 0 0;
    color: var(--muted-text);
    line-height: 1.7;
}

.scanner-shell {
    margin-top: 18px;
    padding: 16px;
    border: 1px solid rgba(20, 36, 58, 0.08);
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(250, 251, 253, 0.96), rgba(244, 247, 250, 0.96));
}

.manual-entry {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(112px, 128px) minmax(148px, 168px) minmax(148px, 168px);
    gap: 12px;
    margin-top: 18px;
    align-items: stretch;
}

.manual-entry > * {
    min-width: 0;
}

.manual-quantity,
.manual-action,
.manual-entry .secondary-btn {
    width: 100%;
}

.summary-card {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.summary-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
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

.payment-panel {
    padding: 18px;
    border-radius: 20px;
    background: linear-gradient(180deg, rgba(24, 46, 73, 0.05), rgba(185, 120, 55, 0.06));
    border: 1px solid rgba(185, 120, 55, 0.12);
}

.payment-label {
    display: block;
    margin-bottom: 10px;
    color: var(--heading-color);
    font-weight: 600;
}

.payment-select {
    width: 100%;
}

.payment-note {
    margin: 10px 0 0;
    color: var(--muted-text);
    line-height: 1.6;
    font-size: 0.92rem;
}

.payment-error {
    margin: 10px 0 0;
    color: #d94e4e;
    line-height: 1.6;
    font-size: 0.92rem;
    font-weight: 600;
}

.summary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
}

.summary-actions :deep(.el-button),
.manual-entry :deep(.el-button) {
    min-height: 44px;
    border-radius: 14px;
    font-weight: 600;
}

.manual-entry :deep(.el-button + .el-button),
.summary-actions :deep(.el-button + .el-button) {
    margin-left: 0;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
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

.checkout-table {
    border: 1px solid var(--surface-border);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--surface-shadow);
}

:deep(.checkout-table th) {
    font-weight: 700;
    text-align: center;
}

:deep(.no-padding-cell .cell) {
    padding: 0 !important;
}

.index-text {
    font-size: 12px;
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

.product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.product-image-fallback {
    font-size: 32px;
    color: #c4ccd6;
}

.qty-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 38px;
    min-height: 38px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(185, 120, 55, 0.14);
    color: var(--heading-color);
    font-weight: 700;
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

.subtotal-value {
    color: #d94e4e;
    font-weight: 700;
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

.row-action-stack :deep(.el-button + .el-button),
.summary-actions :deep(.el-button + .el-button),
.empty-actions :deep(.el-button + .el-button) {
    margin-left: 0;
}

.row-action-btn {
    width: 100%;
}

.empty-state {
    margin-top: 8px;
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

.empty-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 14px;
}

.manual-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4px 18px;
}

.manual-form-span {
    grid-column: 1 / -1;
}

:deep(.manual-dialog .el-dialog) {
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.98);
}

:deep(.manual-dialog .el-dialog__header) {
    margin-right: 0;
    padding: 24px 24px 0;
}

:deep(.manual-dialog .el-dialog__body) {
    padding: 20px 24px 8px;
}

:deep(.manual-dialog .el-dialog__footer) {
    padding: 0 24px 24px;
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
    .control-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 900px) {
    .hero-metrics {
        grid-template-columns: 1fr;
    }

    .manual-entry {
        grid-template-columns: 1fr 1fr;
    }

    .manual-input {
        grid-column: 1 / -1;
    }
}

@media (max-width: 768px) {
    .checkout-hero,
    .control-card,
    .table-card {
        padding: 18px;
        border-radius: 22px;
    }

    .table-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .manual-form-grid {
        grid-template-columns: 1fr;
    }

    .manual-form-span {
        grid-column: auto;
    }
}

@media (max-width: 640px) {
    .manual-entry {
        grid-template-columns: 1fr;
    }

    .manual-quantity,
    .manual-action {
        width: 100%;
    }

    .summary-actions {
        flex-direction: column;
    }

    .summary-actions :deep(.el-button) {
        width: 100%;
    }
}
</style>
