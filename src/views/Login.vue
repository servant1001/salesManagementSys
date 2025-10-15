<template>
    <div class="login-page">
        <div class="login-container">
            <!-- Logo -->
            <div class="logo-container">
                <img src="@/assets/logo.png" alt="Logo" class="logo" />
            </div>

            <h2 class="login-title">登入帳號</h2>

            <el-input v-model="email" placeholder="Email" clearable />
            <el-input v-model="password" type="password" placeholder="密碼" clearable />

            <el-button class="full-width-btn" type="primary" @click="handleLogin" :loading="loading">
                登入
            </el-button>
            <el-button class="full-width-btn" style="margin: 0;" type="danger" @click="handleGoogleLogin"
                :loading="loading">
                使用 Google 登入
            </el-button>

            <p class="link">
                還沒有帳號？
                <RouterLink to="/register" class="register-link">點此註冊</RouterLink>
            </p>

            <p v-if="error" class="error">{{ error }}</p>
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
        ElMessage.success('登入成功！')
        router.push('/')
    } catch (err: any) {
        if (err.code === 'auth/user-not-found') {
            error.value = '此帳號不存在，請先註冊。'
        } else if (err.code === 'auth/wrong-password') {
            error.value = '密碼錯誤'
        } else {
            error.value = err.message
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
        const user = result.user
        const account = user.displayName
        ElMessage.success(`Google 登入成功，帳號: ${account}`)
        router.push('/')
    } catch (err: any) {
        error.value = err.message
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
/* ✅ 外層背景容器 */
.login-page {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: url('@/assets/aura_bg.png') no-repeat center center;
    background-size: cover;
    background-attachment: scroll;
}

/* ✅ 登入框本體 */
.login-container {
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
}

.logo {
    width: 150px;
    height: 150px;
    object-fit: contain;
}

.login-title {
    color: #fff;
    text-align: center;
    margin: 0;
}

.full-width-btn {
    width: 100%;
}

.error {
    color: red;
    font-size: 0.9rem;
}

.link {
    text-align: center;
    font-size: 0.9rem;
    color: #fff;
}

.register-link {
    color: #409EFF;
    text-decoration: underline;
    cursor: pointer;
}

/* ✅ 手機版仍能置中 */
@media (max-width: 768px) {
    .login-page {
        min-height: 100dvh;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }

    .login-container {
        width: 100%;
        max-width: 380px;
    }
}
</style>
