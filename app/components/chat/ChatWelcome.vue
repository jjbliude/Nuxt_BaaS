<script setup lang="ts">
const emit = defineEmits<{
  selectPrompt: [content: string]
}>()

const quickPrompts = [
  { title: '写一段代码', desc: '用任意语言实现一个功能' },
  { title: '解释概念', desc: '深入浅出地解释技术概念' },
  { title: '调试代码', desc: '帮我找出代码中的 bug' },
  { title: '优化方案', desc: '分析并优化现有代码或架构' },
]
</script>

<template>
  <div class="chat-welcome">
    <div class="chat-welcome-logo">🤖</div>
    <h1 class="chat-welcome-title">我能帮你什么？</h1>
    <p class="chat-welcome-subtitle">
      我是你的 AI 编程助手，擅长代码编写、技术分析和问题解答。
    </p>
    <div class="chat-welcome-prompts">
      <div
        v-for="prompt in quickPrompts"
        :key="prompt.title"
        class="chat-welcome-prompt"
        @click="emit('selectPrompt', prompt.title)"
      >
        <div class="chat-welcome-prompt-title">{{ prompt.title }}</div>
        <div class="chat-welcome-prompt-desc">{{ prompt.desc }}</div>
      </div>
    </div>
  </div>
</template>
