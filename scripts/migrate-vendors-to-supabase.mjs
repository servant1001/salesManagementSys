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

async function fetchFirebaseVendors() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
        const response = await fetch(`${firebaseDatabaseUrl}/vendors.json`, {
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(
                `讀取 Firebase vendors 失敗 (${response.status})，請確認 FIREBASE_DATABASE_URL 是否正確。`
            );
        }

        return await response.json();
    } catch (error) {
        if (error?.name === "AbortError") {
            throw new Error(
                "讀取 Firebase vendors 逾時，請在 .env.local 補上正確的 FIREBASE_DATABASE_URL 後再重試。"
            );
        }

        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

function toVendorRow([id, value]) {
    return {
        id,
        firebase_id: id,
        vendor_id: value.vendorId ?? "",
        vendor_name: value.vendorName ?? "",
        contact: value.contact ?? "",
        website: value.website ?? "",
        note: value.note ?? "",
        created_by: value.createdBy ?? "firebase-migration",
        updated_by: value.updatedBy ?? value.createdBy ?? "firebase-migration",
        created_at: new Date(value.createdAt ?? Date.now()).toISOString(),
        updated_at: new Date(value.updatedAt ?? value.createdAt ?? Date.now()).toISOString(),
    };
}

async function migrateVendors() {
    const vendorsData = await fetchFirebaseVendors();

    if (!vendorsData) {
        console.log("Firebase vendors 節點目前沒有資料可搬移。");
        return;
    }

    const vendors = Object.entries(vendorsData).map(toVendorRow);
    const { error } = await supabaseAdmin.from("vendors").upsert(vendors, { onConflict: "id" });

    if (error) {
        throw error;
    }

    console.log(`已成功搬移 ${vendors.length} 筆 vendors 到 Supabase。`);
}

migrateVendors().catch((error) => {
    console.error("搬移 vendors 到 Supabase 時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
