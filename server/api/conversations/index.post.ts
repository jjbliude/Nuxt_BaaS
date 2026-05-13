import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseClient(event)
  const body = await readBody(event)

  const { data, error } = await db
    .from('conversations')
    .insert([{ title: body?.title || '新对话' }])
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
