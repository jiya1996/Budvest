# 统一错误码定义

**版本**: v1.0
**更新日期**: 2026-01-21

---

## 概述

本文档定义 Budvest API 的统一错误码规范，确保前后端错误处理一致。

---

## 错误响应格式

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // 错误码（大写下划线）
    message: string;     // 用户可见的中文错误消息
    details?: unknown;   // 详细错误信息（仅开发环境返回）
  };
}
```

**示例**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_EMOTION",
    "message": "情绪值必须在 1-5 之间",
    "details": {
      "field": "emotion_before",
      "value": 10,
      "constraint": "1 <= value <= 5"
    }
  }
}
```

---

## 错误码分类

### 通用错误 (GENERAL_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `INVALID_REQUEST` | 400 | 请求格式错误 | 请求格式不正确 |
| `INVALID_JSON` | 400 | JSON 解析失败 | 请求数据格式错误 |
| `MISSING_FIELD` | 400 | 缺少必填字段 | 缺少必填项: {field} |
| `INVALID_FIELD` | 400 | 字段值无效 | {field} 格式不正确 |
| `UNAUTHORIZED` | 401 | 未认证 | 请先登录 |
| `FORBIDDEN` | 403 | 无权限 | 无权执行此操作 |
| `NOT_FOUND` | 404 | 资源不存在 | 请求的资源不存在 |
| `CONFLICT` | 409 | 资源冲突 | 数据已存在 |
| `RATE_LIMIT` | 429 | 请求频率限制 | 请求太频繁，请稍后再试 |
| `INTERNAL_ERROR` | 500 | 服务器错误 | 服务器开小差了，请稍后再试 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 | 服务暂时不可用 |

---

### 认证错误 (AUTH_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `AUTH_INVALID_USER_ID` | 401 | 无效的用户 ID | 用户身份验证失败 |
| `AUTH_USER_NOT_FOUND` | 404 | 用户不存在 | 用户不存在 |
| `AUTH_INVALID_INTENT` | 400 | 投资初心无效 | 请输入有效的投资初心 |
| `AUTH_INVALID_GURU` | 400 | 导师类型无效 | 无效的导师选择 |
| `AUTH_CREATE_FAILED` | 500 | 用户创建失败 | 创建用户失败，请重试 |
| `AUTH_INVALID_CONFIRMATION` | 400 | 确认字符串不匹配 | 请输入正确的确认信息 |

---

### 对话错误 (CHAT_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `CHAT_INVALID_MESSAGE` | 400 | 消息为空 | 请输入消息内容 |
| `CHAT_MESSAGE_TOO_LONG` | 400 | 消息超过 500 字 | 消息过长，请控制在 500 字以内 |
| `CHAT_AI_ERROR` | 500 | AI 服务异常 | AI 服务暂时不可用 |
| `CHAT_PARSE_ERROR` | 500 | AI 响应解析失败 | 响应处理失败，请重试 |
| `CHAT_SESSION_NOT_FOUND` | 404 | 会话不存在 | 对话会话不存在 |

---

### 复盘错误 (REVIEW_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `REVIEW_INVALID_EMOTION` | 400 | 情绪值不在 1-5 范围 | 情绪值必须在 1-5 之间 |
| `REVIEW_INVALID_ACTION` | 400 | 无效的决策类型 | 请选择有效的决策 |
| `REVIEW_REFLECTION_TOO_LONG` | 400 | 备注超过 200 字 | 备注不能超过 200 字 |
| `REVIEW_NOT_FOUND` | 404 | 复盘记录不存在 | 复盘记录不存在 |
| `REVIEW_AI_SUMMARY_FAILED` | 500 | AI 总结生成失败 | AI 总结生成失败 |

---

### 情绪打卡错误 (EMOTION_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `EMOTION_INVALID_TYPE` | 400 | 无效的情绪类型 | 请选择有效的情绪 |
| `EMOTION_PAST_DATE_LOCKED` | 422 | 过去日期无法修改 | 过去的打卡记录无法修改 |
| `EMOTION_FUTURE_DATE` | 400 | 不能打卡未来日期 | 不能为未来日期打卡 |
| `EMOTION_NOT_FOUND` | 404 | 打卡记录不存在 | 今日暂无打卡记录 |

---

### 市场数据错误 (MARKET_*)

| 错误码 | HTTP | 描述 | 用户消息 |
|--------|------|------|---------|
| `MARKET_INVALID_SYMBOL` | 400 | 无效的股票代码 | 请输入有效的股票代码 |
| `MARKET_SYMBOL_NOT_FOUND` | 404 | 股票不存在 | 未找到该股票 |
| `MARKET_DATA_UNAVAILABLE` | 503 | 市场数据暂不可用 | 行情数据暂时不可用 |
| `MARKET_API_ERROR` | 500 | 第三方 API 错误 | 获取行情数据失败 |

---

## 前端错误处理

### 统一错误处理函数

```typescript
// lib/api-client.ts
interface APIError extends Error {
  code: string;
  status: number;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok || !data.success) {
    const error = new Error(data.error?.message || '请求失败') as APIError;
    error.code = data.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    throw error;
  }

  return data.data;
}

// 使用示例
try {
  const result = await handleResponse(await fetch('/api/chat', { ... }));
} catch (error) {
  if (error instanceof Error && 'code' in error) {
    const apiError = error as APIError;

    switch (apiError.code) {
      case 'CHAT_MESSAGE_TOO_LONG':
        toast.error('消息过长，请精简内容');
        break;
      case 'RATE_LIMIT':
        toast.error('请求太频繁，请稍后再试');
        break;
      default:
        toast.error(apiError.message);
    }
  }
}
```

### Toast 消息映射

```typescript
const ERROR_TOAST_MESSAGES: Record<string, string> = {
  // 用户友好的错误消息覆盖
  'INTERNAL_ERROR': '服务器开小差了，请稍后再试',
  'SERVICE_UNAVAILABLE': '服务正在维护中',
  'RATE_LIMIT': '操作太频繁啦，喝杯水歇一歇',
  'CHAT_AI_ERROR': 'AI 助手正在休息，请稍后再试',
};

function getToastMessage(code: string, defaultMessage: string): string {
  return ERROR_TOAST_MESSAGES[code] || defaultMessage;
}
```

---

## 后端错误生成

### 错误工厂函数

```typescript
// lib/errors.ts
export class APIError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  toResponse(): Response {
    return Response.json(
      {
        success: false,
        error: {
          code: this.code,
          message: this.message,
          ...(process.env.NODE_ENV === 'development' && { details: this.details })
        }
      },
      { status: this.status }
    );
  }
}

// 预定义错误
export const Errors = {
  invalidMessage: () => new APIError('CHAT_INVALID_MESSAGE', '请输入消息内容', 400),
  messageTooLong: () => new APIError('CHAT_MESSAGE_TOO_LONG', '消息过长，请控制在 500 字以内', 400),
  unauthorized: () => new APIError('UNAUTHORIZED', '请先登录', 401),
  notFound: (resource: string) => new APIError('NOT_FOUND', `${resource}不存在`, 404),
  // ...
};
```

### 在 API 中使用

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  try {
    const { userMessage } = await request.json();

    if (!userMessage) {
      throw Errors.invalidMessage();
    }

    if (userMessage.length > 500) {
      throw Errors.messageTooLong();
    }

    // ... 业务逻辑

  } catch (error) {
    if (error instanceof APIError) {
      return error.toResponse();
    }

    console.error('Unexpected error:', error);
    return new APIError('INTERNAL_ERROR', '服务器开小差了，请稍后再试', 500).toResponse();
  }
}
```

---

## 错误监控

### 需要告警的错误

| 错误码 | 告警级别 | 说明 |
|--------|---------|------|
| `INTERNAL_ERROR` | 🔴 Critical | 服务器异常，需立即处理 |
| `CHAT_AI_ERROR` | 🟠 Warning | AI 服务异常 |
| `MARKET_API_ERROR` | 🟠 Warning | 第三方 API 异常 |
| `RATE_LIMIT` | 🟡 Info | 可能的恶意请求 |

---

**最后更新**: 2026-01-21
