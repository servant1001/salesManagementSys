import { ensureAdminAuth, parseArgs } from "./firebase-admin-common.mjs";

async function collectUsers(auth, maxResults) {
    const users = [];
    let pageToken;

    do {
        const page = await auth.listUsers(maxResults, pageToken);
        users.push(...page.users);
        pageToken = page.pageToken;
    } while (pageToken);

    return users;
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const auth = ensureAdminAuth();
    const maxResults = Number(args.limit || 1000);
    const role = args.role || "authenticated";
    const dryRun = args["dry-run"] === "true";
    const onlyMissing = args["only-missing"] !== "false";

    const users = await collectUsers(auth, maxResults);
    console.log(`已載入 ${users.length} 位 Firebase 使用者。`);

    const targets = users.filter((user) => {
        if (!onlyMissing) return true;
        return user.customClaims?.role !== role;
    });

    if (dryRun) {
        console.table(
            targets.map((user) => ({
                uid: user.uid,
                email: user.email || "",
                currentRole: user.customClaims?.role || "",
                nextRole: role,
            }))
        );
        console.log(`Dry run：預計更新 ${targets.length} 位使用者。`);
        return;
    }

    for (const user of targets) {
        const nextClaims = {
            ...(user.customClaims || {}),
            role,
        };

        await auth.setCustomUserClaims(user.uid, nextClaims);
    }

    console.log(`已完成 ${targets.length} 位使用者的 custom claim 更新。`);
    console.log("請讓這些使用者重新登入，或刷新 Firebase ID Token 後再重試。");
}

main().catch((error) => {
    console.error("批次設定 Firebase custom claim 時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
