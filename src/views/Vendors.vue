<template>
    <div class="vendor-page">
        <!-- 標題 -->
        <el-row class="titleBar">
            <el-col :span="24" class="title-col">
                <h2>廠商列表</h2>
            </el-col>
        </el-row>

        <div class="top-bar">
            <!-- 搜尋框 -->
            <el-input v-model="searchKeyword" placeholder="搜尋廠商名稱" clearable @input="filterVendors"
                class="search-input" />

            <!-- 按鈕組 -->
            <div class="action-buttons">
                <el-button type="primary" @click="openDialog()">新增廠商</el-button>
                <el-button :type="showActions ? 'warning' : 'info'" @click="toggleEditMode">
                    {{ showActions ? '退出編輯模式' : '進入編輯模式' }}
                </el-button>
            </div>
        </div>



        <!-- 廠商列表 -->
        <el-table :data="filteredVendors" border style="width: 100%;">
            <!-- ✅ 操作欄放最左邊 -->
            <el-table-column v-if="showActions" fixed="left" label="操作" min-width="140">
                <template #default="{ row }">
                    <el-button type="primary" size="small" @click="openDialog(row)">修改</el-button>
                    <el-button type="danger" size="small" @click="deleteVendor(row.id)">刪除</el-button>
                </template>
            </el-table-column>

            <el-table-column prop="vendorId" label="廠商編號" sortable min-width="100" />
            <el-table-column prop="vendorName" label="廠商名稱" min-width="150" />
            <el-table-column prop="contact" label="聯絡人" min-width="120" />
            <el-table-column prop="website" label="網站" min-width="150">
                <template #default="{ row }">
                    <a :href="row.website" target="_blank" v-if="row.website">{{ row.website }}</a>
                </template>
            </el-table-column>
            <el-table-column prop="note" label="備註" min-width="150" />
            <el-table-column prop="createdBy" label="創建人" min-width="100" />
            <el-table-column prop="updatedBy" label="更新人" min-width="100" />
            <el-table-column prop="createdAt" label="創建時間" min-width="150">
                <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新時間" min-width="150">
                <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
            </el-table-column>
        </el-table>

        <div v-if="!filteredVendors.length" style="margin-top: 10px;">尚無廠商資料</div>

        <!-- 新增/修改彈窗 -->
        <el-dialog :title="dialogMode === 'add' ? '新增廠商' : '修改廠商'" v-model="dialogVisible" width="450px"
            :before-close="() => (dialogVisible = false)">
            <el-form :model="form" ref="formRef" label-width="100px">
                <el-form-item label="廠商編號" required>
                    <el-input v-model="form.vendorId" placeholder="請輸入廠商編號" />
                </el-form-item>
                <el-form-item label="廠商名稱" required>
                    <el-input v-model="form.vendorName" placeholder="請輸入廠商名稱" />
                </el-form-item>
                <el-form-item label="聯絡人">
                    <el-input v-model="form.contact" placeholder="請輸入聯絡人" />
                </el-form-item>
                <el-form-item label="網站">
                    <el-input v-model="form.website" placeholder="請輸入網站網址" />
                </el-form-item>
                <el-form-item label="備註">
                    <el-input v-model="form.note" type="textarea" placeholder="備註說明..." />
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="saveVendor">確定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { db } from "@/firebase";
import { ref as dbRef, get, child, push, set, update, remove } from "firebase/database";
import { ElMessageBox, ElMessage } from "element-plus";
import { useAuth } from "@/composables/useAuth";
const { user } = useAuth();

interface Vendor {
    id?: string;
    vendorId: string;
    vendorName: string;
    contact?: string;
    website?: string;
    note?: string;
    createdBy: string;
    updatedBy: string;
    createdAt: number;
    updatedAt: number;
}

const vendors = ref<Vendor[]>([]);
const filteredVendors = ref<Vendor[]>([]);
const searchKeyword = ref("");
const dialogVisible = ref(false);
const dialogMode = ref<"add" | "edit">("add");
const formRef = ref();
const form = ref<Partial<Vendor>>({});
const currentUser = user.value?.displayName;
const showActions = ref(false); // ✅ 初始為非編輯模式

function formatDate(ts: number) {
    return new Date(ts).toLocaleString();
}

async function loadVendors() {
    const snapshot = await get(child(dbRef(db), "vendors"));
    if (snapshot.exists()) {
        const data = snapshot.val();

        vendors.value = Object.entries(data)
            .map(([id, val]: [string, any]) => ({
                id,
                ...val,
            }))
            // ✅ 排序：以 vendorId（轉成數字或字串）由小到大排列
            .sort((a, b) => {
                const idA = isNaN(Number(a.vendorId)) ? a.vendorId : Number(a.vendorId);
                const idB = isNaN(Number(b.vendorId)) ? b.vendorId : Number(b.vendorId);
                return idA > idB ? 1 : idA < idB ? -1 : 0;
            });

        filterVendors();
    } else {
        vendors.value = [];
        filteredVendors.value = [];
    }
}


function filterVendors() {
    filteredVendors.value = vendors.value.filter(v =>
        searchKeyword.value
            ? v.vendorName.toLowerCase().includes(searchKeyword.value.toLowerCase())
            : true
    );
}

function toggleEditMode() {
    showActions.value = !showActions.value;
}

function openDialog(vendor?: Vendor) {
    if (vendor) {
        dialogMode.value = "edit";
        form.value = { ...vendor };
    } else {
        dialogMode.value = "add";
        form.value = {
            vendorId: "",
            vendorName: "",
            contact: "",
            website: "",
            note: "",
        };
    }
    dialogVisible.value = true;
}

async function saveVendor() {
    if (!form.value.vendorId || !form.value.vendorName) {
        return alert("請填寫廠商編號與廠商名稱");
    }

    const timestamp = Date.now();

    if (dialogMode.value === "add") {
        const newRef = push(child(dbRef(db), "vendors"));
        await set(newRef, {
            vendorId: form.value.vendorId,
            vendorName: form.value.vendorName,
            contact: form.value.contact || "",
            website: form.value.website || "",
            note: form.value.note || "",
            createdBy: currentUser,
            updatedBy: currentUser,
            createdAt: timestamp,
            updatedAt: timestamp,
        });
    } else if (dialogMode.value === "edit" && form.value.id) {
        await update(child(dbRef(db), `vendors/${form.value.id}`), {
            vendorId: form.value.vendorId,
            vendorName: form.value.vendorName,
            contact: form.value.contact || "",
            website: form.value.website || "",
            note: form.value.note || "",
            updatedBy: currentUser,
            updatedAt: timestamp,
        });
    }

    dialogVisible.value = false;
    await loadVendors();
}

async function deleteVendor(id?: string) {
    if (!id) return;

    try {
        await ElMessageBox.confirm(
            "確定要刪除這筆廠商資料嗎？此操作無法復原。",
            "刪除確認",
            {
                confirmButtonText: "確定刪除",
                cancelButtonText: "取消",
                type: "warning",
                draggable: true,
                autofocus: false,
                lockScroll: true,
            }
        );

        await remove(child(dbRef(db), `vendors/${id}`));
        await loadVendors();

        ElMessage({
            type: "success",
            message: "廠商資料已刪除",
        });
    } catch {
        ElMessage({
            type: "info",
            message: "已取消刪除",
        });
    }
}

onMounted(loadVendors);
</script>

<style scoped>
.titleBar {
    margin: 0 0 10px 0;
}

.title-col {
    text-align: left;
    /* 水平置中 */
}

.title-col h2 {
    margin: 0;
    /* 去掉多餘 margin */
    font-weight: 600;
    /* 可選：字體粗細 */
}

.top-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.search-input {
    flex: 1;
    max-width: 400px;
}

.action-buttons {
    display: flex;
}

/* 手機模式 */
@media (max-width: 768px) {
    .top-bar {
        flex-direction: column;
        /* 搜尋框+按鈕換行 */
        align-items: stretch;
    }

    .top-bar .action-buttons {
        width: 100%;
        justify-content: flex-start;
        /* 按鈕靠左並排 */
    }

    .top-bar .el-input {
        width: 100% !important;
        /* 搜尋框佔滿整行 */
    }
}
</style>
