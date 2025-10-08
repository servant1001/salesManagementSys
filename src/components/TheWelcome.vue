<script setup lang="ts">
import logo from '@/assets/AURA_logo.png' // 替換成你的 logo 路徑
</script>

<template>
  <div class="container">
    <img :src="logo" alt="Logo" class="logo" />
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  /* 水平置中 */
  align-items: center;
  /* 垂直置中 */
  height: 100vh;
  /* 滿高度 */
  background-color: var(--bg-color, #1e1e2f);
  /* 可跟主題變數一起用 */
}

.logo {
  max-width: 400px;
  height: auto;
  object-fit: contain;
}

@media (max-width: 468px) {
  .logo {
    max-width: 200px;
  }
}
</style>
