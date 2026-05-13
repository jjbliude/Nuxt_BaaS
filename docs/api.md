# 后端 API 文档

所有的后端接口均由 Nuxt 3 (Nitro) 在 `/server/api` 目录下提供。所有接口与 Supabase 服务端客户端建立连接进行持久化。

## 对话接口 (Conversations)

### `GET /api/conversations`
获取当前用户的所有历史对话列表。

### `POST /api/conversations`
创建一个新的空白对话。
- **Body**: `{ "title"?: "可选初始标题" }`
- **Response**: 返回刚创建的 `conversation` 实体。

### `GET /api/conversations/:id`
获取指定对话详情，包含最近的上下文。

### `PATCH /api/conversations/:id`
更新对话属性，通常用于修改对话标题 `title`。

### `DELETE /api/conversations/:id`
删除指定对话，利用 Supabase 的 `ON DELETE CASCADE` 机制，其关联的所有的消息(messages)均会自动清除。

---

## 核心聊天接口 (Chat)

### `POST /api/chat`
处理用户输入，桥接 DeepSeek 流式 API 并持久化双方消息。

- **请求体 (Request Body)**:
  ```json
  {
    "prompt": "用户输入的信息",
    "conversationId": "UUID 格式的对话主键"
  }
  ```

- **处理逻辑 (Workflow)**:
  1. 拦截空消息及缺少 `conversationId` 的非法请求。
  2. 将用户的 `prompt` 作为 `role: 'user'` 存入 Supabase `messages` 表。
  3. 查询该 `conversationId` 关联的最近 **20条** 历史记录作为上下文。
  4. 注入 System Prompt 构建完整 `messages` 数组，向 DeepSeek (`deepseek-v4-flash`) 发起流式 POST 请求。
  5. 解析 SSE (Server-Sent Events) 并实时透传回前端 (利用 `TextDecoder` 与 `WritableStream`)。
  6. 对话流结束后，将拼接完整的 `assistant` 回复入库。
  7. **自适应标题更新**: 如果是此对话的前置回合（前 2 条消息），系统会截取首条 prompt 的前 50 字符自动更新此对话的 `title`。

- **响应特征**:
  使用 `text/event-stream` 格式响应。遇到 `[DONE]` 标识代表数据流结束。
