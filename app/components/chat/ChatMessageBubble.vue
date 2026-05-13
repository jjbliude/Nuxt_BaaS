<script setup lang="ts">
import { marked } from 'marked'
import type { ChatMessage } from '~/types/chat'

interface Props {
  message: ChatMessage
  isStreaming?: boolean
  streamingContent?: string
}

const props = withDefaults(defineProps<Props>(), {
  isStreaming: false,
  streamingContent: '',
})

// 配置 marked 安全选项
marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  const raw = props.isStreaming ? props.streamingContent : props.message.content
  if (!raw) return ''

  try {
    return marked.parse(raw) as string
  }
  catch {
    return raw
  }
})

const isUser = computed(() => props.message.role === 'user')
const roleLabel = computed(() => (isUser.value ? '你' : 'AI'))
</script>

<template>
  <div class="chat-message">
    <div class="chat-message-avatar" :class="message.role">
      {{ isUser ? 'U' : 'A' }}
    </div>
    <div class="chat-message-body">
      <div class="chat-message-role">{{ roleLabel }}</div>
      <div
        class="chat-message-content"
        :class="{ 'streaming-cursor': isStreaming }"
        v-html="renderedContent"
      />
    </div>
  </div>
</template>
