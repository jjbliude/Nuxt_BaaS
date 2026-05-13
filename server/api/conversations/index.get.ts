import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const db = await serverSupabaseClient(event)

  const { data, error } = await db
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
