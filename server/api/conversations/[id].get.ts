import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseClient(event)
  const conversationId = getRouterParam(event, 'id')

  if (!conversationId) {
    throw createError({ statusCode: 400, message: '缺少对话 ID' })
  }

  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
