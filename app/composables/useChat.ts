import type { Conversation, ChatMessage } from '~/types/chat'

export function useChat() {
  const conversations = ref<Conversation[]>([])
  const activeConversationId = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const streamingContent = ref('')

  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value) ?? null,
  )

  async function fetchConversations() {
    try {
      const data = await $fetch<Conversation[]>('/api/conversations')
      conversations.value = data
    }
    catch {
      // 数据库表可能尚未创建，降级为空列表
      conversations.value = []
    }
  }

  async function createConversation(): Promise<Conversation> {
    const data = await $fetch<Conversation>('/api/conversations', {
      method: 'POST',
      body: { title: '新对话' },
    })
    conversations.value.unshift(data)
    activeConversationId.value = data.id
    messages.value = []
    return data
  }

  async function deleteConversation(id: string) {
    await $fetch(`/api/conversations/${id}`, { method: 'DELETE' })
    conversations.value = conversations.value.filter(c => c.id !== id)

    if (activeConversationId.value === id) {
      activeConversationId.value = conversations.value[0]?.id ?? null
      if (activeConversationId.value) {
        await loadMessages(activeConversationId.value)
      }
      else {
        messages.value = []
      }
    }
  }

  async function renameConversation(id: string, title: string) {
    const data = await $fetch<Conversation>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: { title },
    })
    const target = conversations.value.find(c => c.id === id)
    if (target) {
      target.title = data.title
    }
  }

  async function switchConversation(id: string) {
    activeConversationId.value = id
    await loadMessages(id)
  }

  async function loadMessages(conversationId: string) {
    const data = await $fetch<ChatMessage[]>(`/api/conversations/${conversationId}`)
    messages.value = data
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isStreaming.value) return

    // 立即上锁，堵死竞态窗口（必须在任何 await 之前）
    isStreaming.value = true
    streamingContent.value = ''

    let targetId = activeConversationId.value

    try {
      // 如果没有活跃对话，先创建一个
      if (!targetId) {
        const conversation = await createConversation()
        targetId = conversation.id
      }

      // 即时追加用户消息到 UI（乐观更新）
      const userMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: targetId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }
      messages.value = [...messages.value, userMessage]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content, conversationId: targetId }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`AI 请求失败: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const dataStr = trimmed.slice(6)
          if (dataStr === '[DONE]') continue

          try {
            const chunk = JSON.parse(dataStr) as { content: string }
            if (chunk.content) {
              streamingContent.value += chunk.content
            }
          }
          catch {
            // SSE 解析容错
          }
        }
      }

      // 流式结束 —— 先清除流式状态，再追加最终消息
      const finalContent = streamingContent.value
      isStreaming.value = false
      streamingContent.value = ''

      if (finalContent.trim()) {
        const assistantMessage: ChatMessage = {
          id: `temp-ai-${Date.now()}`,
          conversation_id: targetId,
          role: 'assistant',
          content: finalContent,
          created_at: new Date().toISOString(),
        }
        messages.value = [...messages.value, assistantMessage]
      }

      // 刷新对话列表以获取自动生成的标题
      await fetchConversations()
    }
    catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'AI 响应异常'
      const errorAssistant: ChatMessage = {
        id: `temp-error-${Date.now()}`,
        conversation_id: targetId || '',
        role: 'assistant',
        content: `⚠️ ${errorMessage}`,
        created_at: new Date().toISOString(),
      }
      messages.value = [...messages.value, errorAssistant]
    }
    finally {
      isStreaming.value = false
      streamingContent.value = ''
    }
  }

  return {
    conversations,
    activeConversationId,
    activeConversation,
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    fetchConversations,
    createConversation,
    deleteConversation,
    renameConversation,
    switchConversation,
    sendMessage,
  }
}
