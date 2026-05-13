<script setup lang="ts">
interface Props {
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  send: [content: string]
}>()

const inputValue = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function handleSend() {
  const content = inputValue.value.trim()
  if (!content) return
  emit('send', content)
  inputValue.value = ''
  nextTick(() => autoResize())
}
</script>

<template>
  <div class="chat-input-area">
    <div class="chat-input-wrapper">
      <div class="chat-input-box">
        <textarea
          ref="textareaRef"
          v-model="inputValue"
          class="chat-textarea"
          placeholder="发送消息..."
          rows="1"
          :disabled="disabled"
          @input="autoResize"
          @keydown="handleKeydown"
        />
        <button
          class="chat-send-btn"
          :disabled="disabled || !inputValue.trim()"
          @click="handleSend"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
