import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseClient(event)
  const conversationId = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!conversationId) {
    throw createError({ statusCode: 400, message: '缺少对话 ID' })
  }

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, message: '标题不能为空' })
  }

  const { data, error } = await db
    .from('conversations')
    .update({ title: body.title.trim() })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
