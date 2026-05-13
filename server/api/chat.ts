import { serverSupabaseClient } from '#supabase/server'

interface DeepSeekStreamChoice {
  delta: { content?: string }
  finish_reason: string | null
}

interface DeepSeekStreamChunk {
  choices: DeepSeekStreamChoice[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { prompt, conversationId } = body

  if (!prompt?.trim()) {
    throw createError({ statusCode: 400, message: '消息不能为空' })
  }
  if (!conversationId) {
    throw createError({ statusCode: 400, message: '缺少对话 ID' })
  }

  const db = await serverSupabaseClient(event)

  // 存储用户消息
  await db.from('messages').insert([
    { role: 'user', content: prompt, conversation_id: conversationId },
  ])

  // 加载该对话的历史消息作为上下文（最近 20 条）
  const { data: historyMessages } = await db
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  const contextMessages = [
    { role: 'system' as const, content: '你是一个专业的 AI 助手，擅长编程、技术分析和问题解答。请用 Markdown 格式回复。' },
    ...(historyMessages ?? []).map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  // 调用 DeepSeek 流式 API
  const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-v4-flash',
      messages: contextMessages,
      stream: true,
    }),
  })

  if (!apiResponse.ok || !apiResponse.body) {
    throw createError({ statusCode: 502, message: 'AI 服务不可用' })
  }

  // 设置 SSE 响应头
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })

  const reader = apiResponse.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let buffer = ''

  const writable = new WritableStream({
    write(chunk) {
      const responseStream = event.node.res
      responseStream.write(chunk)
    },
  })
  const writer = writable.getWriter()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      // 保留最后一个可能不完整的行
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const dataStr = trimmed.slice(6)
        if (dataStr === '[DONE]') {
          await writer.write(new TextEncoder().encode('data: [DONE]\n\n'))
          continue
        }

        try {
          const chunk = JSON.parse(dataStr) as DeepSeekStreamChunk
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            fullContent += delta
            await writer.write(
              new TextEncoder().encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
            )
          }
        }
        catch {
          // 跳过格式异常的 chunk，不静默吞没 —— 这是预期内的 SSE 解析容错
        }
      }
    }
  }
  finally {
    await writer.close()
  }

  // 将完整 AI 回复存入数据库
  if (fullContent.trim()) {
    await db.from('messages').insert([
      { role: 'assistant', content: fullContent, conversation_id: conversationId },
    ])

    // 如果是对话的首条回复，用内容摘要更新对话标题
    const { count } = await db
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    if (count && count <= 2) {
      const autoTitle = prompt.slice(0, 50).replace(/\n/g, ' ')
      await db
        .from('conversations')
        .update({ title: autoTitle })
        .eq('id', conversationId)
    }
  }
})
