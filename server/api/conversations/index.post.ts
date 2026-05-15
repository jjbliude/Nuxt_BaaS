import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: '未认证' })
  }

  // 兼容不同版本的 @nuxtjs/supabase 返回结构
  const userId = user.id || (user as any).sub || (user as any).user?.id || (user as any).value?.id;
  
  if (!userId) {
    throw createError({ statusCode: 500, message: `无法提取用户ID，解析到的 user 结构为: ${JSON.stringify(user)}` })
  }

  console.log('--- API 调试信息 ---')
  console.log('当前解析到的真实用户 ID:', userId)

  const db = await serverSupabaseClient(event)
  const body = await readBody(event)

  const insertData = { 
    title: body?.title || '新对话'
    // 不再手动传入 user_id，将由数据库 DEFAULT auth.uid() 自动填充
  }
  console.log('准备插入的数据:', insertData)

  const { data, error } = await db
    .from('conversations')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('Supabase 插入错误:', error)
    throw createError({ statusCode: 500, message: error.message, data: error })
  }

  return data
})
