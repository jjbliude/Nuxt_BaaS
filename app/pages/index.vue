<script setup>
const client = useSupabaseClient()
const newMessage = ref('')

// 1. 获取消息列表（保持之前的逻辑，但增加实时刷新）
const { data: messages, refresh } = await useAsyncData('messages', async () => {
  const { data } = await client.from('messages').select('*').order('created_at', { ascending: true })
  return data
})

// 2. 发送消息的函数
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  // A. 先把用户的消息存入数据库
  const { error } = await client.from('messages').insert([
    { role: 'user', content: newMessage.value }
  ])

  if (!error) {
    const userPrompt = newMessage.value
    newMessage.value = '' // 清空输入框
    await refresh() // 刷新页面列表

    // B. 调用我们即将创建的 AI 接口
    await callAI(userPrompt)
  }
}

// 3. 调用 AI 的函数（目前先占位，等第二步写完后端接口）
const callAI = async (prompt) => {
  const { data } = await $fetch('/api/chat', {
    method: 'POST',
    body: { prompt }
  })

  // AI 回复后再次刷新列表
  await refresh()
}
</script>

<template>
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>我的 AI Agent 🚀</h1>

    <div style="border: 1px solid #ddd; height: 400px; overflow-y: auto; padding: 10px; margin-bottom: 20px;">
      <div v-for="msg in messages" :key="msg.id"
        :style="{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: '10px' }">
        <div
          :style="{ display: 'inline-block', padding: '8px 12px', borderRadius: '10px', backgroundColor: msg.role === 'user' ? '#007bff' : '#f1f1f1', color: msg.role === 'user' ? 'white' : 'black' }">
          {{ msg.content }}
        </div>
      </div>
    </div>

    <div style="display: flex; gap: 10px;">
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="输入消息..." style="flex: 1; padding: 8px;" />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>