import { ensureAdminAuth, parseArgs } from "./firebase-admin-common.mjs";

async function resolveUserIdentifier(auth, args) {
    if (args.uid) {
        return auth.getUser(args.uid);
    }

    if (args.email) {
        return auth.getUserByEmail(args.email);
    }

    throw new Error("請提供 --uid 或 --email，例如：npm run set:firebase-claim -- --email you@example.com");
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const role = args.role || "authenticated";

    const auth = ensureAdminAuth();
    const userRecord = await resolveUserIdentifier(auth, args);
    const existingClaims = userRecord.customClaims || {};
    const nextClaims = {
        ...existingClaims,
        role,
    };

    await auth.setCustomUserClaims(userRecord.uid, nextClaims);
    console.log(`已為 ${userRecord.email || userRecord.uid} 設定 custom claims：`);
    console.log(JSON.stringify(nextClaims, null, 2));
    console.log("請讓該使用者重新登入，或刷新 Firebase ID Token 後再重試。");
}

main().catch((error) => {
    console.error("設定 Firebase custom claim 時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
