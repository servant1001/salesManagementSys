<template>
    <el-dialog
        :model-value="visible"
        title="批量新增商品"
        :width="'90%'"
        class="batch-add-dialog"
        @update:model-value="handleVisibleChange"
    >
        <el-form ref="formRef" :model="batchBase" :rules="rules" label-width="120px" style="margin-bottom: 20px;">
            <el-form-item label="定價" prop="price">
                <div class="stock-field">
                    <el-input v-model.number="batchBase.price" type="number" min="0" />
                    <el-button type="primary" size="small" class="product-secondary-btn product-sync-btn batch-sync-btn" @click="$emit('sync-field', 'price')">
                        定價同步
                    </el-button>
                </div>
            </el-form-item>

            <el-form-item label="售價" prop="sellingPrice">
                <div class="stock-field">
                    <el-input v-model.number="batchBase.sellingPrice" type="number" min="0" />
                    <el-button type="primary" size="small" class="product-secondary-btn product-sync-btn batch-sync-btn" @click="$emit('sync-field', 'sellingPrice')">
                        售價同步
                    </el-button>
                </div>
            </el-form-item>

            <el-form-item label="成本" prop="cost">
                <div class="stock-field">
                    <el-input v-model.number="batchBase.cost" type="number" min="0" />
                    <el-button type="primary" size="small" class="product-secondary-btn product-sync-btn batch-sync-btn" @click="$emit('sync-field', 'cost')">
                        成本同步
                    </el-button>
                </div>
            </el-form-item>

            <el-form-item label="庫存" prop="stock" class="stock-item">
                <div class="stock-field">
                    <el-input-number v-model.number="batchBase.stock" style="width: 120px;" :min="0" />
                    <el-button style="width: 120px;" type="primary" size="small" class="product-secondary-btn product-sync-btn batch-sync-btn" @click="$emit('sync-field', 'stock')">
                        庫存同步
                    </el-button>
                </div>
            </el-form-item>

            <el-form-item label="廠商名稱">
                <el-input v-model="batchBase.supplierName" disabled />
            </el-form-item>

            <el-form-item label="廠商編號" prop="supplierCode">
                <el-select
                    v-model="batchBase.supplierCode"
                    placeholder="請輸入或選擇廠商"
                    filterable
                    clearable
                    :filter-method="handleVendorFilter"
                    @change="$emit('supplier-change')"
                    style="max-width: 250px;"
                >
                    <el-option
                        v-for="vendor in filteredVendors"
                        :key="vendor.vendorId"
                        :label="`${vendor.vendorId} - ${vendor.vendorName}`"
                        :value="vendor.vendorId"
                    />
                </el-select>
            </el-form-item>

            <el-form-item label="網站">
                <el-input v-model="batchBase.website" placeholder="請輸入網站連結" />
            </el-form-item>

            <el-form-item label="備註">
                <el-input v-model="batchBase.note" type="textarea" rows="2" />
            </el-form-item>
        </el-form>

                <div class="batch-dialog-header">
            <h4 class="batch-dialog-title">商品批量新增</h4>
            <div class="batch-dialog-toolbar">
                <el-button type="danger" class="product-danger-btn batch-toolbar-btn" @click="$emit('clear-rows')">全部清空</el-button>
                <el-button type="primary" class="product-primary-btn batch-toolbar-btn" @click="$emit('add-row')">新增一列</el-button>
            </div>
        </div>

        <el-table :data="batchList" border style="width: 100%">
            <el-table-column type="index" label="#" width="50" />

            <el-table-column prop="gtin" label="GTIN" width="350">
                <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <el-input v-model="row.gtin" placeholder="請輸入 GTIN" @input="$emit('gtin-change', row)" style="flex: 1;" />
                        <el-button type="primary" size="small" class="product-accent-btn product-inline-btn batch-row-btn" @click="$emit('scan-row', row)">
                            掃描
                        </el-button>
                        <el-checkbox v-model="row.useGtinAsCode" @change="$emit('toggle-use-gtin-as-code', row)">
                            同步編號
                        </el-checkbox>
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="name" label="商品名稱" width="200">
                <template #default="{ row }">
                    <el-input v-model="row.name" placeholder="商品名稱" />
                </template>
            </el-table-column>

            <el-table-column prop="code" label="商品編號" width="180">
                <template #default="{ row }">
                    <el-input v-model="row.code" placeholder="商品編號" :disabled="row.useGtinAsCode" />
                </template>
            </el-table-column>

            <el-table-column prop="price" label="定價" width="130">
                <template #default="{ row }">
                    <el-input-number v-model.number="row.price" style="width: 110px" :min="0" />
                </template>
            </el-table-column>

            <el-table-column prop="sellingPrice" label="售價" width="130">
                <template #default="{ row }">
                    <el-input-number v-model.number="row.sellingPrice" style="width: 110px" :min="0" />
                </template>
            </el-table-column>

            <el-table-column prop="cost" label="成本" width="130">
                <template #default="{ row }">
                    <el-input-number v-model.number="row.cost" style="width: 110px" :min="0" />
                </template>
            </el-table-column>

            <el-table-column prop="stock" label="庫存" width="130">
                <template #default="{ row }">
                    <el-input-number v-model.number="row.stock" style="width: 100px" :min="0" />
                </template>
            </el-table-column>

            <el-table-column prop="imageUrl" label="商品圖片" width="220">
                <template #default="{ row }">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <el-input v-model="row.imageUrl" placeholder="請輸入圖片網址" style="flex: 1;" />
                        <img
                            v-if="row.imageUrl"
                            :src="row.imageUrl"
                            alt="預覽"
                            style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #ccc;"
                        />
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="操作">
                <template #default="{ $index }">
                    <el-button type="danger" size="small" class="product-danger-btn product-inline-btn batch-row-btn" @click="$emit('remove-row', $index)">
                        刪除
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <template #footer>
            <div class="product-dialog-footer">
                <el-button class="product-secondary-btn dialog-footer-btn" @click="handleVisibleChange(false)">取消</el-button>
                <el-button type="primary" class="product-primary-btn dialog-footer-btn dialog-footer-btn--primary" @click="$emit('submit')">提交</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance } from "element-plus";

interface VendorOption {
    vendorId: string;
    vendorName: string;
}

interface BatchBaseModel {
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    supplierName: string;
    supplierCode: string;
    website: string;
    note: string;
}

interface BatchProductRow {
    gtin: string;
    code: string;
    name: string;
    price: number;
    sellingPrice: number;
    cost: number;
    stock: number;
    imageUrl: string;
    useGtinAsCode: boolean;
}

const props = defineProps<{
    visible: boolean;
    batchBase: BatchBaseModel;
    batchList: BatchProductRow[];
    filteredVendors: VendorOption[];
    rules?: Record<string, unknown>;
}>();

const emit = defineEmits<{
    (e: "update:visible", value: boolean): void;
    (e: "submit"): void;
    (e: "sync-field", field: "price" | "sellingPrice" | "cost" | "stock"): void;
    (e: "vendor-filter", query: string): void;
    (e: "supplier-change"): void;
    (e: "clear-rows"): void;
    (e: "add-row"): void;
    (e: "remove-row", index: number): void;
    (e: "scan-row", row: BatchProductRow): void;
    (e: "gtin-change", row: BatchProductRow): void;
    (e: "toggle-use-gtin-as-code", row: BatchProductRow): void;
}>();

const formRef = ref<FormInstance>();

function handleVisibleChange(value: boolean) {
    emit("update:visible", value);
}

function handleVendorFilter(query: string) {
    emit("vendor-filter", query);
}

async function validate() {
    if (!formRef.value) return true;

    try {
        await formRef.value.validate();
        return true;
    } catch {
        return false;
    }
}

defineExpose({
    validate,
});
</script>

<style scoped>
.batch-dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
    flex-wrap: wrap;
}

.batch-dialog-title {
    margin: 0;
    color: #10243c;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.02em;
}

.batch-dialog-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
}

.batch-toolbar-btn {
    min-width: 112px;
    min-height: 44px;
    border-radius: 14px;
    font-weight: 700;
    letter-spacing: 0.01em;
}

.batch-dialog-toolbar .product-danger-btn.batch-toolbar-btn {
    border-color: rgba(211, 100, 91, 0.32);
    background:
        radial-gradient(circle at top right, rgba(255, 225, 218, 0.24), transparent 48%),
        linear-gradient(180deg, #b94a46 0%, #a53f3c 100%);
    color: #fff8f7;
    box-shadow: 0 16px 30px rgba(185, 74, 70, 0.2);
}

.batch-dialog-toolbar .product-danger-btn.batch-toolbar-btn:hover,
.batch-dialog-toolbar .product-danger-btn.batch-toolbar-btn:focus-visible {
    border-color: rgba(224, 128, 118, 0.46);
    box-shadow: 0 20px 34px rgba(185, 74, 70, 0.24);
}

.batch-dialog-toolbar .product-primary-btn.batch-toolbar-btn {
    border-color: rgba(38, 76, 115, 0.36);
    background:
        radial-gradient(circle at top right, rgba(243, 208, 147, 0.24), transparent 46%),
        linear-gradient(180deg, #143250 0%, #1d4a72 100%);
    color: #f8fbff;
    box-shadow: 0 18px 32px rgba(16, 36, 58, 0.2);
}

.batch-dialog-toolbar .product-primary-btn.batch-toolbar-btn:hover,
.batch-dialog-toolbar .product-primary-btn.batch-toolbar-btn:focus-visible {
    border-color: rgba(231, 188, 116, 0.54);
    box-shadow: 0 22px 36px rgba(16, 36, 58, 0.24);
}

.batch-sync-btn {
    min-width: 124px;
    min-height: 38px;
    border-radius: 12px;
    border-color: rgba(94, 129, 166, 0.28);
    background:
        linear-gradient(180deg, rgba(250, 252, 255, 0.98), rgba(236, 243, 250, 0.95));
    color: #21415f;
    font-weight: 700;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.85),
        0 10px 20px rgba(16, 36, 58, 0.08);
}

.batch-sync-btn:hover,
.batch-sync-btn:focus-visible {
    border-color: rgba(94, 129, 166, 0.44);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(232, 241, 249, 1));
    color: #17324f;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.92),
        0 14px 24px rgba(16, 36, 58, 0.12);
}

.batch-row-btn {
    min-width: 86px;
    border-radius: 12px;
    font-weight: 700;
}

.product-accent-btn.batch-row-btn {
    border-color: rgba(228, 172, 92, 0.4);
    background:
        radial-gradient(circle at top right, rgba(255, 242, 208, 0.42), transparent 46%),
        linear-gradient(135deg, #c47435 0%, #dd9648 56%, #efc979 100%);
    color: #10243c;
    box-shadow: 0 12px 22px rgba(196, 116, 53, 0.18);
}

.product-accent-btn.batch-row-btn:hover,
.product-accent-btn.batch-row-btn:focus-visible {
    border-color: rgba(240, 194, 120, 0.66);
    box-shadow: 0 16px 28px rgba(196, 116, 53, 0.24);
}

.product-danger-btn.batch-row-btn {
    border-color: rgba(211, 100, 91, 0.26);
    background: linear-gradient(180deg, #bc5550 0%, #a54440 100%);
    color: #fff8f7;
    box-shadow: 0 12px 22px rgba(188, 85, 80, 0.16);
}

.product-danger-btn.batch-row-btn:hover,
.product-danger-btn.batch-row-btn:focus-visible {
    border-color: rgba(224, 128, 118, 0.42);
    box-shadow: 0 16px 28px rgba(188, 85, 80, 0.22);
}

.product-dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.dialog-footer-btn {
    min-width: 112px;
    min-height: 46px;
    border-radius: 15px;
    font-weight: 700;
}

.dialog-footer-btn--primary {
    min-width: 136px;
    border-color: rgba(38, 76, 115, 0.38);
    background:
        radial-gradient(circle at top right, rgba(241, 202, 138, 0.24), transparent 44%),
        linear-gradient(180deg, #143250 0%, #1d4a72 100%);
    color: #f8fbff;
    box-shadow: 0 18px 32px rgba(16, 36, 58, 0.2);
}

.dialog-footer-btn--primary:hover,
.dialog-footer-btn--primary:focus-visible {
    border-color: rgba(231, 188, 116, 0.54);
    box-shadow: 0 22px 36px rgba(16, 36, 58, 0.24);
}

.product-dialog-footer .product-secondary-btn.dialog-footer-btn {
    border-color: rgba(20, 36, 58, 0.12);
    background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(243, 247, 251, 0.96));
    color: #18324d;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.86),
        0 12px 22px rgba(16, 36, 58, 0.08);
}

.product-dialog-footer .product-secondary-btn.dialog-footer-btn:hover,
.product-dialog-footer .product-secondary-btn.dialog-footer-btn:focus-visible {
    border-color: rgba(77, 131, 180, 0.3);
    color: #10243c;
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.92),
        0 16px 28px rgba(16, 36, 58, 0.12);
}

@media (max-width: 640px) {
    .batch-dialog-toolbar,
    .product-dialog-footer {
        width: 100%;
    }

    .batch-dialog-toolbar :deep(.el-button),
    .product-dialog-footer :deep(.el-button) {
        flex: 1;
    }
}
</style>
