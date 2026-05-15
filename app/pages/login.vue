<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  
  errorMsg.value = ''
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    
    if (error) throw error
    
    // 登录成功后路由中间件会自动处理重定向，或者我们可以手动跳到主页
    navigateTo('/')
  } catch (err: any) {
    errorMsg.value = err.message || '登录失败，请检查账号密码'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <div class="chat-welcome-logo" style="margin: 0 auto 16px;">A</div>
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-subtitle">请登录您的账号以继续对话</p>
      </div>

      <div v-if="errorMsg" class="auth-error">
        {{ errorMsg }}
      </div>

      <form class="auth-form" @submit.prevent="handleLogin">
        <div class="auth-field">
          <label class="auth-label">邮箱地址</label>
          <input 
            v-model="email" 
            type="email" 
            class="auth-input" 
            placeholder="your@example.com" 
            required 
          />
        </div>

        <div class="auth-field">
          <label class="auth-label">密码</label>
          <input 
            v-model="password" 
            type="password" 
            class="auth-input" 
            placeholder="••••••••" 
            required 
          />
        </div>

        <button type="submit" class="auth-submit-btn" :disabled="isLoading">
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
      </form>

      <div class="auth-footer">
        还没有账号？ 
        <NuxtLink to="/register" class="auth-link">立即注册</NuxtLink>
      </div>
    </div>
  </div>
</template>
