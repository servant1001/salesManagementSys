<template>
  <div class="vendor-page">
    <section class="page-hero">
      <div>
        <span class="page-eyebrow">VENDOR DIRECTORY</span>
        <h1>供應商管理</h1>
        <p>
          集中整理供應商編號、名稱、聯絡方式與備註資訊，讓進貨、商品維護與後續查詢都更快速。
        </p>
      </div>
      <div class="hero-badge">
        <strong>{{ totalVendors }}</strong>
        <span>符合條件的供應商</span>
      </div>
    </section>

    <section class="control-card">
      <div class="control-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜尋供應商名稱或編號"
          clearable
          @input="handleSearchInput"
          @clear="handleSearchInput"
          class="search-input"
        />

        <el-select
          v-model="countryFilter"
          placeholder="選擇地區"
          @change="handleCountryChange"
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
          <h2>供應商列表</h2>
        </div>
        <div class="table-meta">
          <span>共 {{ totalVendors }} 筆</span>
          <span>第 {{ currentPage }} / {{ totalPages }} 頁</span>
        </div>
      </div>

      <div ref="tableScrollRef" :class="['table-scroll', { 'is-switching': loading }]">
        <el-table
          :data="vendors"
          border
          :class="['vendor-table', tableThemeClass]"
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
          <el-table-column prop="contact" label="聯絡方式" min-width="150" />
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
              <span>{{ row.note || '無備註' }}</span>
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

        <transition name="table-fade">
          <div v-if="loading" class="table-loading-overlay">
            <div class="table-loading-panel">
              <div class="table-loading-dots">
                <span class="table-loading-dot"></span>
                <span class="table-loading-dot"></span>
                <span class="table-loading-dot"></span>
              </div>
              <p>載入中</p>
            </div>
          </div>
        </transition>
      </div>

      <div class="table-pagination">
        <el-pagination
          background
          layout="prev, pager, next, sizes, total"
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalVendors"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
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
        <el-form-item label="聯絡方式">
          <el-input v-model="form.contact" placeholder="請輸入電話、Email 或聯絡資訊" />
        </el-form-item>
        <el-form-item label="網站">
          <el-input v-model="form.website" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="備註">
          <el-input v-model="form.note" type="textarea" :rows="4" placeholder="輸入補充說明" />
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
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuth } from '@/composables/useAuth'
import { useThemeStore } from '@/stores/theme'
import {
  deleteVendorById,
  fetchVendorsPage,
  insertVendor,
  updateVendor as updateVendorRecord,
  type Vendor,
} from '@/services/vendors'

const { user } = useAuth()
const themeStore = useThemeStore()
const tableThemeClass = computed(() => (themeStore.isDarkTheme ? 'table-dark' : 'table-light'))

const vendors = ref<Vendor[]>([])
const searchKeyword = ref('')
const countryFilter = ref<'all' | 'TW' | 'CN'>('all')
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')
const formRef = ref()
const form = ref<Partial<Vendor>>({})
const showActions = ref(false)
const tableScrollRef = ref<HTMLElement | null>(null)
const tableHeight = ref(320)
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const totalVendors = ref(0)

let tableResizeObserver: ResizeObserver | null = null
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

const totalPages = computed(() => Math.max(1, Math.ceil(totalVendors.value / pageSize.value)))

function formatDate(ts: number) {
  return new Date(ts).toLocaleString()
}

async function loadVendors() {
  try {
    loading.value = true

    const result = await fetchVendorsPage({
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchKeyword.value,
      country: countryFilter.value,
    })

    vendors.value = result.items
    totalVendors.value = result.total

    const maxPage = Math.max(1, Math.ceil(result.total / pageSize.value))
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage
      if (result.total > 0) {
        await loadVendors()
      }
    }
  } catch (error: any) {
    console.error(error)
    vendors.value = []
    totalVendors.value = 0
    ElMessage.error(error?.message || '讀取供應商資料失敗')
  } finally {
    loading.value = false
  }
}

function updateTableHeight() {
  if (!tableScrollRef.value) return

  const fallbackHeight = window.innerWidth < 768 ? 220 : 280
  const availableHeight = Math.floor(tableScrollRef.value.clientHeight)
  tableHeight.value = availableHeight > 0 ? availableHeight : fallbackHeight
}

function queueReloadFromFirstPage() {
  currentPage.value = 1
  void loadVendors()
}

function handleSearchInput() {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }

  searchDebounceTimer = setTimeout(() => {
    queueReloadFromFirstPage()
  }, 300)
}

function handleCountryChange() {
  queueReloadFromFirstPage()
}

function handlePageChange(page: number) {
  currentPage.value = page
  void loadVendors()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadVendors()
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
    ElMessage.warning('請先輸入供應商編號與供應商名稱')
    return
  }

  const timestamp = Date.now()
  const currentUser = user.value?.displayName || user.value?.email || 'system'
  const nextVendorKey = dialogMode.value === 'add' ? globalThis.crypto.randomUUID() : form.value.id

  if (!nextVendorKey) {
    ElMessage.error('供應商資料缺少識別 ID')
    return
  }

  try {
    if (dialogMode.value === 'add') {
      await insertVendor({
        id: nextVendorKey,
        firebaseId: nextVendorKey,
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

      currentPage.value = 1
      await loadVendors()
    } else if (dialogMode.value === 'edit' && form.value.id) {
      const existingVendor = vendors.value.find((vendor) => vendor.id === form.value.id)
      const updatedVendor = await updateVendorRecord({
        id: form.value.id,
        firebaseId: form.value.id,
        vendorId: form.value.vendorId,
        vendorName: form.value.vendorName,
        contact: form.value.contact || '',
        website: form.value.website || '',
        note: form.value.note || '',
        createdBy: existingVendor?.createdBy || currentUser,
        updatedBy: currentUser,
        createdAt: existingVendor?.createdAt || timestamp,
        updatedAt: timestamp,
      })

      const index = vendors.value.findIndex((vendor) => vendor.id === updatedVendor.id)
      if (index >= 0) {
        const nextItems = [...vendors.value]
        nextItems.splice(index, 1, updatedVendor)
        vendors.value = nextItems
      } else {
        await loadVendors()
      }
    }

    dialogVisible.value = false
    ElMessage.success(dialogMode.value === 'add' ? '供應商新增成功' : '供應商更新成功')
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error?.message || '儲存供應商失敗')
  }
}

async function deleteVendor(id?: string) {
  if (!id) return

  try {
    await ElMessageBox.confirm('確認要刪除這筆供應商資料嗎？刪除後將無法復原。', '刪除確認', {
      confirmButtonText: '確認刪除',
      cancelButtonText: '取消',
      type: 'warning',
      draggable: true,
      autofocus: false,
      lockScroll: true,
    })

    await deleteVendorById(id)
    await loadVendors()
    ElMessage.success('供應商刪除成功')
  } catch (error: any) {
    if (error === 'cancel' || error === 'close' || error?.message === 'cancel') {
      ElMessage.info('已取消刪除')
      return
    }

    console.error(error)
    ElMessage.error(error?.message || '刪除供應商失敗')
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

  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
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
  gap: 16px;
  margin-bottom: 18px;
}

.section-header h2 {
  margin-top: 8px;
  color: var(--heading-color);
  font-size: 1.45rem;
  font-weight: 700;
}

.table-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  justify-content: flex-end;
  color: var(--muted-text);
  font-size: 0.92rem;
}

.vendor-table {
  border-radius: 18px;
  min-width: 1180px;
}

:deep(.vendor-table.el-table) {
  --el-table-border-color: var(--surface-border);
  --el-table-border: 1px solid var(--surface-border);
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(185, 120, 55, 0.08);
  --el-table-current-row-bg-color: rgba(185, 120, 55, 0.12);
  border-radius: 20px;
  overflow: hidden;
  background: transparent;
}

:deep(.vendor-table .el-table__inner-wrapper::before) {
  display: none;
}

:deep(.vendor-table th.el-table__cell) {
  font-weight: 700;
  text-align: center;
}

:deep(.vendor-table td.el-table__cell),
:deep(.vendor-table th.el-table__cell.is-leaf) {
  border-bottom-color: var(--surface-border);
}

:deep(.vendor-table .el-table__body td.el-table__cell) {
  background: transparent;
}

:deep(.vendor-table .el-table__fixed),
:deep(.vendor-table .el-table__fixed-right) {
  box-shadow: none;
}

:deep(.vendor-table .el-table__fixed-body-wrapper td.el-table__cell),
:deep(.vendor-table .el-table__fixed-header-wrapper th.el-table__cell) {
  background: inherit;
}

.table-light :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(185, 120, 55, 0.08) !important;
}

.table-dark :deep(.el-table__header-wrapper th.el-table__cell) {
  background:
    linear-gradient(180deg, rgba(18, 45, 72, 0.98), rgba(14, 33, 54, 0.96)) !important;
  color: #eef4fb !important;
  border-bottom-color: rgba(255, 255, 255, 0.08) !important;
}

.table-dark :deep(.el-table__body tr > td.el-table__cell) {
  background: linear-gradient(180deg, rgba(11, 27, 45, 0.92), rgba(9, 23, 38, 0.9)) !important;
  color: #d9e2ef;
  border-bottom-color: rgba(255, 255, 255, 0.06) !important;
}

.table-dark :deep(.el-table__body tr:nth-child(even) > td.el-table__cell) {
  background: linear-gradient(180deg, rgba(13, 31, 50, 0.94), rgba(10, 24, 41, 0.92)) !important;
}

.table-dark :deep(.el-table__body tr:hover > td.el-table__cell) {
  background:
    radial-gradient(circle at left center, rgba(214, 164, 107, 0.12), transparent 28%),
    linear-gradient(180deg, rgba(18, 38, 60, 0.98), rgba(12, 29, 48, 0.96)) !important;
}

.table-dark :deep(.el-table__fixed-body-wrapper tr > td.el-table__cell),
.table-dark :deep(.el-table__fixed-header-wrapper th.el-table__cell) {
  background: inherit !important;
}

.table-dark :deep(.el-table__empty-block) {
  background: linear-gradient(180deg, rgba(10, 24, 41, 0.92), rgba(8, 20, 34, 0.9));
}

.table-dark :deep(.el-table__empty-text) {
  color: #95a7bb;
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
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  transition:
    opacity 0.26s ease,
    transform 0.26s ease,
    filter 0.26s ease;
}

.table-scroll.is-switching :deep(.vendor-table) {
  opacity: 0.58;
  transform: translateY(8px) scale(0.995);
  filter: saturate(0.88);
}

.table-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(10, 24, 41, 0.18), rgba(17, 40, 66, 0.12)),
    radial-gradient(circle at top, rgba(214, 164, 107, 0.12), transparent 34%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.table-loading-panel {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border: 1px solid rgba(214, 164, 107, 0.24);
  border-radius: 18px;
  background: rgba(12, 28, 46, 0.72);
  box-shadow: 0 18px 34px rgba(9, 22, 37, 0.2);
}

.table-loading-panel p {
  margin: 0;
  color: #eef4fb;
  font-size: 0.92rem;
  letter-spacing: 0.08em;
}

.table-loading-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-loading-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(180deg, #f0c998, #d6a46b);
  box-shadow: 0 0 0 4px rgba(214, 164, 107, 0.12);
  animation: vendorLoadingPulse 1.05s ease-in-out infinite;
}

.table-loading-dot:nth-child(2) {
  animation-delay: 0.14s;
}

.table-loading-dot:nth-child(3) {
  animation-delay: 0.28s;
}

.table-fade-enter-active,
.table-fade-leave-active {
  transition: opacity 0.22s ease;
}

.table-fade-enter-from,
.table-fade-leave-to {
  opacity: 0;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 18px;
}

.table-pagination :deep(.el-pagination) {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.table-pagination :deep(.btn-prev),
.table-pagination :deep(.btn-next),
.table-pagination :deep(.el-pager li) {
  transition:
    transform 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.table-pagination :deep(.btn-prev:hover),
.table-pagination :deep(.btn-next:hover),
.table-pagination :deep(.el-pager li:hover) {
  transform: translateY(-1px);
}

.table-pagination :deep(.el-pager li.is-active) {
  background: linear-gradient(180deg, rgba(190, 104, 37, 0.98), rgba(223, 156, 69, 0.94));
  color: #10243c;
  box-shadow: 0 10px 18px rgba(190, 104, 37, 0.22);
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

.table-dark .site-link {
  color: #9bc2ec;
}

.table-dark .site-link:hover {
  color: #d8eaff;
}

.muted-cell {
  color: var(--muted-text);
}

.table-dark .muted-cell {
  color: #8ea3b8;
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

  .section-header {
    align-items: flex-start;
    flex-direction: column;
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

  .table-pagination {
    justify-content: center;
  }

  .table-pagination :deep(.el-pagination) {
    justify-content: center;
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

@keyframes vendorLoadingPulse {
  0%,
  100% {
    transform: translateY(0) scale(0.92);
    opacity: 0.56;
  }

  50% {
    transform: translateY(-4px) scale(1);
    opacity: 1;
  }
}
</style>
