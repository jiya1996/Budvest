---
name: Next.js Development Expert
description: Expert guidance on Next.js 15+ App Router development, Server Actions, and React Server Components.
---
# Next.js Development Expert Skill

此 Skill 专注于 Next.js 15+ (App Router) 的最佳实践开发，确保代码的高性能、可维护性和类型安全。

## 核心原则

1. **App Router 优先**: 默认使用 `app/` 目录结构，而非 `pages/`。
2. **React Server Components (RSC)**: 默认组件即为服务端组件，仅在需要交互 (useState, useEffect) 时使用 `'use client'`。
3. **Server Actions**: 用于处理数据变更 (Mutations)，替代传统的 API Routes (`pages/api`).
4. **TypeScript**: 严格的类型定义，避免 `any`。

## 常用模式与代码片段

### 1. 数据获取 (Server Component)

```tsx
// app/page.tsx
import { db } from '@/lib/db';

// 是 Server Component，可直接是 async
export default async function DashboardPage() {
  const data = await db.query('SELECT * FROM users');
  
  return (
    <main>
      <h1>Data: {data.length}</h1>
      {/* Client Component 作为子组件 */}
      <ClientList data={data} />
    </main>
  );
}
```

### 2. Server Action (表单提交)

```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createUser(formData: FormData) {
  const name = formData.get('name');
  await db.user.create({ data: { name } });
  
  revalidatePath('/users'); // 清除缓存
  redirect('/users');
}

// GUI Component
// app/form.tsx
'use client'
import { createUser } from './actions';

export function UserForm() {
  return (
    <form action={createUser}>
      <input name="name" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### 3. API Routes (Route Handlers)
仅在需要对外部提供 API（如 Webhook, Mobile App）时使用 Route Handlers。

```ts
// app/api/webhook/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ received: true });
}
```

## 目录结构建议

```
app/
  (auth)/          # Route Group，不影响 URL
    login/
    register/
  dashboard/
    layout.tsx     #Dashboard 布局
    page.tsx       #Dashboard 主页
    loading.tsx    #加载状态
    error.tsx      #错误处理
components/
  ui/              #基础 UI 组件 (Button, Card)
  shared/          #共享业务组件
lib/
  utils.ts
  db.ts
```

## 性能优化清单

- [ ] 使用 `<Image />` 组件优化图片。
- [ ] 使用 `next/font` 优化字体加载。
- [ ] 关键数据请求使用 `Suspense` 流式传输。
- [ ] 合理使用 `generateStaticParams` 进行静态生成 (SSG)。
