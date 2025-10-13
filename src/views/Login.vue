<template>
    <div class="login-container">
        <h2>登入帳號</h2>

        <el-input v-model="email" placeholder="Email" clearable />
        <el-input v-model="password" type="password" placeholder="密碼" clearable />

        <el-button type="primary" @click="handleLogin" :loading="loading">登入</el-button>
        <el-button type="danger" @click="handleGoogleLogin" :loading="loading">使用 Google 登入</el-button>

        <p class="link">
            還沒有帳號？
            <RouterLink to="/register" class="register-link">點此註冊</RouterLink>
        </p>

        <p v-if="error" class="error">{{ error }}</p>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth'
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
        // 直接登入，捕捉錯誤碼
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

        // 使用 Google 名稱當帳號
        const account = user.displayName
        console.log('Google 帳號:', account)

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
.login-container {
    max-width: 400px;
    margin: 5rem auto;
    padding: 2rem;
    background-color: var(--sidebar-color);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.error {
    color: red;
    font-size: 0.9rem;
}

.link {
    text-align: center;
    font-size: 0.9rem;
}

.register-link {
    color: #409EFF;
    text-decoration: underline;
    cursor: pointer;
}
</style>
