<template>
  <div class="vendor-page">
    <section class="page-hero">
      <div>
        <span class="page-eyebrow">VENDOR DIRECTORY</span>
        <h1>供應商管理</h1>
        <p>
          集中維護供應商資料、聯絡方式、網站與備註資訊，讓進貨管理、商品建檔與日常查詢保持一致節奏。
        </p>
      </div>
      <div class="hero-badge">
        <strong>{{ filteredVendors.length }}</strong>
        <span>目前供應商筆數</span>
      </div>
    </section>

    <section class="control-card">
      <div class="control-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜尋供應商名稱或供應商編號"
          clearable
          @input="filterVendors"
          class="search-input"
        />

        <el-select
          v-model="countryFilter"
          placeholder="選擇地區"
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
            {{ showActions ? "關閉操作模式" : "開啟操作模式" }}
          </el-button>
        </div>
      </div>
    </section>

    <section class="table-card">
      <div class="section-header">
        <div>
          <span class="section-eyebrow">LIST</span>
          <h2>供應商清單</h2>
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

          <el-table-column v-if="showActions" fixed="left" label="操作" min-width="166">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button
                  type="primary"
                  size="small"
                  class="row-action-btn row-action-btn--edit"
                  @click="openDialog(row)"
                >
                  編輯
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  class="row-action-btn row-action-btn--delete"
                  @click="deleteVendor(row.id)"
                >
                  刪除
                </el-button>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="vendorId" label="供應商編號" sortable min-width="120" />
          <el-table-column prop="vendorName" label="供應商名稱" min-width="180" />
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
              <span>{{ row.note || "無備註" }}</span>
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
        <el-form-item label="供應商編號" required>
          <el-input v-model="form.vendorId" placeholder="例如 TW001 或 CN003" />
        </el-form-item>
        <el-form-item label="供應商名稱" required>
          <el-input v-model="form.vendorName" placeholder="請輸入供應商名稱" />
        </el-form-item>
        <el-form-item label="聯絡資訊">
          <el-input v-model="form.contact" placeholder="請輸入聯絡人、電話或 Email" />
        </el-form-item>
        <el-form-item label="網站">
          <el-input v-model="form.website" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="備註">
          <el-input v-model="form.note" type="textarea" :rows="4" placeholder="補充說明或合作備註..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="secondary-btn" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" class="primary-btn" @click="saveVendor">儲存</el-button>
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
    const query = searchKeyword.value.trim().toLowerCase()
    const matchesKeyword = query
      ? vendor.vendorName.toLowerCase().includes(query) || vendor.vendorId.toLowerCase().includes(query)
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
    ElMessage.warning('請先輸入供應商編號與供應商名稱。')
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
    await ElMessageBox.confirm(
      '確認要刪除此供應商資料嗎？此操作無法復原。',
      '刪除確認',
      {
        confirmButtonText: '確認刪除',
        cancelButtonText: '取消',
        type: 'warning',
        draggable: true,
        autofocus: false,
        lockScroll: true,
      },
    )

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
  min-height: 100%;
  height: 100%;
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

.action-buttons :deep(.el-button + .el-button),
.dialog-footer :deep(.el-button + .el-button),
.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.primary-btn,
.secondary-btn,
.row-action-btn {
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    color 0.18s ease,
    filter 0.18s ease;
}

.primary-btn:hover,
.primary-btn:focus-visible,
.secondary-btn:hover,
.secondary-btn:focus-visible,
.row-action-btn:hover,
.row-action-btn:focus-visible {
  transform: translateY(-1px);
}

.primary-btn {
  min-height: 44px;
  border-radius: 14px;
  border-color: rgba(185, 122, 55, 0.38);
  background:
    radial-gradient(circle at top right, rgba(214, 164, 107, 0.24), transparent 48%),
    linear-gradient(180deg, rgba(17, 40, 66, 0.98), rgba(24, 54, 86, 0.96));
  color: #f7fbff;
  font-weight: 700;
  box-shadow: 0 14px 28px rgba(16, 36, 58, 0.18);
}

.primary-btn:hover,
.primary-btn:focus-visible {
  border-color: rgba(214, 164, 107, 0.56);
  background:
    radial-gradient(circle at top right, rgba(214, 164, 107, 0.3), transparent 46%),
    linear-gradient(180deg, rgba(14, 34, 58, 1), rgba(22, 49, 79, 0.98));
  color: #ffffff;
  box-shadow: 0 18px 32px rgba(16, 36, 58, 0.22);
}

.secondary-btn {
  min-height: 44px;
  border-radius: 14px;
  border-color: rgba(20, 36, 58, 0.1);
  background: rgba(255, 255, 255, 0.9);
  color: #10243c;
  font-weight: 600;
  box-shadow: 0 10px 20px rgba(16, 36, 58, 0.08);
}

.secondary-btn:hover,
.secondary-btn:focus-visible {
  border-color: rgba(77, 131, 180, 0.28);
  background: rgba(247, 250, 252, 1);
  color: #10243c;
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

.row-action-btn {
  min-height: 34px;
  border-radius: 12px;
  font-weight: 600;
  padding-inline: 12px;
}

.row-action-btn--edit {
  border-color: rgba(77, 131, 180, 0.26);
  background: linear-gradient(180deg, rgba(24, 54, 86, 0.96), rgba(35, 74, 113, 0.94));
  color: #f7fbff;
  box-shadow: 0 10px 20px rgba(16, 36, 58, 0.16);
}

.row-action-btn--edit:hover,
.row-action-btn--edit:focus-visible {
  border-color: rgba(77, 131, 180, 0.4);
  background: linear-gradient(180deg, rgba(20, 46, 74, 1), rgba(31, 66, 101, 0.98));
  color: #ffffff;
}

.row-action-btn--delete {
  border-color: rgba(217, 92, 92, 0.2);
  background: linear-gradient(180deg, rgba(191, 72, 72, 0.96), rgba(170, 58, 58, 0.94));
  color: #fff8f8;
  box-shadow: 0 10px 20px rgba(191, 72, 72, 0.18);
}

.row-action-btn--delete:hover,
.row-action-btn--delete:focus-visible {
  border-color: rgba(217, 92, 92, 0.34);
  background: linear-gradient(180deg, rgba(176, 60, 60, 1), rgba(155, 48, 48, 0.98));
  color: #ffffff;
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

:deep(.vendor-dialog .el-dialog) {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.98);
}

:deep(.vendor-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 24px 24px 0;
}

:deep(.vendor-dialog .el-dialog__body) {
  padding: 20px 24px 8px;
}

:deep(.vendor-dialog .el-dialog__footer) {
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
    min-height: 100%;
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
