# API 规范：游客认证 (Guest Auth)

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-001

---

## 概述

游客认证 API 用于创建和管理游客用户，支持零门槛启动功能。

---

## 端点清单

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/guest` | 创建游客用户 |
| GET | `/api/auth/guest/:id` | 获取游客信息 |
| PATCH | `/api/auth/guest/:id` | 更新游客信息 |

---

## POST /api/auth/guest

创建新的游客用户记录。

### 请求

```typescript
// Headers
Content-Type: application/json

// Body
{
  "guestId": string,           // 客户端生成的 UUID v4
  "investmentIntention": string // 投资初心: "long_term" | "opportunity" | "learning"
}
```

### 响应

**成功 (201 Created)**

```typescript
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "guest": true,
    "investmentIntention": "long_term",
    "createdAt": "2026-01-21T10:00:00Z"
  }
}
```

**错误 (400 Bad Request)**

```typescript
{
  "success": false,
  "error": {
    "code": "GUEST_INVALID_INTENTION",
    "message": "投资初心选项无效"
  }
}
```

**错误 (409 Conflict)**

```typescript
{
  "success": false,
  "error": {
    "code": "GUEST_ALREADY_EXISTS",
    "message": "该游客 ID 已存在"
  }
}
```

### 实现示例

```typescript
// app/api/auth/guest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

const VALID_INTENTIONS = ['long_term', 'opportunity', 'learning'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, investmentIntention } = body;

    // 验证参数
    if (!guestId || !investmentIntention) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'GUEST_MISSING_PARAMS',
          message: '缺少必要参数',
        },
      }, { status: 400 });
    }

    if (!VALID_INTENTIONS.includes(investmentIntention)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'GUEST_INVALID_INTENTION',
          message: '投资初心选项无效',
        },
      }, { status: 400 });
    }

    // 创建 Supabase 客户端
    const supabase = createClient();

    // 检查是否已存在
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', guestId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'GUEST_ALREADY_EXISTS',
          message: '该游客 ID 已存在',
        },
      }, { status: 409 });
    }

    // 创建游客记录
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: guestId,
        guest: true,
        investment_goal: investmentIntention,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        guest: data.guest,
        investmentIntention: data.investment_goal,
        createdAt: data.created_at,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create guest error:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'GUEST_CREATE_FAILED',
        message: '创建游客失败',
      },
    }, { status: 500 });
  }
}
```

---

## GET /api/auth/guest/:id

获取游客用户信息。

### 请求

```
GET /api/auth/guest/uuid-v4
```

### 响应

**成功 (200 OK)**

```typescript
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "guest": true,
    "investmentIntention": "long_term",
    "createdAt": "2026-01-21T10:00:00Z",
    "updatedAt": "2026-01-21T10:00:00Z"
  }
}
```

**错误 (404 Not Found)**

```typescript
{
  "success": false,
  "error": {
    "code": "GUEST_NOT_FOUND",
    "message": "游客不存在"
  }
}
```

---

## PATCH /api/auth/guest/:id

更新游客用户信息（如升级为注册用户）。

### 请求

```typescript
// Headers
Content-Type: application/json

// Body
{
  "investmentIntention"?: string,  // 更新投资初心
  "guest"?: boolean                // 升级为注册用户时设为 false
}
```

### 响应

**成功 (200 OK)**

```typescript
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "guest": false,
    "investmentIntention": "opportunity",
    "updatedAt": "2026-01-21T12:00:00Z"
  }
}
```

---

## 错误码清单

| 错误码 | HTTP 状态 | 描述 |
|--------|----------|------|
| GUEST_MISSING_PARAMS | 400 | 缺少必要参数 |
| GUEST_INVALID_INTENTION | 400 | 投资初心选项无效 |
| GUEST_ALREADY_EXISTS | 409 | 游客 ID 已存在 |
| GUEST_NOT_FOUND | 404 | 游客不存在 |
| GUEST_CREATE_FAILED | 500 | 创建游客失败 |
| GUEST_UPDATE_FAILED | 500 | 更新游客失败 |

---

## 客户端调用示例

```typescript
// lib/guest.ts
const GUEST_ID_KEY = 'bantou_guest_id';

export async function createGuestProfile(intention: string): Promise<void> {
  const guestId = getOrCreateGuestId();

  try {
    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        investmentIntention: intention,
      }),
    });

    if (!response.ok) {
      // 409 冲突说明已存在，忽略
      if (response.status !== 409) {
        console.error('Failed to create guest profile');
      }
    }
  } catch (error) {
    // 网络错误，仅本地存储
    console.warn('Guest profile sync failed, using local storage only');
  }
}

export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}
```

---

## 安全考虑

1. **UUID 不可预测性**: 使用 `crypto.randomUUID()` 生成，防止枚举攻击
2. **RLS 策略**: Supabase 表应配置 RLS，限制用户只能访问自己的数据
3. **速率限制**: 建议添加 API 速率限制，防止滥用

---

**最后更新**: 2026-01-21
