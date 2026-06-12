<script setup lang="ts">
const metrics = [
  { label: '今日訂單', value: '128', detail: '比昨日成長 12%' },
  { label: '待補商品', value: '14', detail: '3 項需要優先處理' },
  { label: '本月營收', value: 'NT$ 842K', detail: '達成率 78%' },
]

const panels = [
  {
    title: '今日重點',
    text: '優先處理低庫存商品與待確認供應商訂單，維持結帳與補貨節奏穩定。',
  },
  {
    title: '門市節奏',
    text: '上午來客較集中，建議先確認熱銷品庫存與結帳區人力配置。',
  },
  {
    title: '系統狀態',
    text: '目前資料同步與帳號服務正常，可持續進行商品與銷售操作。',
  },
]
</script>

<template>
  <div class="home-page">
    <section class="hero-card">
      <div class="hero-copy">
        <span class="hero-eyebrow">AURA DASHBOARD</span>
        <h1>讓每天的銷售決策，看起來更清楚一點。</h1>
        <p>
          從首頁直接掌握今日營運重點、補貨節奏與系統狀態，讓團隊在同一個畫面上協作。
        </p>
      </div>
      <div class="hero-badge">
        <strong>Retail flow</strong>
        <span>Unified ops view</span>
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
          <h3>建議操作順序</h3>
        </div>
        <ol class="step-list">
          <li>先查看商品管理頁，確認低庫存與待上架商品。</li>
          <li>進入結帳作業與銷售紀錄，檢查今日交易狀態。</li>
          <li>若有補貨需求，再到供應商管理安排後續流程。</li>
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

.step-list li + li {
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
