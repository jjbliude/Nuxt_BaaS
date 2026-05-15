import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '未认证' })
  }
  const userId = user.id || (user as any).sub || (user as any).user?.id || (user as any).value?.id;

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
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
