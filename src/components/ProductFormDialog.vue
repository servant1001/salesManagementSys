<template>
    <el-dialog
        :model-value="visible"
        :title="title"
        :width="'90%'"
        :class="dialogClass"
        @update:model-value="handleVisibleChange"
    >
        <el-form ref="formRef" :model="product" :rules="rules" label-width="120px">
            <el-form-item label="GTIN" prop="gtin">
                <div class="gtin-row">
                    <el-input v-model="product.gtin" placeholder="請輸入 GTIN" :disabled="gtinDisabled" />
                    <div v-if="showGtinActions" class="gtin-actions">
                        <el-button type="primary" class="product-accent-btn product-inline-btn dialog-action-btn" @click="$emit('scan-gtin')">
                            掃描
                        </el-button>
                        <el-button type="success" class="product-primary-btn product-inline-btn dialog-action-btn" @click="$emit('sync-gtin-to-code')">
                            同步編號
                        </el-button>
                    </div>
                </div>
            </el-form-item>

            <el-form-item label="商品名稱" prop="name">
                <el-input v-model="product.name" />
            </el-form-item>

            <el-form-item label="商品編號" prop="code">
                <el-input v-model="product.code" placeholder="例如：A001 或條碼號" />
            </el-form-item>

            <el-form-item label="定價" prop="price">
                <el-input v-model.number="product.price" type="number" min="0" />
            </el-form-item>

            <el-form-item label="售價" prop="sellingPrice">
                <el-input v-model.number="product.sellingPrice" type="number" min="0" />
            </el-form-item>

            <el-form-item label="成本" prop="cost">
                <el-input v-model.number="product.cost" type="number" min="0" />
            </el-form-item>

            <el-form-item label="庫存" prop="stock">
                <el-input-number v-model.number="product.stock" :min="0" />
            </el-form-item>

            <el-form-item label="廠商名稱" prop="supplierName">
                <el-input v-model="product.supplierName" disabled />
            </el-form-item>

            <el-form-item label="廠商編號" prop="supplierCode">
                <el-select
                    v-model="product.supplierCode"
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

            <el-form-item label="商品圖片網址">
                <div class="image-input-group">
                    <el-input v-model="product.imageUrl" placeholder="請輸入圖片網址" style="width: 100%;" />
                    <img
                        v-if="product.imageUrl"
                        :src="product.imageUrl"
                        alt="預覽"
                        class="image-preview-thumb"
                    />
                </div>
            </el-form-item>

            <el-form-item label="網站">
                <el-input v-model="product.website" placeholder="請輸入網站連結" />
            </el-form-item>

            <el-form-item label="備註">
                <el-input v-model="product.note" type="textarea" rows="2" placeholder="請輸入備註" />
            </el-form-item>
        </el-form>

        <template #footer>
            <div class="product-dialog-footer">
                <el-button class="product-secondary-btn dialog-footer-btn" @click="handleVisibleChange(false)">取消</el-button>
                <el-button type="primary" class="product-primary-btn dialog-footer-btn dialog-footer-btn--primary" @click="$emit('submit')">{{ submitText }}</el-button>
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

interface ProductFormModel {
    gtin?: string;
    code?: string;
    name?: string;
    price?: number;
    sellingPrice?: number;
    cost?: number;
    stock?: number;
    supplierName?: string;
    supplierCode?: string;
    imageUrl?: string;
    website?: string;
    note?: string;
}

const props = defineProps<{
    visible: boolean;
    title: string;
    submitText: string;
    product: ProductFormModel;
    rules?: Record<string, unknown>;
    filteredVendors: VendorOption[];
    gtinDisabled?: boolean;
    showGtinActions?: boolean;
    dialogClass?: string;
}>();

const emit = defineEmits<{
    (e: "update:visible", value: boolean): void;
    (e: "submit"): void;
    (e: "scan-gtin"): void;
    (e: "sync-gtin-to-code"): void;
    (e: "vendor-filter", query: string): void;
    (e: "supplier-change"): void;
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
.gtin-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    width: 100%;
}

.gtin-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: stretch;
}

.image-input-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 250px;
}

.image-preview-thumb {
    width: 100%;
    height: 150px;
    object-fit: contain;
    border-radius: 6px;
    border: 1px solid #ccc;
}

.product-dialog-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    width: 100%;
}

.dialog-action-btn {
    min-width: 110px;
    min-height: 40px;
    border-radius: 13px;
    font-weight: 700;
    box-shadow: 0 12px 24px rgba(16, 36, 58, 0.14);
}

.gtin-actions .dialog-action-btn:first-child {
    border-color: rgba(228, 172, 92, 0.42);
    background:
        radial-gradient(circle at top right, rgba(255, 243, 214, 0.45), transparent 45%),
        linear-gradient(135deg, #bf6e2f 0%, #dd9645 52%, #f1c778 100%);
    color: #10243c;
}

.gtin-actions .dialog-action-btn:first-child:hover,
.gtin-actions .dialog-action-btn:first-child:focus-visible {
    border-color: rgba(241, 195, 120, 0.7);
    box-shadow: 0 16px 30px rgba(191, 110, 47, 0.24);
    filter: brightness(1.02) saturate(1.04);
}

.gtin-actions .dialog-action-btn:last-child {
    border-color: rgba(37, 75, 112, 0.34);
    background:
        radial-gradient(circle at top right, rgba(214, 231, 247, 0.24), transparent 42%),
        linear-gradient(180deg, #13314f 0%, #1c486f 100%);
    color: #f6fbff;
}

.gtin-actions .dialog-action-btn:last-child:hover,
.gtin-actions .dialog-action-btn:last-child:focus-visible {
    border-color: rgba(84, 140, 190, 0.52);
    box-shadow: 0 16px 30px rgba(19, 49, 79, 0.24);
}

.dialog-footer-btn {
    min-width: 112px;
    min-height: 46px;
    border-radius: 15px;
    font-weight: 700;
    letter-spacing: 0.01em;
}

.dialog-footer-btn--primary {
    min-width: 136px;
    border-color: rgba(37, 75, 112, 0.36);
    background:
        radial-gradient(circle at top right, rgba(237, 199, 132, 0.26), transparent 46%),
        linear-gradient(180deg, #13314f 0%, #1b4469 100%);
    color: #f9fcff;
    box-shadow: 0 18px 32px rgba(16, 36, 58, 0.2);
}

.dialog-footer-btn--primary:hover,
.dialog-footer-btn--primary:focus-visible {
    border-color: rgba(224, 180, 108, 0.56);
    background:
        radial-gradient(circle at top right, rgba(245, 212, 154, 0.3), transparent 44%),
        linear-gradient(180deg, #102a44 0%, #173a5b 100%);
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
    .gtin-actions {
        width: 100%;
    }

    .product-dialog-footer {
        justify-content: stretch;
    }

    .gtin-row .el-button,
    .gtin-actions .el-button,
    .product-dialog-footer .el-button {
        flex: 1;
    }
}
</style>
