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
}

.batch-sync-btn {
    min-width: 124px;
}

.batch-row-btn {
    min-width: 86px;
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
}

.dialog-footer-btn--primary {
    min-width: 136px;
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
