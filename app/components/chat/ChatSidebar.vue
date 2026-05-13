<script setup lang="ts">
import type { Conversation } from '~/types/chat'

interface Props {
  conversations: Conversation[]
  activeId: string | null
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  newChat: []
  select: [id: string]
  delete: [id: string]
  rename: [id: string, title: string]
  close: []
}>()

const renamingId = ref<string | null>(null)
const renameValue = ref('')

function startRename(conversation: Conversation) {
  renamingId.value = conversation.id
  renameValue.value = conversation.title
  nextTick(() => {
    const input = document.querySelector('.chat-rename-input') as HTMLInputElement
    input?.focus()
    input?.select()
  })
}

function confirmRename() {
  if (renamingId.value && renameValue.value.trim()) {
    emit('rename', renamingId.value, renameValue.value.trim())
  }
  renamingId.value = null
}

function cancelRename() {
  renamingId.value = null
}

function handleRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') confirmRename()
  if (e.key === 'Escape') cancelRename()
}

/** 按时间分组对话 */
function groupConversations(list: Conversation[]) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const weekStart = new Date(todayStart.getTime() - 7 * 86400000)

  const groups: { label: string; items: Conversation[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '过去 7 天', items: [] },
    { label: '更早', items: [] },
  ]

  for (const c of list) {
    const date = new Date(c.updated_at)
    if (date >= todayStart) groups[0].items.push(c)
    else if (date >= yesterdayStart) groups[1].items.push(c)
    else if (date >= weekStart) groups[2].items.push(c)
    else groups[3].items.push(c)
  }

  return groups.filter(g => g.items.length > 0)
}

const groups = computed(() => groupConversations(props.conversations))
</script>

<template>
  <aside class="chat-sidebar" :class="{ open: isOpen }">
    <div class="chat-sidebar-header">
      <button class="chat-new-btn" @click="emit('newChat')">
        <span>+</span>
        <span>新建对话</span>
      </button>
    </div>

    <div class="chat-sidebar-list">
      <template v-for="group in groups" :key="group.label">
        <div class="chat-sidebar-group-label">{{ group.label }}</div>
        <div
          v-for="conversation in group.items"
          :key="conversation.id"
          class="chat-sidebar-item"
          :class="{ active: conversation.id === activeId }"
          @click="emit('select', conversation.id)"
        >
          <!-- 重命名模式 -->
          <input
            v-if="renamingId === conversation.id"
            v-model="renameValue"
            class="chat-rename-input"
            @blur="confirmRename"
            @keydown="handleRenameKeydown"
            @click.stop
          />
          <span v-else class="chat-sidebar-item-title">
            {{ conversation.title }}
          </span>

          <div v-if="renamingId !== conversation.id" class="chat-sidebar-item-actions">
            <button
              class="chat-sidebar-action-btn"
              title="重命名"
              @click.stop="startRename(conversation)"
            >
              ✏️
            </button>
            <button
              class="chat-sidebar-action-btn danger"
              title="删除"
              @click.stop="emit('delete', conversation.id)"
            >
              🗑️
            </button>
          </div>
        </div>
      </template>

      <div v-if="conversations.length === 0" style="padding: 24px 12px; text-align: center; color: var(--chat-text-muted); font-size: 13px;">
        暂无对话记录
      </div>
    </div>
  </aside>
</template>
