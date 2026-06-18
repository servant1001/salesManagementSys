<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { child, get, orderByChild, query, ref as dbRef, startAt, endAt } from "firebase/database";
import { db } from "@/firebase";

interface SaleRecord {
  id: string;
  total: number;
  totalProfit?: number;
  paymentMethod?: string;
  timestamp: number;
}

const todaySales = ref<SaleRecord[]>([]);
const yesterdaySales = ref<SaleRecord[]>([]);
const loading = ref(false);

function getDayRange(baseDate: Date) {
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0).getTime();
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999).getTime();
  return { start, end };
}

async function loadSalesInRange(startTime: number, endTime: number) {
  const salesRef = child(dbRef(db), "sales");
  const salesQuery = query(salesRef, orderByChild("timestamp"), startAt(startTime), endAt(endTime));
  const snapshot = await get(salesQuery);

  if (!snapshot.exists()) {
    return [];
  }

  const data = snapshot.val() as Record<string, Omit<SaleRecord, "id">>;
  return Object.entries(data)
    .map(([id, value]) => ({
      id,
      total: Number(value.total || 0),
      totalProfit: Number(value.totalProfit || 0),
      paymentMethod: value.paymentMethod || "",
      timestamp: Number(value.timestamp || 0),
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

async function loadDashboardMetrics() {
  loading.value = true;

  try {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayRange = getDayRange(today);
    const yesterdayRange = getDayRange(yesterday);

    const [todayRows, yesterdayRows] = await Promise.all([
      loadSalesInRange(todayRange.start, todayRange.end),
      loadSalesInRange(yesterdayRange.start, yesterdayRange.end),
    ]);

    todaySales.value = todayRows;
    yesterdaySales.value = yesterdayRows;
  } finally {
    loading.value = false;
  }
}

function formatCurrency(value: number) {
  return Number(value || 0).toLocaleString("zh-TW", { maximumFractionDigits: 0 });
}

function getGrowthText(current: number, previous: number, unit = "%") {
  if (previous <= 0 && current > 0) return "較昨日新增啟動";
  if (previous <= 0) return "較昨日持平";

  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `較昨日 ${sign}${change.toFixed(1)}${unit}`;
}

const todayOrderCount = computed(() => todaySales.value.length);
const yesterdayOrderCount = computed(() => yesterdaySales.value.length);
const todayRevenue = computed(() => todaySales.value.reduce((sum, sale) => sum + sale.total, 0));
const yesterdayRevenue = computed(() => yesterdaySales.value.reduce((sum, sale) => sum + sale.total, 0));
const todayProfit = computed(() => todaySales.value.reduce((sum, sale) => sum + (sale.totalProfit ?? 0), 0));
const activePaymentCount = computed(() => new Set(todaySales.value.map((sale) => sale.paymentMethod || "unknown")).size);
const averageOrderValue = computed(() => (todayOrderCount.value ? todayRevenue.value / todayOrderCount.value : 0));
const profitRate = computed(() => (
  todayRevenue.value ? Number(((todayProfit.value / todayRevenue.value) * 100).toFixed(1)) : 0
));

const metrics = computed(() => [
  {
    label: "今日訂單",
    value: loading.value ? "讀取中..." : `${todayOrderCount.value}`,
    detail: getGrowthText(todayOrderCount.value, yesterdayOrderCount.value),
  },
  {
    label: "今日營收",
    value: loading.value ? "讀取中..." : `NT$ ${formatCurrency(todayRevenue.value)}`,
    detail: loading.value
      ? "正在同步銷售資料"
      : `${getGrowthText(todayRevenue.value, yesterdayRevenue.value)} / 平均客單 NT$ ${formatCurrency(averageOrderValue.value)}`,
  },
  {
    label: "今日毛利",
    value: loading.value ? "讀取中..." : `NT$ ${formatCurrency(todayProfit.value)}`,
    detail: loading.value
      ? "正在計算今日毛利"
      : `毛利率 ${profitRate.value}% / ${activePaymentCount.value} 種付款方式`,
  },
]);

const panels = computed(() => [
  {
    title: "即時營運摘要",
    text: loading.value
      ? "首頁正在同步今天的銷售統計資料。"
      : `今天累計 ${todayOrderCount.value} 筆訂單，總營收 NT$ ${formatCurrency(todayRevenue.value)}。`,
  },
  {
    title: "訂單節奏",
    text: loading.value
      ? "正在整理今日訂單節奏。"
      : todayOrderCount.value
        ? `目前平均客單為 NT$ ${formatCurrency(averageOrderValue.value)}，可持續追蹤高峰時段與付款方式分布。`
        : "今天目前尚未產生訂單，可先前往結帳作業或銷售紀錄頁確認資料流。 ",
  },
  {
    title: "下一步建議",
    text: todayOrderCount.value
      ? "可前往銷售紀錄頁查看圖表分析，或在商品列表與供應商頁面持續補強資料品質。"
      : "建議先確認結帳作業是否正常出單，並檢查商品與供應商資料是否完整。",
  },
]);

onMounted(() => {
  void loadDashboardMetrics();
});
</script>

<template>
  <div class="home-page">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="hero-eyebrow">AURA DASHBOARD</span>
        <h1>AURA 銷售管理系統</h1>
        <p>
          讓你隨時隨地，方便、快速、直覺地管理商品、操作結帳與查看銷售紀錄。
        </p>
      </div>
      <div class="hero-badge">
        <strong>{{ loading ? "同步中" : "Live Sales" }}</strong>
        <span>{{ loading ? "Loading dashboard metrics" : "Today synced from Firebase" }}</span>
      </div>
    </section>

    <section class="metrics-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.detail }}</p>
      </article>
    </section>

    <section class="content-grid">
      <article class="feature-panel">
        <div class="panel-header">
          <span class="panel-eyebrow">OVERVIEW</span>
          <h3>今日營運摘要</h3>
        </div>
        <div class="summary-list">
          <div v-for="panel in panels" :key="panel.title" class="summary-item">
            <strong>{{ panel.title }}</strong>
            <p>{{ panel.text }}</p>
          </div>
        </div>
      </article>

      <article class="feature-panel accent-panel">
        <div class="panel-header">
          <span class="panel-eyebrow">NEXT STEP</span>
          <h3>建議檢查項目</h3>
        </div>
        <ol class="step-list">
          <li>確認今天的訂單數與營收是否符合預期。</li>
          <li>若出單量異常，前往銷售紀錄頁查看圖表分析與明細。</li>
          <li>若要補齊基礎資料，可回商品列表與供應商管理持續維護。</li>
        </ol>
      </article>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-card,
.metric-card,
.feature-panel {
  border: 1px solid var(--surface-border);
  border-radius: 28px;
  background: var(--surface-card);
  box-shadow: var(--surface-shadow);
}

.hero-card {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 32px;
  background:
    radial-gradient(circle at top right, rgba(77, 131, 180, 0.2), transparent 28%),
    linear-gradient(135deg, rgba(12, 31, 54, 0.96), rgba(26, 64, 99, 0.9));
}

.hero-copy {
  max-width: 720px;
}

.hero-eyebrow,
.panel-eyebrow {
  display: inline-flex;
  color: var(--accent-color);
  font-size: 0.76rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin-top: 10px;
  color: #f5f8fc;
  font-size: clamp(2rem, 4vw, 3.1rem);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.hero-copy p {
  margin-top: 16px;
  max-width: 640px;
  color: rgba(232, 238, 246, 0.8);
  line-height: 1.85;
}

.hero-badge {
  min-width: 180px;
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
}

.hero-badge strong {
  display: block;
  color: #f5f8fc;
  font-size: 1.12rem;
}

.hero-badge span {
  display: block;
  margin-top: 6px;
  color: rgba(232, 238, 246, 0.68);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.metric-card {
  padding: 24px;
}

.metric-card span {
  color: var(--muted-text);
  font-size: 0.86rem;
}

.metric-card strong {
  display: block;
  margin-top: 12px;
  color: var(--heading-color);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.metric-card p {
  margin-top: 10px;
  color: var(--muted-text);
  line-height: 1.7;
}

.content-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.feature-panel {
  padding: 28px;
}

.panel-header h3 {
  margin-top: 8px;
  color: var(--heading-color);
  font-size: 1.45rem;
  font-weight: 700;
}

.summary-list {
  display: grid;
  gap: 14px;
  margin-top: 22px;
}

.summary-item {
  padding: 18px 20px;
  border-radius: 20px;
  background: var(--surface-muted);
}

.summary-item strong {
  color: var(--heading-color);
  font-size: 1rem;
  font-weight: 600;
}

.summary-item p {
  margin-top: 8px;
  color: var(--muted-text);
  line-height: 1.7;
}

.accent-panel {
  background:
    radial-gradient(circle at top right, rgba(205, 154, 94, 0.12), transparent 26%),
    var(--surface-card);
}

.step-list {
  margin-top: 22px;
  padding-left: 20px;
  color: var(--muted-text);
  line-height: 1.9;
}

.step-list li+li {
  margin-top: 10px;
}

@media (max-width: 960px) {
  .hero-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .metrics-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
