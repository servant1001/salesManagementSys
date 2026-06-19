import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectRoot = resolve(import.meta.dirname, "..");

function parseJsonFile(filepath) {
    const raw = readFileSync(filepath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw);
}

function loadLocalEnvFile() {
    const envPath = resolve(projectRoot, ".env.local");
    if (!existsSync(envPath)) return;

    const raw = readFileSync(envPath, "utf8");
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

function findDefaultServiceAccountPath() {
    const candidates = [
        "firebase-service-account.json",
        "firebase-service-account-key.json",
        "service-account.json",
        "serviceAccountKey.json",
    ];

    for (const candidate of candidates) {
        const fullPath = resolve(projectRoot, candidate);
        if (existsSync(fullPath)) {
            return fullPath;
        }
    }

    return null;
}

function loadServiceAccount() {
    loadLocalEnvFile();

    const explicitPath =
        process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (explicitPath) {
        const resolvedPath = resolve(explicitPath);
        if (!existsSync(resolvedPath)) {
            throw new Error(`找不到 Firebase service account 檔案：${resolvedPath}`);
        }

        return parseJsonFile(resolvedPath);
    }

    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inlineJson) {
        return JSON.parse(inlineJson);
    }

    const defaultPath = findDefaultServiceAccountPath();
    if (defaultPath) {
        return parseJsonFile(defaultPath);
    }

    throw new Error(
        "缺少 Firebase Admin 憑證。請設定 FIREBASE_SERVICE_ACCOUNT_PATH、GOOGLE_APPLICATION_CREDENTIALS，或把 service account JSON 放在專案根目錄。"
    );
}

export function ensureAdminAuth() {
    if (getApps().length === 0) {
        const serviceAccount = loadServiceAccount();
        initializeApp({
            credential: cert(serviceAccount),
        });
    }

    return getAuth();
}

export function parseArgs(argv) {
    const result = {};

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        if (!current.startsWith("--")) continue;

        const key = current.slice(2);
        const next = argv[index + 1];
        if (!next || next.startsWith("--")) {
            result[key] = "true";
            continue;
        }

        result[key] = next;
        index += 1;
    }

    return result;
}
