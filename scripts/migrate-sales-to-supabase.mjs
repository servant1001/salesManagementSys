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
    throw new Error("缺少 Supabase 設定，請確認 .env.local 已提供相關環境變數。");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function fetchFirebaseSales() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(`${firebaseDatabaseUrl}/sales.json`, {
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`讀取 Firebase sales 失敗 (${response.status})。`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

function normalizeSaleItem(item) {
    return {
        barcode: item?.barcode ?? "",
        gtin: item?.gtin ?? "",
        code: item?.code ?? "",
        name: item?.name ?? "",
        price: Number(item?.price ?? 0),
        sellingPrice: Number(item?.sellingPrice ?? 0),
        quantity: Number(item?.quantity ?? 0),
        cost: item?.cost == null ? null : Number(item.cost),
        supplierName: item?.supplierName ?? "",
        supplierCode: item?.supplierCode ?? "",
        imageUrl: item?.imageUrl ?? "",
        website: item?.website ?? "",
        estimatedProfit:
            item?.estimatedProfit == null ? null : Number(item.estimatedProfit),
    };
}

function toSaleRow([id, value]) {
    return {
        id,
        firebase_id: id,
        timestamp_ms: Number(value?.timestamp ?? Date.now()),
        total: Number(value?.total ?? 0),
        total_profit: value?.totalProfit == null ? null : Number(value.totalProfit),
        items: Array.isArray(value?.items) ? value.items.map(normalizeSaleItem) : [],
        operator: value?.operator ?? "",
        payment_method: value?.paymentMethod ?? "",
        updater: value?.updater ?? null,
    };
}

async function migrateSales() {
    const salesData = await fetchFirebaseSales();

    if (!salesData) {
        console.log("Firebase sales 目前沒有資料可搬移。");
        return;
    }

    const sales = Object.entries(salesData).map(toSaleRow);
    const { error } = await supabaseAdmin.from("sales").upsert(sales, { onConflict: "id" });

    if (error) {
        throw error;
    }

    console.log(`已成功搬移 ${sales.length} 筆 sales 到 Supabase。`);
}

migrateSales().catch((error) => {
    console.error("搬移 sales 到 Supabase 時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
