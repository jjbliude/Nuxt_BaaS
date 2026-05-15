<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const isLoading = ref(false)
const isSuccess = ref(false)

async function handleRegister() {
  if (!email.value || !password.value) return
  
  if (password.value !== confirmPassword.value) {
    errorMsg.value = '两次输入的密码不一致'
    return
  }
  
  errorMsg.value = ''
  isLoading.value = true
  
  try {
    const { error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    
    if (error) throw error
    
    // 注册成功，显示验证邮件提示
    isSuccess.value = true
  } catch (err: any) {
    errorMsg.value = err.message || '注册失败，请稍后重试'
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
        <h1 class="auth-title">创建账号</h1>
        <p class="auth-subtitle">加入我们的智能对话社区</p>
      </div>

      <template v-if="!isSuccess">
        <div v-if="errorMsg" class="auth-error">
          {{ errorMsg }}
        </div>

        <form class="auth-form" @submit.prevent="handleRegister">
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
              placeholder="至少 6 位字符" 
              minlength="6"
              required 
            />
          </div>

          <div class="auth-field">
            <label class="auth-label">确认密码</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              class="auth-input" 
              placeholder="再次输入密码" 
              minlength="6"
              required 
            />
          </div>

          <button type="submit" class="auth-submit-btn" :disabled="isLoading">
            {{ isLoading ? '注册中...' : '注册' }}
          </button>
        </form>

        <div class="auth-footer">
          已有账号？ 
          <NuxtLink to="/login" class="auth-link">返回登录</NuxtLink>
        </div>
      </template>

      <!-- 注册成功后的提示 -->
      <template v-else>
        <div style="text-align: center; padding: 10px 0;">
          <div style="font-size: 48px; margin-bottom: 20px;">✉️</div>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: var(--chat-text-primary);">验证邮件已发送</h2>
          <p style="color: var(--chat-text-secondary); line-height: 1.6; margin-bottom: 32px; font-size: 15px;">
            我们已向 <strong>{{ email }}</strong> 发送了一封验证邮件。<br>
            请检查您的收件箱（或垃圾邮件箱），点击邮件中的链接完成验证。
          </p>
          <NuxtLink to="/login" class="auth-submit-btn" style="display: block; text-decoration: none;">
            去登录
          </NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

