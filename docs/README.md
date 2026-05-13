# My Backend Agent - 项目文档

本项目是一个基于 Nuxt 3 开发的智能对话代理（AI Agent）系统，集成了 DeepSeek AI 模型，并使用 Supabase 作为后端数据库实现会话与消息的持久化。

## 核心技术栈

- **前端框架**: Nuxt 3 (Vue 3 Composition API)
- **UI 组件库**: Nuxt UI, Tailwind CSS
- **后端服务**: Nuxt Server (Nitro) + Supabase (BaaS)
- **AI 大模型**: DeepSeek API (`deepseek-v4-flash`)

## 文档目录

- [API 接口说明](./api.md) - 后端提供给前端的对话及历史记录接口
- [数据库设计](./database.md) - Supabase 核心表结构及迁移脚本
- [部署与运维](./deployment.md) - 环境变量配置与 GitHub Actions 自动化

## 本地开发指南

### 1. 安装依赖

```bash
pnpm install
```

### 2. 环境配置

在根目录下创建 `.env` 文件，并参考 `.env.example` 填入你的 Supabase 和 DeepSeek 密钥配置。（详见部署与运维文档）。

### 3. 启动本地服务

```bash
pnpm dev
```
打开浏览器访问 `http://localhost:3000` 即可开始预览。

### 4. 项目结构

```text
├── app/                  # 前端核心业务逻辑
│   ├── components/       # 聊天界面组件 (ChatInput, ChatMessageBubble 等)
│   ├── composables/      # 组合式函数 (如 useChat.ts 统一状态管理)
│   ├── pages/            # 路由视图
│   └── types/            # TypeScript 类型定义
├── server/               # 后端 API 路由
│   ├── api/              # Nitro Server 接口
├── docs/                 # 项目核心文档
└── supabase-migration.sql# 数据库初始化脚本
```
