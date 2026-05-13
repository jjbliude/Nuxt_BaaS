# 数据库设计 (Supabase)

本项目使用 Supabase 作为 Backend-as-a-Service (BaaS) 平台，主要处理对话(Conversations)和消息(Messages)的关联与存储。

## 核心表结构

### `conversations` 表
存储用户的会话记录。

| 字段名 | 类型 | 描述 | 默认值 |
|---|---|---|---|
| `id` | `UUID` | 主键 | `gen_random_uuid()` |
| `title` | `TEXT` | 会话标题（根据首条内容自动生成） | '新对话' |
| `created_at` | `TIMESTAMPTZ` | 创建时间 | `now()` |
| `updated_at` | `TIMESTAMPTZ` | 最后活跃时间 | `now()` |

### `messages` 表
存储每个会话下具体的对话上下文。

| 字段名 | 类型 | 描述 |
|---|---|---|
| `id` | `UUID` | 消息主键 |
| `conversation_id` | `UUID` | 外键，关联 `conversations.id` (ON DELETE CASCADE) |
| `role` | `TEXT` | 消息角色 (`user`, `assistant`, `system`) |
| `content` | `TEXT` | 消息内容全文 |
| `created_at`| `TIMESTAMPTZ`| 消息生成时间 |

## 触发器 (Triggers)

为了保持 `conversations` 表 `updated_at` 的实时性，数据库层面配置了触发器：当 `messages` 表新增数据时，自动更新对应会话的 `updated_at`。

## 迁移脚本 (Migration SQL)

如果你正在初始化一个新的 Supabase 项目，请在 Supabase Dashboard 的 SQL Editor 中执行以下脚本：

```sql
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

-- 4. 自动更新 conversations.updated_at 触发器
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
```
