import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

export const useThemeStore = defineStore('theme', () => {
    const isDarkTheme = ref(localStorage.getItem('theme') === 'dark')

    // 套用主題到 <body>
    const applyTheme = (isDark: boolean, showMessage = false) => {
        if (isDark) {
            document.body.classList.add('dark-theme')
            document.body.classList.remove('light-theme')
            localStorage.setItem('theme', 'dark')
            if (showMessage) ElMessage({ message: '已切換暗色主題', type: 'info', duration: 800 })
        } else {
            document.body.classList.add('light-theme')
            document.body.classList.remove('dark-theme')
            localStorage.setItem('theme', 'light')
            if (showMessage) ElMessage({ message: '已切換亮色主題', type: 'info', duration: 800 })
        }
    }

    // 初始化時立即套用
    applyTheme(isDarkTheme.value, false)

    // 監聽變化
    watch(isDarkTheme, (val) => applyTheme(val, true))

    return { isDarkTheme, applyTheme }
})
