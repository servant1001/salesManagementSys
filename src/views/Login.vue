<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="brand-panel">
        <div class="brand-copy">
          <span class="eyebrow">AURA SALES PLATFORM</span>
          <img src="@/assets/logo.png" alt="Aura logo" class="logo" />
          <h1>讓門市、庫存與銷售流程回到同一個節奏。</h1>
          <p>
            集中管理商品、銷售與供應資訊，讓團隊從登入開始就進入清楚、穩定、好操作的工作流程。
          </p>
        </div>

        <div class="brand-highlights">
          <div class="highlight-card">
            <strong>即時掌握</strong>
            <span>快速查看銷售動態與商品流向</span>
          </div>
          <div class="highlight-card">
            <strong>跨裝置操作</strong>
            <span>桌機與行動裝置都維持一致體驗</span>
          </div>
          <div class="highlight-card">
            <strong>安全登入</strong>
            <span>支援 Email 與 Google 帳號登入</span>
          </div>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <div class="card-header">
            <span class="section-badge">Welcome back</span>
            <h2>登入你的工作台</h2>
            <p>輸入帳號資訊後即可進入系統，開始今天的銷售與管理作業。</p>
          </div>

          <div v-if="error" class="error-banner">
            {{ error }}
          </div>

          <div class="field-group">
            <label for="email">Email</label>
            <el-input
              id="email"
              v-model="email"
              placeholder="name@company.com"
              clearable
              size="large"
            />
          </div>

          <div class="field-group">
            <div class="field-label-row">
              <label for="password">密碼</label>
              <span class="hint-text">請輸入你的登入密碼</span>
            </div>
            <el-input
              id="password"
              v-model="password"
              type="password"
              placeholder="請輸入密碼"
              show-password
              clearable
              size="large"
              @keyup.enter="handleLogin"
            />
          </div>

          <el-button
            class="primary-btn"
            type="primary"
            size="large"
            @click="handleLogin"
            :loading="loading"
          >
            登入系統
          </el-button>

          <div class="divider">
            <span>或使用其他方式</span>
          </div>

          <el-button
            class="google-btn"
            size="large"
            @click="handleGoogleLogin"
            :loading="loading"
          >
            使用 Google 登入
          </el-button>

          <p class="register-text">
            還沒有帳號？
            <RouterLink to="/register" class="register-link">立即建立帳號</RouterLink>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    ElMessage.success('登入成功')
    router.push('/')
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      error.value = '找不到這個帳號，請確認 Email 是否輸入正確。'
    } else if (err.code === 'auth/wrong-password') {
      error.value = '密碼錯誤，請重新輸入。'
    } else if (err.code === 'auth/invalid-email') {
      error.value = 'Email 格式不正確。'
    } else {
      error.value = err.message || '登入失敗，請稍後再試。'
    }
  } finally {
    loading.value = false
  }
}

const handleGoogleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const account = result.user.displayName || result.user.email || '使用者'
    ElMessage.success(`已使用 Google 帳號登入：${account}`)
    router.push('/')
  } catch (err: any) {
    error.value = err.message || 'Google 登入失敗，請稍後再試。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(72, 127, 177, 0.28), transparent 30%),
    radial-gradient(circle at bottom right, rgba(220, 170, 108, 0.16), transparent 28%),
    linear-gradient(135deg, #0b1d34 0%, #123252 48%, #1f4d75 100%);
  overflow: hidden;
}

.login-page::before,
.login-page::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(10px);
}

.login-page::before {
  top: 8%;
  left: -120px;
  width: 360px;
  height: 360px;
  background: rgba(255, 255, 255, 0.08);
}

.login-page::after {
  right: -80px;
  bottom: 10%;
  width: 280px;
  height: 280px;
  background: rgba(242, 197, 138, 0.14);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  min-height: calc(100vh - 64px);
  min-height: calc(100dvh - 64px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 32px;
  overflow: hidden;
  background: rgba(7, 14, 28, 0.42);
  box-shadow: 0 28px 90px rgba(3, 8, 18, 0.38);
  backdrop-filter: blur(20px);
}

.brand-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 56px;
  color: #f4f7fb;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 34%),
    linear-gradient(180deg, rgba(20, 50, 89, 0.22), rgba(4, 12, 26, 0.18));
}

.brand-copy {
  max-width: 520px;
}

.eyebrow,
.section-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.eyebrow {
  color: #cdd8ea;
  background: rgba(255, 255, 255, 0.08);
}

.logo {
  width: 122px;
  margin: 28px 0 18px;
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.25));
}

.brand-copy h1 {
  font-size: clamp(2.4rem, 3vw, 3.6rem);
  line-height: 1.08;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.brand-copy p {
  margin-top: 20px;
  max-width: 470px;
  color: rgba(244, 247, 251, 0.78);
  font-size: 1rem;
  line-height: 1.9;
}

.brand-highlights {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.highlight-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
}

.highlight-card strong {
  font-size: 1rem;
  font-weight: 600;
}

.highlight-card span {
  color: rgba(244, 247, 251, 0.72);
  font-size: 0.92rem;
  line-height: 1.6;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background:
    linear-gradient(180deg, rgba(255, 248, 241, 0.96), rgba(249, 244, 236, 0.94));
}

.login-card {
  width: min(440px, 100%);
  padding: 38px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 48px rgba(64, 41, 18, 0.12);
}

.card-header h2 {
  margin-top: 16px;
  color: #142033;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.card-header p {
  margin-top: 12px;
  color: #5f6b7a;
  line-height: 1.7;
}

.section-badge {
  color: #8c5b2f;
  background: rgba(205, 154, 94, 0.16);
}

.error-banner {
  margin-top: 24px;
  padding: 14px 16px;
  border: 1px solid rgba(205, 73, 73, 0.22);
  border-radius: 16px;
  background: rgba(233, 84, 84, 0.08);
  color: #b63e3e;
  font-size: 0.94rem;
}

.field-group {
  margin-top: 22px;
}

.field-group label {
  display: inline-block;
  margin-bottom: 8px;
  color: #1f2f46;
  font-size: 0.95rem;
  font-weight: 600;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hint-text {
  color: #7b8897;
  font-size: 0.82rem;
}

:deep(.el-input__wrapper) {
  min-height: 48px;
  border-radius: 14px;
  box-shadow: 0 0 0 1px rgba(31, 47, 70, 0.08) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px #b97837 inset,
    0 0 0 4px rgba(185, 120, 55, 0.12);
}

.primary-btn,
.google-btn {
  width: 100%;
  height: 50px;
  margin-top: 24px;
  border-radius: 14px;
  font-size: 0.98rem;
  font-weight: 600;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #1f5b8f, #123a60);
  box-shadow: 0 12px 24px rgba(18, 58, 96, 0.24);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2a6aa3, #18476f);
}

.google-btn {
  margin-top: 0;
  color: #213248;
  border: 1px solid rgba(33, 50, 72, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.google-btn:hover {
  color: #123a60;
  border-color: rgba(18, 58, 96, 0.24);
  background: rgba(255, 255, 255, 0.96);
}

.divider {
  position: relative;
  margin: 20px 0;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  border-top: 1px solid rgba(31, 47, 70, 0.12);
}

.divider span {
  position: relative;
  padding: 0 12px;
  color: #7b8897;
  font-size: 0.84rem;
  background: rgba(255, 255, 255, 0.82);
}

.register-text {
  margin-top: 22px;
  color: #5f6b7a;
  text-align: center;
}

.register-link {
  color: #1f5b8f;
  font-weight: 600;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .login-page {
    padding: 20px;
  }

  .login-shell {
    min-height: auto;
    grid-template-columns: 1fr;
  }

  .brand-panel {
    gap: 32px;
    padding: 36px 28px 28px;
  }

  .brand-highlights {
    grid-template-columns: 1fr;
  }

  .login-panel {
    padding: 28px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 12px;
  }

  .brand-panel {
    padding: 28px 20px 22px;
  }

  .brand-copy h1 {
    font-size: 2rem;
  }

  .login-panel {
    padding: 16px;
  }

  .login-card {
    padding: 24px 20px;
    border-radius: 22px;
  }

  .field-label-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
