# 部署与运维

## 环境变量配置

请在生产环境与本地部署时确保以下环境变量注入完整。系统根目录下需存在有效的 `.env` 文件。

```env
# Supabase 配置 (项目 URL 及公共服务密钥)
SUPABASE_URL="https://[PROJECT-ID].supabase.co"
SUPABASE_KEY="sb_publishable_xxxxxx"

# 鉴权/数据库管理员密码（仅限运维，一般不暴露到前端）
SUPABASE_PASSWORD="YOUR_PASSWORD"

# DeepSeek 模型 API 密钥
DEEPSEEK_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
```

> **注意**: 当前阶段开发为了简化流程，在 `nuxt.config.ts` 中配置了 `supabase: { redirect: false }`，即全局免登录直接写入测试。生产上线前需要配置 RLS (Row Level Security) 鉴权策略并打开 redirect。

## 自动化工作流 (GitHub Actions)

由于免费版 Supabase 存在资源休眠机制（如果长时间无请求导致数据库暂停），我们利用 GitHub Actions 构建了一个保活任务。

### Keep Supabase Active 任务
- **路径**: `.github/workflows/keep-supabase-active.yml`
- **触发条件**: 每 3 天定时执行 (`cron: '0 0 */3 * *'`)，同时也支持手动触发 (`workflow_dispatch`)。
- **行为**: 向后端的 `conversations` 路由或 Supabase 直接发起带有匿名鉴权的插入请求，制造一条心跳记录 `{"title": "System Heartbeat (Auto-generated)"}` 确保数据库处于活跃状态。
- **相关 GitHub Secrets**: 需要在仓库的 Secrets 中配置 `SUPABASE_URL` 及 `SUPABASE_ANON_KEY`。
