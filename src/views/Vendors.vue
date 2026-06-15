<template>
  <div class="vendor-page">
    <section class="page-hero">
      <div>
        <span class="page-eyebrow">VENDOR DIRECTORY</span>
        <h1>供應商管理</h1>
        <p>集中整理合作廠商資訊，快速搜尋、編輯與維護供應關係資料。</p>
      </div>
      <div class="hero-badge">
        <strong>{{ filteredVendors.length }}</strong>
        <span>目前顯示筆數</span>
      </div>
    </section>

    <section class="control-card">
      <div class="control-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜尋供應商名稱"
          clearable
          @input="filterVendors"
          class="search-input"
        />

        <el-select
          v-model="countryFilter"
          placeholder="地區篩選"
          @change="filterVendors"
          class="country-select"
        >
          <el-option label="全部地區" value="all" />
          <el-option label="台灣" value="TW" />
          <el-option label="中國" value="CN" />
        </el-select>

        <div class="action-buttons">
          <el-button type="primary" class="primary-btn" @click="openDialog()">
            新增供應商
          </el-button>
          <el-button class="secondary-btn" @click="toggleEditMode">
            {{ showActions ? '關閉操作模式' : '開啟操作模式' }}
          </el-button>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="section-header">
        <div>
          <span class="section-eyebrow">LIST</span>
          <h2>廠商列表</h2>
        </div>
      </div>

      <div ref="tableScrollRef" class="table-scroll">
        <el-table
          :data="filteredVendors"
          border
          class="vendor-table"
          style="width: 100%"
          :height="tableHeight"
          empty-text="目前沒有供應商資料"
        >
          <el-table-column type="index" label="#" width="60" align="center" />

          <el-table-column v-if="showActions" fixed="left" label="操作" min-width="156">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button type="primary" size="small" @click="openDialog(row)">編輯</el-button>
                <el-button type="danger" size="small" @click="deleteVendor(row.id)">刪除</el-button>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="vendorId" label="廠商編號" sortable min-width="120" />
          <el-table-column prop="vendorName" label="廠商名稱" min-width="180" />
          <el-table-column prop="contact" label="聯絡資訊" min-width="150" />
          <el-table-column prop="website" label="網站" min-width="180">
            <template #default="{ row }">
              <a
                v-if="row.website"
                :href="row.website"
                target="_blank"
                rel="noreferrer"
                class="site-link"
              >
                {{ row.website }}
              </a>
              <span v-else class="muted-cell">未提供</span>
            </template>
          </el-table-column>
          <el-table-column prop="note" label="備註" min-width="180">
            <template #default="{ row }">
              <span>{{ row.note || '未填寫' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdBy" label="建立者" min-width="120" />
          <el-table-column prop="updatedBy" label="更新者" min-width="120" />
          <el-table-column prop="createdAt" label="建立時間" min-width="180">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新時間" min-width="180">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </section>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增供應商' : '編輯供應商'"
      width="500px"
      :before-close="() => (dialogVisible = false)"
      class="vendor-dialog"
    >
      <el-form :model="form" ref="formRef" label-width="96px" class="vendor-form">
        <el-form-item label="廠商編號" required>
          <el-input v-model="form.vendorId" placeholder="例如 TW001 或 CN003" />
        </el-form-item>
        <el-form-item label="廠商名稱" required>
          <el-input v-model="form.vendorName" placeholder="請輸入供應商名稱" />
        </el-form-item>
        <el-form-item label="聯絡資訊">
          <el-input v-model="form.contact" placeholder="請輸入聯絡人或電話" />
        </el-form-item>
        <el-form-item label="網站">
          <el-input v-model="form.website" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="備註">
          <el-input v-model="form.note" type="textarea" :rows="4" placeholder="補充說明..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveVendor">儲存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { db } from '@/firebase'
import { ref as dbRef, get, child, push, set, update, remove } from 'firebase/database'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'

const { user } = useAuth()

interface Vendor {
  id?: string
  vendorId: string
  vendorName: string
  contact?: string
  website?: string
  note?: string
  createdBy: string
  updatedBy: string
  createdAt: number
  updatedAt: number
}

const vendors = ref<Vendor[]>([])
const filteredVendors = ref<Vendor[]>([])
const searchKeyword = ref('')
const countryFilter = ref<'all' | 'TW' | 'CN'>('all')
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref()
const form = ref<Partial<Vendor>>({})
const showActions = ref(false)
const tableScrollRef = ref<HTMLElement | null>(null)
const tableHeight = ref(320)
let tableResizeObserver: ResizeObserver | null = null

function formatDate(ts: number) {
  return new Date(ts).toLocaleString()
}

async function loadVendors() {
  const snapshot = await get(child(dbRef(db), 'vendors'))

  if (snapshot.exists()) {
    const data = snapshot.val()

    vendors.value = Object.entries(data)
      .map(([id, value]: [string, any]) => ({
        id,
        ...value,
      }))
      .sort((a, b) => {
        const idA = isNaN(Number(a.vendorId)) ? a.vendorId : Number(a.vendorId)
        const idB = isNaN(Number(b.vendorId)) ? b.vendorId : Number(b.vendorId)
        return idA > idB ? 1 : idA < idB ? -1 : 0
      })

    filterVendors()
    return
  }

  vendors.value = []
  filteredVendors.value = []
}

function updateTableHeight() {
  if (!tableScrollRef.value) return

  const fallbackHeight = window.innerWidth < 768 ? 220 : 280
  const availableHeight = Math.floor(tableScrollRef.value.clientHeight)
  tableHeight.value = availableHeight > 0 ? availableHeight : fallbackHeight
}

function filterVendors() {
  filteredVendors.value = vendors.value.filter((vendor) => {
    const matchesKeyword = searchKeyword.value
      ? vendor.vendorName.toLowerCase().includes(searchKeyword.value.toLowerCase())
      : true

    const matchesCountry =
      countryFilter.value === 'all'
        ? true
        : countryFilter.value === 'TW'
          ? vendor.vendorId.startsWith('TW')
          : vendor.vendorId.startsWith('CN')

    return matchesKeyword && matchesCountry
  })
}

function toggleEditMode() {
  showActions.value = !showActions.value
}

function openDialog(vendor?: Vendor) {
  if (vendor) {
    dialogMode.value = 'edit'
    form.value = { ...vendor }
  } else {
    dialogMode.value = 'add'
    form.value = {
      vendorId: '',
      vendorName: '',
      contact: '',
      website: '',
      note: '',
    }
  }

  dialogVisible.value = true
}

async function saveVendor() {
  if (!form.value.vendorId || !form.value.vendorName) {
    ElMessage.warning('請填寫廠商編號與廠商名稱。')
    return
  }

  const timestamp = Date.now()
  const currentUser = user.value?.displayName || user.value?.email || 'system'

  if (dialogMode.value === 'add') {
    const newRef = push(child(dbRef(db), 'vendors'))
    await set(newRef, {
      vendorId: form.value.vendorId,
      vendorName: form.value.vendorName,
      contact: form.value.contact || '',
      website: form.value.website || '',
      note: form.value.note || '',
      createdBy: currentUser,
      updatedBy: currentUser,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  } else if (dialogMode.value === 'edit' && form.value.id) {
    await update(child(dbRef(db), `vendors/${form.value.id}`), {
      vendorId: form.value.vendorId,
      vendorName: form.value.vendorName,
      contact: form.value.contact || '',
      website: form.value.website || '',
      note: form.value.note || '',
      updatedBy: currentUser,
      updatedAt: timestamp,
    })
  }

  dialogVisible.value = false
  ElMessage.success(dialogMode.value === 'add' ? '供應商已新增。' : '供應商資料已更新。')
  await loadVendors()
}

async function deleteVendor(id?: string) {
  if (!id) return

  try {
    await ElMessageBox.confirm('確定要刪除這筆供應商資料嗎？此操作無法復原。', '刪除確認', {
      confirmButtonText: '確認刪除',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
      autofocus: false,
      lockScroll: true,
    })

    await remove(child(dbRef(db), `vendors/${id}`))
    await loadVendors()
    ElMessage.success('供應商資料已刪除。')
  } catch {
    ElMessage.info('已取消刪除。')
  }
}

onMounted(async () => {
  await loadVendors()
  await nextTick()
  updateTableHeight()
  window.addEventListener('resize', updateTableHeight)

  if (tableScrollRef.value && typeof ResizeObserver !== 'undefined') {
    tableResizeObserver = new ResizeObserver(() => {
      updateTableHeight()
    })
    tableResizeObserver.observe(tableScrollRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTableHeight)
  tableResizeObserver?.disconnect()
})
</script>

<style scoped>
.vendor-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  height: calc(100dvh - 44px);
  overflow: hidden;
}

.page-hero,
.control-card,
.table-card {
  border: 1px solid var(--surface-border);
  border-radius: 28px;
  background: var(--surface-card);
  box-shadow: var(--surface-shadow);
  flex-shrink: 0;
}

.page-hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  padding: 30px 32px;
  background:
    radial-gradient(circle at top right, rgba(77, 131, 180, 0.18), transparent 28%),
    linear-gradient(135deg, rgba(12, 31, 54, 0.96), rgba(26, 64, 99, 0.9));
}

.page-eyebrow,
.section-eyebrow {
  display: inline-flex;
  color: var(--accent-color);
  font-size: 0.76rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.page-hero h1 {
  margin-top: 10px;
  color: #f5f8fc;
  font-size: clamp(1.9rem, 3vw, 2.7rem);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.page-hero p {
  margin-top: 14px;
  max-width: 640px;
  color: rgba(232, 238, 246, 0.8);
  line-height: 1.8;
}

.hero-badge {
  min-width: 160px;
  padding: 20px 22px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.06);
}

.hero-badge strong {
  display: block;
  color: #f5f8fc;
  font-size: 2rem;
  font-weight: 700;
}

.hero-badge span {
  display: block;
  margin-top: 6px;
  color: rgba(232, 238, 246, 0.68);
}

.control-card,
.table-card {
  padding: 24px;
}

.control-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.search-input,
.country-select {
  width: 100%;
}

.search-input {
  flex: 1 1 320px;
}

.country-select {
  flex: 0 0 160px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-left: auto;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.action-buttons :deep(.el-button + .el-button) {
  margin-left: 0;
}

.primary-btn,
.secondary-btn {
  min-height: 44px;
  border-radius: 14px;
}

.secondary-btn {
  color: var(--heading-color);
  border-color: var(--surface-border);
  background: var(--surface-muted);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h2 {
  margin-top: 8px;
  color: var(--heading-color);
  font-size: 1.45rem;
  font-weight: 700;
}

.vendor-table {
  border-radius: 18px;
  min-width: 1180px;
}

.table-card {
  min-width: 0;
  overflow: hidden;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.table-scroll {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.site-link {
  color: #2f6fa8;
  text-decoration: none;
}

.site-link:hover {
  text-decoration: underline;
}

.muted-cell {
  color: var(--muted-text);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

@media (max-width: 960px) {
  .page-hero {
    align-items: flex-start;
  }

  .control-bar {
    align-items: stretch;
  }

  .action-buttons {
    margin-left: 0;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .vendor-page {
    height: auto;
    min-height: calc(100dvh - 86px);
    gap: 14px;
    overflow: visible;
  }

  .page-hero {
    padding: 18px;
  }

  .page-hero p {
    margin-top: 10px;
    line-height: 1.65;
    font-size: 0.95rem;
  }

  .hero-badge {
    width: 100%;
    min-width: 0;
    padding: 14px 16px;
  }

  .control-card,
  .table-card {
    padding: 18px;
  }

  .table-card {
    flex: initial;
    min-height: 420px;
  }

  .table-scroll {
    min-height: 320px;
  }

  .control-bar {
    gap: 10px;
  }

  .search-input,
  .country-select,
  .action-buttons {
    flex-basis: 100%;
  }

  .action-buttons {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    margin-left: 0;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }

  .section-header {
    margin-bottom: 12px;
  }
}

@media (max-width: 640px) {
  .action-buttons {
    grid-template-columns: 1fr;
  }

  .country-select {
    flex-basis: auto;
  }
}
</style>
