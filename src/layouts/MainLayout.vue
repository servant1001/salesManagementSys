<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { ElIcon, ElButton, ElSwitch } from 'element-plus'
import {
  Menu,
  Close,
  Moon,
  Sunny,
  House,
  ShoppingCart,
  CreditCard,
  Document,
  User,
  OfficeBuilding,
} from '@element-plus/icons-vue'
import { useThemeStore } from '@/stores/theme'
import { useAuth } from '@/composables/useAuth'

const themeStore = useThemeStore()
const { logout, user } = useAuth()
const router = useRouter()

const isCollapsed = ref(false)
const isMobileMenuVisible = ref(false)
const windowWidth = ref(window.innerWidth)

const menuItems = [
  { to: '/', label: '首頁總覽', icon: House },
  { to: '/products', label: '商品管理', icon: ShoppingCart },
  { to: '/checkout', label: '結帳作業', icon: CreditCard },
  { to: '/sales', label: '銷售紀錄', icon: Document },
  { to: '/vendors', label: '供應商管理', icon: OfficeBuilding },
]

const handleLogout = async () => {
  try {
    await logout()
    isMobileMenuVisible.value = false
    router.replace('/login')
  } catch (error) {
    console.error('登出失敗:', error)
  }
}

const updateWidth = () => {
  windowWidth.value = window.innerWidth
}

const setVh = () => {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

onMounted(() => {
  window.addEventListener('resize', updateWidth)
  setVh()
  window.addEventListener('resize', setVh)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth)
  window.removeEventListener('resize', setVh)
})
</script>

<template>
  <div class="layout">
    <button
      :class="['mobile-menu-btn', { active: isMobileMenuVisible }]"
      @click="isMobileMenuVisible = !isMobileMenuVisible"
    >
      <el-icon>
        <component :is="isMobileMenuVisible ? Close : Menu" />
      </el-icon>
    </button>

    <div v-if="isMobileMenuVisible" class="sidebar-overlay" @click="isMobileMenuVisible = false" />

	    <aside :class="['sidebar', { collapsed: isCollapsed, active: isMobileMenuVisible }]">
	      <div class="sidebar-content">
	        <div class="sidebar-top">
	          <div class="logo">
	            <div class="logo-frame">
	              <img alt="Aura logo" src="@/assets/logo.png" />
	            </div>
	            <div v-if="!isCollapsed" class="logo-text">
	              <span>AURA</span>
	              <h3>Sales Platform</h3>
	            </div>
	          </div>

	          <nav class="menu">
	            <RouterLink v-for="item in menuItems" :key="item.to" :to="item.to" :title="item.label"
	              @click="isMobileMenuVisible = false">
	              <el-icon>
	                <component :is="item.icon" />
	              </el-icon>
	              <span v-if="!isCollapsed" class="menu-label">{{ item.label }}</span>
	            </RouterLink>
	          </nav>
	        </div>

	        <div class="bottom-section">
          <div class="theme-panel">
            <div v-if="!isCollapsed" class="theme-labels">
              <strong>{{ themeStore.isDarkTheme ? '深色模式' : '淺色模式' }}</strong>
              <small>切換介面主題</small>
            </div>
            <el-switch v-model="themeStore.isDarkTheme" :active-action-icon="Moon" :inactive-action-icon="Sunny"
              class="theme-switch" />
          </div>

          <div class="user-info">
            <div class="avatar">
              <el-icon>
                <User />
              </el-icon>
            </div>
            <div v-if="!isCollapsed" class="user-copy">
              <strong>{{ user?.displayName || '未命名使用者' }}</strong>
              <span>{{ user?.email || 'Aura member' }}</span>
            </div>
          </div>

          <el-button class="logout-btn" @click="handleLogout">
            <span v-if="!isCollapsed">登出</span>
            <span v-else>↩</span>
          </el-button>
        </div>
      </div>

      <button v-if="windowWidth > 768" class="collapse-btn" @click="isCollapsed = !isCollapsed">
        <el-icon>
          <component :is="isCollapsed ? Menu : Close" />
        </el-icon>
      </button>
    </aside>

    <main class="main" @click="isMobileMenuVisible = false">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  height: 100dvh;
  background:
    radial-gradient(circle at top right, rgba(83, 134, 182, 0.1), transparent 26%),
    linear-gradient(180deg, var(--bg-color), var(--bg-color-soft));
  color: var(--text-color);
  overflow: hidden;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: rgba(6, 14, 27, 0.42);
  backdrop-filter: blur(4px);
}

.sidebar {
  position: relative;
  width: 232px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  padding: 18px 14px;
  background: linear-gradient(180deg, var(--sidebar-color), var(--sidebar-color-strong));
  border-right: 1px solid var(--sidebar-border);
  transition:
    width 0.28s ease,
    transform 0.28s ease;
  z-index: 999;
  overflow: visible;
}

.sidebar.collapsed {
  width: 92px;
}

.sidebar.active {
  transform: translateX(0) !important;
}

.sidebar-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 0;
  overflow: hidden;
}

.sidebar-top {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.sidebar.collapsed .sidebar-content {
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 24px;
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.sidebar.collapsed .logo {
  justify-content: center;
  padding: 10px 0;
}

.logo-frame {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.logo-frame img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}

.logo-text span {
  display: block;
  color: var(--accent-soft);
  font-size: 0.72rem;
  letter-spacing: 0.16em;
}

.logo-text h3 {
  color: #f5f7fb;
  font-size: 1rem;
  font-weight: 700;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
  scrollbar-width: thin;
}

.menu a {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  padding: 0.8rem 0.9rem;
  border: 1px solid transparent;
  border-radius: 16px;
  color: var(--sidebar-text);
  text-decoration: none;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
  white-space: nowrap;
}

.sidebar.collapsed .menu a {
  justify-content: center;
  padding: 0.8rem 0;
}

.menu a:hover {
  transform: translateX(2px);
  background: var(--link-hover);
  border-color: rgba(255, 255, 255, 0.06);
}

.menu a.router-link-exact-active {
  background: var(--link-active);
  color: #f8fbff;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 22px rgba(5, 14, 30, 0.24);
}

.menu a :deep(.el-icon) {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.menu-label {
  overflow: hidden;
  text-overflow: ellipsis;
}

.bottom-section {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 12px;
  width: 100%;
  margin-top: 18px;
}

.sidebar.collapsed .bottom-section {
  align-items: center;
}

.theme-panel,
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.045);
}

.theme-panel {
  justify-content: space-between;
}

.sidebar.collapsed .theme-panel,
.sidebar.collapsed .user-info {
  justify-content: center;
  width: 52px;
  min-height: 52px;
  padding: 0;
}

.theme-labels,
.user-copy {
  display: flex;
  flex-direction: column;
}

.theme-labels strong,
.user-copy strong {
  color: #f5f7fb;
  font-size: 0.9rem;
  font-weight: 600;
}

.theme-labels small,
.user-copy span {
  color: rgba(226, 233, 244, 0.62);
  font-size: 0.76rem;
}

.avatar {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #f5f7fb;
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(233, 117, 117, 0.22);
  border-radius: 16px;
  color: #ffd6d6;
  background: rgba(158, 52, 52, 0.2);
}

.sidebar.collapsed .logout-btn {
  width: 52px;
  padding: 0;
}

.logout-btn:hover {
  color: #fff2f2;
  background: rgba(182, 60, 60, 0.28);
}

.collapse-btn {
  position: absolute;
  right: -14px;
  top: 90px;
  z-index: 1002;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f8efe6;
  color: #163554;
  box-shadow: 0 12px 30px rgba(11, 29, 52, 0.2);
  cursor: pointer;
}

.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  color: #f8fbff;
  background: rgba(11, 29, 52, 0.84);
  backdrop-filter: blur(12px);
  transition:
    left 0.28s ease,
    background-color 0.2s ease,
    color 0.2s ease;
}

.main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100vh;
  height: 100dvh;
  padding: 22px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: grid;
    place-items: center;
  }

  .mobile-menu-btn.active {
    left: 246px;
    background: rgba(248, 239, 230, 0.96);
    color: #163554;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: calc(var(--vh, 1vh) * 100);
    transform: translateX(-100%);
    width: 232px;
  }

  .sidebar.collapsed {
    width: 232px;
  }

  .sidebar.collapsed .sidebar-content {
    align-items: stretch;
  }

  .sidebar.collapsed .logo {
    justify-content: flex-start;
    padding: 10px;
  }

  .sidebar.collapsed .menu a {
    justify-content: flex-start;
    padding: 0.8rem 0.9rem;
  }

  .sidebar.collapsed .theme-panel,
  .sidebar.collapsed .user-info {
    justify-content: space-between;
    width: 100%;
    min-height: auto;
    padding: 12px 14px;
  }

  .sidebar.collapsed .logout-btn {
    width: 100%;
  }

  .main {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    padding: 72px 14px 14px;
  }
}
</style>
