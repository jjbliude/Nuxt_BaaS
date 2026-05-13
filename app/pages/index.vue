<script setup lang="ts">
import type { ChatMessage } from '~/types/chat'

const {
  conversations,
  activeConversationId,
  messages,
  isStreaming,
  streamingContent,
  fetchConversations,
  createConversation,
  deleteConversation,
  renameConversation,
  switchConversation,
  sendMessage,
} = useChat()

const sidebarOpen = ref(false)
const messagesContainerRef = ref<HTMLElement | null>(null)
const initialized = ref(false)

// 客户端初始化，避免 SSR 水合不匹配
onMounted(async () => {
  await fetchConversations()
  if (conversations.value.length > 0 && !activeConversationId.value) {
    await switchConversation(conversations.value[0].id)
  }
  initialized.value = true
})

function scrollToBottom() {
  nextTick(() => {
    const container = messagesContainerRef.value
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  })
}

watch(messages, scrollToBottom, { deep: true })
watch(streamingContent, scrollToBottom)

async function handleNewChat() {
  await createConversation()
  sidebarOpen.value = false
}

async function handleSelectConversation(id: string) {
  await switchConversation(id)
  sidebarOpen.value = false
}

async function handleDelete(id: string) {
  await deleteConversation(id)
}

async function handleRename(id: string, title: string) {
  await renameConversation(id, title)
}

function handleSelectPrompt(prompt: string) {
  sendMessage(prompt)
}

function handleSend(content: string) {
  sendMessage(content)
}

const hasMessages = computed(() => messages.value.length > 0)

/** 构造流式占位消息对象 */
const streamingPlaceholder = computed<ChatMessage | null>(() => {
  if (!isStreaming.value || !streamingContent.value) return null
  return {
    id: 'streaming',
    conversation_id: activeConversationId.value || '',
    role: 'assistant',
    content: streamingContent.value,
    created_at: new Date().toISOString(),
  }
})
</script>

<template>
  <div class="chat-layout">
    <!-- 移动端遮罩 -->
    <div
      class="chat-sidebar-overlay"
      :class="{ visible: sidebarOpen }"
      @click="sidebarOpen = false"
    />

    <!-- 移动端汉堡按钮 -->
    <button class="chat-mobile-toggle" @click="sidebarOpen = !sidebarOpen">
      ☰
    </button>

    <!-- 侧边栏 -->
    <ChatSidebar
      :conversations="conversations"
      :active-id="activeConversationId"
      :is-open="sidebarOpen"
      @new-chat="handleNewChat"
      @select="handleSelectConversation"
      @delete="handleDelete"
      @rename="handleRename"
      @close="sidebarOpen = false"
    />

    <!-- 主聊天区 -->
    <main class="chat-main">
      <!-- 消息列表 / 欢迎页 -->
      <template v-if="hasMessages">
        <div ref="messagesContainerRef" class="chat-messages-container">
          <div class="chat-messages-inner">
            <ChatMessageBubble
              v-for="msg in messages"
              :key="msg.id"
              :message="msg"
            />

            <!-- 流式输出中的占位消息 -->
            <ChatMessageBubble
              v-if="streamingPlaceholder"
              :message="streamingPlaceholder"
              :is-streaming="true"
              :streaming-content="streamingContent"
            />

            <!-- AI 思考中的加载动画 -->
            <div v-if="isStreaming && !streamingContent" class="chat-message">
              <div class="chat-message-avatar assistant">A</div>
              <div class="chat-message-body">
                <div class="chat-message-role">AI</div>
                <div class="chat-loading-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <ChatWelcome v-else @select-prompt="handleSelectPrompt" />

      <!-- 输入区：不禁用 textarea，允许在 AI 回复时预输入 -->
      <ChatInput @send="handleSend" />
    </main>
  </div>
</template>