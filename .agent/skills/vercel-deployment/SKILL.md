---
name: Vercel Deployment Expert
description: Guide for deploying Next.js applications to Vercel, configuring environments, and managing CI/CD.
---
# Vercel Deployment Expert Skill

此 Skill 指导如何将 Next.js 应用高效、安全地部署到 Vercel 平台，以及如何管理生产环境。

## 核心流程

1. **项目连接**: 将 GitHub 仓库连接到 Vercel。
2. **环境变量配置**: 安全地管理 Secrets。
3. **构建与部署**: 自动化 CI/CD。
4. **域名与监控**: 配置自定义域名和分析。

## 最佳实践指南

### 1. 环境变量 (Environment Variables)

- **.env.local**: 本地开发使用，不要提交到 Git。
- **Vercel Project Settings**: 在 Vercel 后台配置 Production, Preview, Development 三种环境的变量。

**常见变量清单**:
- `NEXT_PUBLIC_SUPABASE_URL`: 公开
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 公开
- `SUPABASE_SERVICE_ROLE_KEY`: **私密 (仅服务端)**
- `OPENAI_API_KEY`: **私密**
- `KV_URL` / `KV_REST_API_TOKEN`: Vercel KV / Upstash Redis 配置

### 2. Edge Functions 与 Serverless

在 `app/api/route.ts` 中指定运行时：

```ts
export const runtime = 'edge'; // 或 'nodejs' (默认)
export const preferredRegion = 'hkg1'; // 指定区域以减少延迟
```

- **Edge**: 启动快，适合简单逻辑、API 代理、重定向。
- **Node.js**: 功能全，适合复杂计算、数据库连接 (非 HTTP 连接池)。

> **注意**: Supabase JS 客户端兼容 Edge Runtime。

### 3. 构建优化

- **ignoreBuildCommand**: 在 `vercel.json` 或项目设置中配置，避免不必要的构建（如只改了文档时）。
  ```bash
  git diff --quiet HEAD^ HEAD ./
  ```

### 4. 预览部署 (Preview Deployments)

- 每次 Pull Request 会自动生成预览网址。
- 利用预览环境进行 QA 测试和 UI 走查。
- 可以在 PR 评论中直接查看 Vercel 部署状态。

### 5. 常见问题排查

- **500 Server Error**: 检查 Function Logs。通常是环境变量缺失或代码运行时错误。
- **404 Not Found**: 检查路由文件位置或动态路由参数。
- **Timeout**: Serverless Function 默认超时限制 (通常 10s-60s)。长任务应使用后台队列或 Edge Function。

## Vercel CLI 常用命令

```bash
vercel login       # 登录
vercel link        # 关联本地项目
vercel pull        # 拉取环境变量
vercel dev         # 本地开发 (模拟 Vercel 环境)
vercel --prod      # 手动部署到生产环境
```
