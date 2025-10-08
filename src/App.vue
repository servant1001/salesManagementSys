<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ElIcon } from 'element-plus'
import { Menu, Close, Moon, Sunny, House, ShoppingCart, CreditCard, Document } from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isCollapsed = ref(false)
const isMobileMenuVisible = ref(false)
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
        <img alt="Vue logo" src="@/assets/logo.png" width="60" />
        <h3 style="font-weight: 500;" v-if="!isCollapsed">AURA銷售系統®</h3>
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
      </nav>

      <!-- 主題切換 Switch -->
      <el-switch v-model="themeStore.isDarkTheme" active-color="#409EFF" inactive-color="#f56c6c"
        :active-action-icon="Moon" :inactive-action-icon="Sunny" class="theme-switch">
      </el-switch>

      <!-- 桌機收合按鈕 -->
      <button class="collapse-btn" @click="isCollapsed = !isCollapsed">
        <el-icon>
          <component :is="isCollapsed ? Menu : Close" />
        </el-icon>
      </button>
    </aside>

    <!-- 主內容區 -->
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
  color: var(--text-color);
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
  justify-content: center;
  gap: 10px;
  margin-bottom: 2rem;
}

/* Logo 預設大小 */
.logo img {
  width: 130px;
  border-radius: 8px;
  transition: width 0.3s ease;
}

/* 收合側邊欄時縮小 */
.sidebar.collapsed .logo img {
  width: 50px;
  /* 收合後小圖示 */
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
  color: var(--text-color);
}

.menu a:hover {
  background-color: var(--link-hover);
  color: var(--text-color);
}

/* 主題切換按鈕 */
.theme-switch {
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 讓文字與 icon 在收合側邊欄時隱藏 */
.sidebar.collapsed .theme-switch .el-switch__label {
  display: none;
}


/* 收合按鈕（桌機版） */
.collapse-btn {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  font-size: 1.2rem;
  margin-top: auto;
  align-self: center;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  transform: scale(1.1);
}

/* 手機漢堡按鈕 */
.mobile-menu-btn {
  display: none;
  background-color: var(--btn-bg);
  /* 暗亮主題切換背景 */
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
}

.mobile-menu-btn:hover {
  background-color: var(--btn-hover);
}

/* 主內容區 */
.main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* 手機版 */
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
