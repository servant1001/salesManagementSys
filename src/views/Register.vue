<template>
  <div class="register-page">
    <div class="register-shell">
      <section class="brand-panel">
        <div class="brand-copy">
          <span class="eyebrow">AURA SALES PLATFORM</span>
          <img src="@/assets/logo.png" alt="Aura logo" class="logo" />
          <h1>建立團隊帳號，開始整合你的銷售營運流程。</h1>
          <p>
            註冊後即可建立個人工作入口，串接門市銷售、商品管理與供應資料，讓日常作業更有秩序。
          </p>
        </div>

        <div class="brand-highlights">
          <div class="highlight-card">
            <strong>快速開通</strong>
            <span>幾個欄位即可完成帳號建立與基本設定</span>
          </div>
          <div class="highlight-card">
            <strong>Email 驗證</strong>
            <span>完成信箱驗證後再正式啟用登入權限</span>
          </div>
          <div class="highlight-card">
            <strong>一致體驗</strong>
            <span>與登入頁共享同一套品牌與操作節奏</span>
          </div>
        </div>
      </section>

      <section class="form-panel">
        <div class="register-card">
          <div class="card-header">
            <span class="section-badge">Create account</span>
            <h2>建立你的工作帳號</h2>
            <p>填寫基本資訊後，我們會寄送驗證信到你的信箱，完成後就能登入系統。</p>
          </div>

          <div v-if="error" class="error-banner">
            {{ error }}
          </div>

          <div class="field-group">
            <label for="account">顯示名稱</label>
            <el-input
              id="account"
              v-model="account"
              placeholder="請輸入顯示名稱"
              clearable
              size="large"
              @blur="touched.account = true"
            />
            <small v-if="touched.account && !account.trim()" class="field-error">
              顯示名稱為必填欄位。
            </small>
          </div>

          <div class="field-group">
            <label for="email">Email</label>
            <el-input
              id="email"
              v-model="email"
              placeholder="name@company.com"
              clearable
              size="large"
              @blur="touched.email = true"
            />
            <small v-if="touched.email && !isEmailValid(email)" class="field-error">
              請輸入正確的 Email 格式。
            </small>
          </div>

          <div class="field-group">
            <div class="field-label-row">
              <label for="password">密碼</label>
              <span class="hint-text">至少 6 個字元</span>
            </div>
            <el-input
              id="password"
              v-model="password"
              type="password"
              placeholder="請輸入密碼"
              show-password
              clearable
              size="large"
              @blur="touched.password = true"
            />
            <small v-if="touched.password && password.length < 6" class="field-error">
              密碼長度至少需要 6 個字元。
            </small>
          </div>

          <div class="field-group">
            <label for="confirm-password">確認密碼</label>
            <el-input
              id="confirm-password"
              v-model="confirmPassword"
              type="password"
              placeholder="請再次輸入密碼"
              show-password
              clearable
              size="large"
              @blur="touched.confirmPassword = true"
              @keyup.enter="handleRegister"
            />
            <small
              v-if="touched.confirmPassword && confirmPassword !== password"
              class="field-error"
            >
              兩次輸入的密碼不一致。
            </small>
          </div>

          <el-button
            class="primary-btn"
            type="primary"
            size="large"
            @click="handleRegister"
            :loading="loading"
          >
            建立帳號
          </el-button>

          <p class="login-text">
            已經有帳號？
            <RouterLink to="/login" class="login-link">返回登入頁</RouterLink>
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  fetchSignInMethodsForEmail,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const account = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const touched = reactive({
  account: false,
  email: false,
  password: false,
  confirmPassword: false,
})

const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const handleRegister = async () => {
  error.value = ''
  touched.account = true
  touched.email = true
  touched.password = true
  touched.confirmPassword = true

  if (!account.value.trim()) {
    return
  }

  if (!email.value.trim() || !isEmailValid(email.value)) {
    return
  }

  if (!password.value || password.value.length < 6) {
    return
  }

  if (password.value !== confirmPassword.value) {
    return
  }

  loading.value = true

  try {
    const methods = await fetchSignInMethodsForEmail(auth, email.value.trim())
    if (methods.length > 0) {
      error.value = '這個 Email 已經註冊過，請直接登入或改用其他信箱。'
      loading.value = false
      return
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value,
    )

    await updateProfile(userCredential.user, { displayName: account.value.trim() })
    await sendEmailVerification(userCredential.user)

    ElMessage.success('註冊成功，驗證信已寄出，請先完成信箱驗證。')
    router.push('/login')
  } catch (err: any) {
    error.value = err.message || '註冊失敗，請稍後再試。'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  min-height: 100dvh;
  padding: 32px;
  background:
    linear-gradient(135deg, rgba(10, 25, 47, 0.92), rgba(10, 25, 47, 0.72)),
    url('@/assets/aura_bg.png') center center / cover no-repeat;
}

.register-shell {
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

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background:
    linear-gradient(180deg, rgba(255, 248, 241, 0.96), rgba(249, 244, 236, 0.94));
}

.register-card {
  width: min(460px, 100%);
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
  margin-top: 20px;
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

.field-error {
  display: block;
  margin-top: 8px;
  color: #b63e3e;
  font-size: 0.84rem;
  line-height: 1.45;
}

.primary-btn {
  width: 100%;
  height: 50px;
  margin-top: 26px;
  border: none;
  border-radius: 14px;
  font-size: 0.98rem;
  font-weight: 600;
  background: linear-gradient(135deg, #1f5b8f, #123a60);
  box-shadow: 0 12px 24px rgba(18, 58, 96, 0.24);
}

.primary-btn:hover {
  background: linear-gradient(135deg, #2a6aa3, #18476f);
}

.login-text {
  margin-top: 22px;
  color: #5f6b7a;
  text-align: center;
}

.login-link {
  color: #1f5b8f;
  font-weight: 600;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .register-page {
    padding: 20px;
  }

  .register-shell {
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

  .form-panel {
    padding: 28px;
  }
}

@media (max-width: 640px) {
  .register-page {
    padding: 12px;
  }

  .brand-panel {
    padding: 28px 20px 22px;
  }

  .brand-copy h1 {
    font-size: 2rem;
  }

  .form-panel {
    padding: 16px;
  }

  .register-card {
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
