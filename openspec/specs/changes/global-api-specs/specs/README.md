# API Contracts

本目录包含 Budvest 所有 API 的契约规范。

---

## 规范约定

### 基础 URL

```
开发环境: http://localhost:3000/api
生产环境: https://budvest.app/api
```

### 通用请求头

```http
Content-Type: application/json
X-User-Id: <user_uuid>        # 用户标识（Guest 或注册用户）
X-Request-Id: <uuid>          # 请求追踪 ID（可选）
```

### 通用响应格式

**成功响应**:
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    has_more?: boolean;
  };
}
```

**错误响应**:
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;        // 错误码，如 INVALID_INPUT
    message: string;     // 用户可见的错误消息
    details?: unknown;   // 详细错误信息（调试用）
  };
}
```

---

## API 清单

| 模块 | 文件 | 说明 | 状态 |
|------|------|------|------|
| 认证 | [auth-api.md](./auth-api.md) | Guest 创建、用户档案 | ✅ |
| 对话 | [chat-api.md](./chat-api.md) | AI 情绪对话 | ✅ |
| 复盘 | [review-api.md](./review-api.md) | 投资心理复盘 | ✅ |
| 情绪 | [emotion-api.md](./emotion-api.md) | 每日情绪打卡 | 🟡 CHANGE-002 |
| 市场 | market-api.md | 市场数据查询 | 📋 待补充 |
| 错误码 | [error-codes.md](./error-codes.md) | 统一错误码定义 | ✅ |

---

## HTTP 状态码使用规范

| 状态码 | 使用场景 |
|--------|---------|
| 200 OK | GET 成功、PUT/PATCH 更新成功 |
| 201 Created | POST 创建成功 |
| 204 No Content | DELETE 删除成功 |
| 400 Bad Request | 请求参数错误 |
| 401 Unauthorized | 未认证 |
| 403 Forbidden | 无权限 |
| 404 Not Found | 资源不存在 |
| 409 Conflict | 资源冲突（如重复创建） |
| 422 Unprocessable Entity | 业务逻辑错误 |
| 429 Too Many Requests | 请求频率限制 |
| 500 Internal Server Error | 服务器错误 |
| 503 Service Unavailable | 服务暂时不可用 |

---

## 分页规范

**请求参数**:
```typescript
interface PaginationParams {
  limit?: number;   // 每页数量，默认 20，最大 100
  offset?: number;  // 偏移量，默认 0
  // 或使用游标分页
  cursor?: string;  // 游标（推荐大数据量场景）
}
```

**响应元数据**:
```typescript
interface PaginationMeta {
  total: number;      // 总数量
  limit: number;      // 每页数量
  offset: number;     // 当前偏移
  has_more: boolean;  // 是否有更多
  next_cursor?: string;  // 下一页游标
}
```

---

## 日期时间格式

- 所有时间使用 **ISO 8601** 格式
- 时区统一使用 **UTC**
- 前端显示时转换为本地时区

```
正确: 2026-01-21T10:30:00Z
正确: 2026-01-21T18:30:00+08:00
错误: 2026-01-21 10:30:00
```

---

## 版本控制

当前 API 版本: **v1** (隐式，无需在 URL 中指定)

未来如需版本升级，将使用 URL 前缀：
```
/api/v2/chat
```

---

**最后更新**: 2026-01-21
**维护者**: Engineering Team
