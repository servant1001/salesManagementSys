<template>
    <div class="register-page">
        <div class="register-container">
            <!-- Logo -->
            <div class="logo-container">
                <img src="@/assets/logo.png" alt="Logo" class="logo" />
            </div>

            <h2 class="register-title">註冊帳號</h2>

            <!-- Email 必填 -->
            <el-input v-model="email" placeholder="Email (必填)" clearable @blur="touched.email = true" />
            <small v-if="touched.email && !isEmailValid(email)" class="error">Email 格式不正確</small>

            <!-- 帳號必填 -->
            <el-input v-model="account" placeholder="帳號 (必填)" clearable @blur="touched.account = true" />
            <small v-if="touched.account && !account.trim()" class="error">帳號為必填</small>

            <!-- 密碼必填 -->
            <el-input v-model="password" type="password" placeholder="密碼 (必填，至少 6 個字)" clearable
                @blur="touched.password = true" />
            <small v-if="touched.password && password.length < 6" class="error">密碼至少 6 個字元</small>

            <!-- 確認密碼 -->
            <el-input v-model="confirmPassword" type="password" placeholder="確認密碼" clearable
                @blur="touched.confirmPassword = true" />
            <small v-if="touched.confirmPassword && confirmPassword !== password" class="error">密碼與確認密碼不一致</small>

            <el-button type="primary" @click="handleRegister" :loading="loading">
                註冊
            </el-button>

            <p class="link">
                已有帳號？
                <RouterLink to="/login" class="login-link">點此登入</RouterLink>
            </p>

            <p v-if="error" class="error">{{ error }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail, updateProfile } from 'firebase/auth'
import { auth } from '@/firebase'

const router = useRouter()
const account = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

// 追蹤欄位是否被觸碰過
const touched = reactive({
    account: false,
    email: false,
    password: false,
    confirmPassword: false
})

const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

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
        const methods = await fetchSignInMethodsForEmail(auth, email.value)
        if (methods.length > 0) {
            error.value = '此 Email 已被使用，請使用其他 Email 或直接登入'
            loading.value = false
            return
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
        await updateProfile(userCredential.user, { displayName: account.value })
        await sendEmailVerification(userCredential.user)
        ElMessage.success('註冊成功！請至信箱點擊驗證連結')

        router.push('/login')
    } catch (err: any) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* ✅ 外層背景容器 */
.register-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: url('@/assets/aura_bg.png') no-repeat center center;
    background-size: cover;
    background-attachment: scroll;
}

.register-container {
    width: 400px;
    max-width: 90%;
    padding: 2rem;
    background-color: rgba(0, 0, 0, 0.6);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    box-sizing: border-box;
    text-align: center;
}

.logo-container {
    display: flex;
    justify-content: center;
    /* margin-bottom: 1rem; */
}

.logo {
    width: 150px;
    height: 150px;
    object-fit: contain;
}

.register-title {
    color: #fff;
    text-align: center;
    margin: 0;
}

.error {
    color: red;
    font-size: 0.85rem;
}

.link {
    text-align: center;
    font-size: 0.9rem;
    color: #fff;
}

.login-link {
    color: #409EFF;
    text-decoration: underline;
    cursor: pointer;
}
</style>
