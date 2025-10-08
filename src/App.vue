<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { ElIcon } from 'element-plus'
import { Menu, Close } from '@element-plus/icons-vue'

const isCollapsed = ref(false) // 桌機收合
const isMobileMenuVisible = ref(false) // 手機滑出
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
        <h2 v-if="!isCollapsed">AURA銷售系統®</h2>
      </div>

      <nav class="menu">
        <RouterLink to="/" title="首頁">🏠 <span v-if="!isCollapsed">首頁</span></RouterLink>
        <!-- <RouterLink to="/add" title="新增商品">➕ <span v-if="!isCollapsed">新增商品</span></RouterLink> -->
        <RouterLink to="/products" title="商品列表">📦 <span v-if="!isCollapsed">商品列表</span></RouterLink>
        <RouterLink to="/checkout" title="結帳">📦 <span v-if="!isCollapsed">結帳</span></RouterLink>
      </nav>

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
  background-color: #1e1e2f;
  /* 暗色背景 */
  color: #eee;
  /* 文字偏亮 */
}

/* 側邊欄 */
.sidebar {
  width: 220px;
  background-color: #2c2c3e;
  /* 暗色系側邊欄 */
  color: #eee;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  position: relative;
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

.logo img {
  width: 150px;
  border-radius: 8px;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex-grow: 1;
}

.menu a {
  color: #ccc;
  /* 偏亮文字 */
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
  background-color: #444566;
  /* 暗色選中背景 */
  color: #fff;
}

.menu a:hover {
  background-color: #3b3b55;
  /* 暗色 hover */
  color: #fff;
}

/* 收合按鈕（桌機版） */
.collapse-btn {
  background: none;
  border: none;
  color: #eee;
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
  color: #eee;
}

/* 主內容區 */
.main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  transition: filter 0.3s;
  background-color: #1e1e2f;
  /* 主內容區暗色 */
  color: #eee;
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
