-- ============================================================
-- 对话系统数据库迁移脚本
-- 请在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- 1. 创建 conversations 表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '新对话',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. 为 messages 表添加 conversation_id 字段
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- 3. 创建索引加速查询
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- ============================================================
-- 用户系统扩展 (2026-05-15)
-- ============================================================

-- 4. 为表添加 user_id 字段，并设置默认值为当前登录用户
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid();

-- 如果字段已经存在，补充设置 DEFAULT
ALTER TABLE conversations ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE messages ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 5. 开启行级安全策略 (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. 创建 RLS 策略
-- 注意：这里使用 auth.uid() = user_id 来确保用户只能访问自己的数据
DROP POLICY IF EXISTS "Users can only see their own conversations" ON conversations;
CREATE POLICY "Users can only see their own conversations" 
ON conversations FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can only see their own messages" ON messages;
CREATE POLICY "Users can only see their own messages" 
ON messages FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. 创建用户数据索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- 8. 自动更新 conversations.updated_at 触发器 (已有)
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = now() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_conversation_timestamp ON messages;
CREATE TRIGGER trg_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
