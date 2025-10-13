<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter, RouterLink, RouterView } from "vue-router";
import { ElIcon, ElButton, ElSwitch } from "element-plus";
import { Menu, Close, Moon, Sunny, House, ShoppingCart, CreditCard, Document, User } from "@element-plus/icons-vue";
import { useThemeStore } from "@/stores/theme";
import { useAuth } from "@/composables/useAuth";

const themeStore = useThemeStore();
const { logout, user } = useAuth();
const router = useRouter();

const isCollapsed = ref(false);
const isMobileMenuVisible = ref(false);

// 登出 + 自動跳轉 + 手機版側邊欄收起
const handleLogout = async () => {
    try {
        await logout();
        isMobileMenuVisible.value = false;
        router.replace("/login");
    } catch (error) {
        console.error("登出失敗:", error);
    }
};

onMounted(() => {
    console.log("當前用戶:", user.value);
});
</script>

<template>
    <div class="layout">
        <!-- 手機漢堡按鈕 -->
        <button class="mobile-menu-btn" @click="isMobileMenuVisible = !isMobileMenuVisible">
            <el-icon>
                <Menu />
            </el-icon>
        </button>

        <!-- 側邊欄 -->
        <aside :class="['sidebar', { collapsed: isCollapsed, active: isMobileMenuVisible }]">
            <div class="logo">
                <img alt="Vue logo" src="@/assets/logo.png" />
                <h3 v-if="!isCollapsed" style="font-weight: 500">AURA銷售系統®</h3>
            </div>

            <nav class="menu">
                <RouterLink to="/" title="首頁">
                    <el-icon>
                        <House />
                    </el-icon>
                    <span v-if="!isCollapsed">首頁</span>
                </RouterLink>
                <RouterLink to="/products" title="商品列表">
                    <el-icon>
                        <ShoppingCart />
                    </el-icon>
                    <span v-if="!isCollapsed">商品列表</span>
                </RouterLink>
                <RouterLink to="/checkout" title="結帳">
                    <el-icon>
                        <CreditCard />
                    </el-icon>
                    <span v-if="!isCollapsed">結帳</span>
                </RouterLink>
                <RouterLink to="/sales" title="銷售紀錄">
                    <el-icon>
                        <Document />
                    </el-icon>
                    <span v-if="!isCollapsed">銷售紀錄</span>
                </RouterLink>
                <RouterLink to="/users" title="用戶管理">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span v-if="!isCollapsed">用戶管理</span>
                </RouterLink>
            </nav>

            <el-switch v-model="themeStore.isDarkTheme" active-color="#409EFF" inactive-color="#f56c6c"
                :active-action-icon="Moon" :inactive-action-icon="Sunny" class="theme-switch" />

            <!-- 側邊欄底部：用戶頭貼 + 名稱 + 登出 -->
            <div class="sidebar-footer">
                <div class="user-info">
                    <el-icon class="avatar">
                        <User />
                    </el-icon>
                    <span v-if="!isCollapsed">{{ user?.displayName }}</span>
                </div>
                <el-button class="logout-btn" type="danger" @click="handleLogout">登出</el-button>
            </div>

            <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
                <el-icon>
                    <component :is="isCollapsed ? Menu : Close" />
                </el-icon>
            </button>
        </aside>

        <!-- 主內容 -->
        <main class="main" @click="isMobileMenuVisible = false">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.layout {
    display: flex;
    min-height: 100vh;
    background-color: var(--bg-color);
    color: var(--text-color);
}

/* 側邊欄 */
.sidebar {
    width: 220px;
    background-color: var(--sidebar-color);
    display: flex;
    flex-direction: column;
    padding: 1rem;
    transition: width 0.3s ease, transform 0.3s ease;
    z-index: 999;
}

.sidebar.collapsed {
    width: 80px;
}

.sidebar.active {
    transform: translateX(0) !important;
}

.logo {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 2rem;
}

.logo img {
    width: 130px;
    border-radius: 8px;
    transition: width 0.3s;
}

.sidebar.collapsed .logo img {
    width: 50px;
}

.menu {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex-grow: 1;
}

.menu a {
    color: var(--text-color);
    text-decoration: none;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: background-color 0.2s, color 0.2s;
    white-space: nowrap;
}

.menu a.router-link-exact-active {
    background-color: var(--link-active);
}

.menu a:hover {
    background-color: var(--link-hover);
}

.theme-switch {
    margin-bottom: 1rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.sidebar.collapsed .theme-switch .el-switch__label {
    display: none;
}

/* 側邊欄底部：用戶頭貼 + 名稱 + 登出 */
.sidebar-footer {
    margin-top: auto;
    /* 推到底部 */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.user-info .avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    background-color: #f0f0f0;
    color: var(--bg-color);
}

.sidebar.collapsed .user-info span {
    display: none;
}

.logout-btn {
    width: 100%;
}

/* 收合按鈕 */
.collapse-btn {
    background: none;
    border: none;
    color: var(--text-color);
    cursor: pointer;
    margin-top: 0.5rem;
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}

.collapse-btn:hover {
    transform: scale(1.1);
}

/* 手機漢堡按鈕 */
.mobile-menu-btn {
    display: none;
    background-color: var(--btn-bg);
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
}

.mobile-menu-btn:hover {
    background-color: var(--btn-hover);
}

.main {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    background-color: var(--bg-color);
}

@media (max-width: 768px) {
    .layout {
        flex-direction: column;
    }

    .mobile-menu-btn {
        display: flex;
        position: fixed;
        top: 1rem;
        left: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        z-index: 1000;
        color: var(--text-color);
    }

    .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        transform: translateX(-100%);
        flex-direction: column;
        width: 220px;
        padding: 1rem;
    }

    .main {
        padding: 1rem;
        width: 100%;
    }
}
</style>
