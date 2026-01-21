# 认证 API 契约

**版本**: v1.0
**更新日期**: 2026-01-21
**关联需求**: FR-001 零门槛启动

---

## 概述

本文档定义用户认证相关的 API 契约，包括 Guest 用户创建、用户档案管理。

MVP 阶段仅支持 Guest 模式，OAuth 登录为后续功能。

---

## API 端点

### POST /api/auth/guest

创建 Guest 用户。

#### 请求

**Body**:
```typescript
interface CreateGuestRequest {
  intent: string;              // 投资初心，必填
  source?: string;             // 来源，如 'pwa_web', 'ios', 'android'
}
```

**示例请求**:
```json
{
  "intent": "长期持有，稳定增值",
  "source": "pwa_web"
}
```

#### 响应

**成功 (201)**:
```typescript
interface CreateGuestResponse {
  success: true;
  data: {
    user_id: string;           // UUID
    intent: string;
    guest: true;
    created_at: string;        // ISO 8601
  };
}
```

**示例响应**:
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "intent": "长期持有，稳定增值",
    "guest": true,
    "created_at": "2026-01-21T08:15:00Z"
  }
}
```

**错误**:

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | INVALID_INTENT | intent 为空或过短 |
| 500 | CREATE_USER_FAILED | 用户创建失败 |

---

### GET /api/auth/profile

获取当前用户档案。

#### 请求

**Headers**:
```
X-User-Id: <user_uuid>
```

#### 响应

**成功 (200)**:
```typescript
interface GetProfileResponse {
  success: true;
  data: {
    id: string;
    intent: string;
    guest: boolean;
    selected_guru: string;
    created_at: string;
    updated_at: string;
    // 统计数据
    stats: {
      chat_count: number;        // 对话次数
      review_count: number;      // 复盘次数
      checkin_streak: number;    // 连续打卡天数
    };
  };
}
```

**错误**:

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 401 | UNAUTHORIZED | 未提供 X-User-Id |
| 404 | USER_NOT_FOUND | 用户不存在 |

---

### PATCH /api/auth/profile

更新用户档案。

#### 请求

**Headers**:
```
Content-Type: application/json
X-User-Id: <user_uuid>
```

**Body**:
```typescript
interface UpdateProfileRequest {
  intent?: string;             // 更新投资初心
  selected_guru?: Guru;        // 更新选择的导师
}
```

#### 响应

**成功 (200)**:
```typescript
interface UpdateProfileResponse {
  success: true;
  data: {
    id: string;
    intent: string;
    selected_guru: string;
    updated_at: string;
  };
}
```

**错误**:

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | INVALID_GURU | 无效的导师类型 |
| 401 | UNAUTHORIZED | 未提供 X-User-Id |
| 404 | USER_NOT_FOUND | 用户不存在 |

---

### DELETE /api/auth/account

删除用户账户及所有数据。

#### 请求

**Headers**:
```
X-User-Id: <user_uuid>
```

**Body**:
```typescript
interface DeleteAccountRequest {
  confirmation: 'DELETE_MY_ACCOUNT';  // 确认字符串
}
```

#### 响应

**成功 (200)**:
```json
{
  "success": true,
  "message": "账户已删除"
}
```

**错误**:

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | INVALID_CONFIRMATION | 确认字符串不匹配 |
| 401 | UNAUTHORIZED | 未提供 X-User-Id |

---

## 数据模型

### 数据库 Schema

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent TEXT NOT NULL,
  guest BOOLEAN DEFAULT true,
  selected_guru VARCHAR(20) DEFAULT 'coach',
  source VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- RLS 策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Guest 用户可以访问自己的档案（通过 X-User-Id 验证）
CREATE POLICY "Users can access own profile"
  ON user_profiles FOR ALL
  USING (id = current_setting('app.current_user_id')::uuid);
```

### TypeScript 类型

```typescript
// lib/supabase.ts
interface UserProfile {
  id: string;
  intent: string;
  guest: boolean;
  selected_guru: Guru;
  source: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 前端存储

Guest 用户信息存储在 localStorage：

```typescript
// 创建 Guest 后保存
localStorage.setItem('user_id', response.data.user_id);
localStorage.setItem('intent', response.data.intent);
localStorage.setItem('user_type', 'guest');
localStorage.setItem('created_at', response.data.created_at);
```

检查用户状态：

```typescript
function isLoggedIn(): boolean {
  return !!localStorage.getItem('user_id');
}

function getUserId(): string | null {
  return localStorage.getItem('user_id');
}
```

---

## 安全考虑

### Guest 模式限制

| 功能 | Guest 用户 | 注册用户 |
|------|-----------|---------|
| 对话次数 | 无限制 | 无限制 |
| 数据保留 | 30 天不活跃后清除 | 永久 |
| 跨设备同步 | ❌ | ✅ |
| 数据导出 | ❌ | ✅ |

### X-User-Id 验证

```typescript
// middleware 示例
function validateUserId(req: Request): string | null {
  const userId = req.headers.get('X-User-Id');

  if (!userId) return null;

  // UUID 格式验证
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId)) return null;

  return userId;
}
```

---

## 未来扩展 (Post-MVP)

### OAuth 登录

```typescript
// 未来 API
POST /api/auth/oauth/google
POST /api/auth/oauth/apple
POST /api/auth/oauth/wechat

// Guest 转正式用户
POST /api/auth/upgrade
{
  "provider": "google",
  "token": "<oauth_token>"
}
```

---

**最后更新**: 2026-01-21
