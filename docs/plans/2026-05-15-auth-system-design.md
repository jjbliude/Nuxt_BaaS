# 登录系统设计文档

## 需求

为 AI 聊天应用添加用户认证系统，实现数据隔离——每个用户只能看到自己的对话列表。

## 决策记录

| 决策项 | 选定方案 | 备注 |
|---|---|---|
| 登录方式 | 邮箱 + 密码 | 后续可扩展手机号 SMS OTP |
| 界面形式 | 独立 `/login`、`/register` 页面 | 未登录强制跳转 |
| 邮箱验证 | 不需要，注册即用 | 降低初期门槛 |
| 历史数据处理 | 保留，归属系统用户 | 迁移时分配默认 user_id |
| 技术方案 | Supabase Auth + RLS | 零自建鉴权，数据库层隔离 |

## 架构设计

### 认证流程

```
用户访问 /
  → middleware/auth.global.ts 检查 useSupabaseUser()
  → 未登录 → 重定向 /login
  → 已登录 → 正常渲染聊天页

/login  → supabase.auth.signInWithPassword()
/register → supabase.auth.signUp() (confirmEmail: false)
登出     → supabase.auth.signOut() → 跳转 /login
```

### 数据库变更

#### conversations 表
- 新增 `user_id UUID NOT NULL REFERENCES auth.users(id)`
- 创建索引 `idx_conversations_user_id`

#### messages 表
- 新增 `user_id UUID NOT NULL REFERENCES auth.users(id)`

#### RLS 策略
- 所有 CRUD 操作附加 `WHERE user_id = auth.uid()`
- 确保数据库层面的绝对隔离

#### 历史数据迁移
- 在 Supabase 中预创建一个系统账户
- 将现有无 user_id 的数据统一归属该账户

### 页面结构

```
app/
├── middleware/auth.global.ts   # 路由守卫
├── pages/
│   ├── login.vue               # 登录页
│   ├── register.vue            # 注册页
│   └── index.vue               # 聊天页（已有，需改造）
```

### Server API 改造

所有 `/api/conversations/*` 和 `/api/chat` 端点：
- 通过 `serverSupabaseUser(event)` 获取当前用户
- 未认证请求返回 401
- 写入时自动注入 `user_id`
- RLS 作为兜底防线

### UI 变更

- `ChatSidebar` 底部展示当前用户邮箱 + 登出按钮
- `nuxt.config.ts` 调整 `supabase.redirect` 配置
