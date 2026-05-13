import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseClient(event)
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({ statusCode: 400, message: '缺少对话 ID' })
  }

  const { error } = await db
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { status: 'ok' }
})
