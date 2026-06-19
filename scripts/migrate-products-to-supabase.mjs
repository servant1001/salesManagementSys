import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const projectRoot = resolve(import.meta.dirname, "..");
const envFile = resolve(projectRoot, ".env.local");

function loadEnvFile(filepath) {
    if (!existsSync(filepath)) return;

    const raw = readFileSync(filepath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();

        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

loadEnvFile(envFile);

const firebaseProjectId = "sales-management-system-82d97";
const firebaseDatabaseUrl =
    process.env.FIREBASE_DATABASE_URL ||
    `https://${firebaseProjectId}-default-rtdb.firebaseio.com`;
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error("缺少 Supabase 環境變數，請檢查 .env.local");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function fetchFirebaseProducts() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(`${firebaseDatabaseUrl}/products.json`, {
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(
                `讀取 Firebase products 失敗 (${response.status})，請確認 FIREBASE_DATABASE_URL 是否正確。`
            );
        }

        return await response.json();
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error(
                "讀取 Firebase products 逾時，請在 .env.local 補上正確的 FIREBASE_DATABASE_URL 後再重試。"
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function toProductRow([id, value]) {
    const gtin = typeof value.gtin === "string" ? value.gtin.trim() : "";

    return {
        id,
        firebase_id: id,
        gtin: gtin || null,
        code: value.code ?? "",
        name: value.name ?? "",
        price: Number(value.price ?? 0),
        selling_price: Number(value.sellingPrice ?? 0),
        cost: Number(value.cost ?? 0),
        stock: Number(value.stock ?? 0),
        supplier_name: value.supplierName ?? "",
        supplier_code: value.supplierCode ?? "",
        image_url: value.imageUrl ?? "",
        website: value.website ?? "",
        note: value.note ?? "",
        created_ms: Number(value.created ?? Date.now()),
        updated_ms: value.updated == null ? null : Number(value.updated),
        created_by: value.createdBy ?? null,
        updated_by: value.updatedBy ?? null,
    };
}

function findDuplicateValues(rows, field) {
    const valueMap = new Map();

    for (const row of rows) {
        const rawValue = row[field];
        const normalizedValue = typeof rawValue === "string" ? rawValue.trim() : rawValue;

        if (!normalizedValue) continue;

        const key = String(normalizedValue);
        const item = valueMap.get(key) ?? [];
        item.push(row.id);
        valueMap.set(key, item);
    }

    return [...valueMap.entries()]
        .filter(([, ids]) => ids.length > 1)
        .map(([value, ids]) => ({ value, ids }));
}

async function migrateProducts() {
    const productsData = await fetchFirebaseProducts();

    if (!productsData) {
        console.log("Firebase products 節點目前沒有資料可搬移。");
        return;
    }

    const products = Object.entries(productsData).map(toProductRow);
    const duplicateGtins = findDuplicateValues(products, "gtin");
    const duplicateCodes = findDuplicateValues(products, "code");

    if (duplicateGtins.length || duplicateCodes.length) {
        if (duplicateGtins.length) {
            console.error("偵測到重複 GTIN，請先整理後再搬移：");
            duplicateGtins.slice(0, 20).forEach(({ value, ids }) => {
                console.error(`- GTIN: ${value}，商品 ID: ${ids.join(", ")}`);
            });
        }

        if (duplicateCodes.length) {
            console.error("偵測到重複商品編號，請先整理後再搬移：");
            duplicateCodes.slice(0, 20).forEach(({ value, ids }) => {
                console.error(`- 商品編號: ${value}，商品 ID: ${ids.join(", ")}`);
            });
        }

        throw new Error("Firebase products 存在重複的 GTIN 或商品編號，已停止搬移。");
    }

    const { error } = await supabaseAdmin.from("products").upsert(products, { onConflict: "id" });

    if (error) {
        throw error;
    }

    console.log(`已成功搬移 ${products.length} 筆 products 到 Supabase。`);
}

migrateProducts().catch((error) => {
    console.error("搬移 products 到 Supabase 時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
