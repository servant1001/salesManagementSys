import { createClient } from "@supabase/supabase-js";
import { auth } from "@/firebase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error("Supabase 環境變數未設定完整，請檢查 .env.local");
}

async function getFirebaseAccessToken() {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return await currentUser.getIdToken(false);
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
    accessToken: getFirebaseAccessToken,
    auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
    },
});

export async function ensureSupabaseFirebaseRoleClaim() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("請先登入後再操作供應商資料");
    }

    let tokenResult = await currentUser.getIdTokenResult(false);
    if (tokenResult.claims.role === "authenticated") {
        return tokenResult.token;
    }

    tokenResult = await currentUser.getIdTokenResult(true);
    if (tokenResult.claims.role === "authenticated") {
        return tokenResult.token;
    }

    throw new Error(
        "Firebase 帳號尚未帶有 role=authenticated custom claim。請先用 `npm run set:firebase-claim -- --email 你的帳號` 設定 claim，然後重新登入。"
    );
}
