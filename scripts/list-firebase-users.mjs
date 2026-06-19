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
    const users = await collectUsers(auth, maxResults);

    const printable = users.map((user) => ({
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        disabled: user.disabled,
        role: user.customClaims?.role || "",
    }));

    console.table(printable);
    console.log(`共 ${printable.length} 位 Firebase 使用者。`);
}

main().catch((error) => {
    console.error("列出 Firebase 使用者時發生錯誤：");
    console.error(error);
    process.exitCode = 1;
});
