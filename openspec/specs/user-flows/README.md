# User Flows

本目录包含 Budvest 所有关键用户流程的详细说明和可视化流程图。

## 流程图规范

所有流程图使用 **Mermaid** 语法绘制，便于在 Markdown 中直接渲染。

### 流程图类型

- **flowchart TB**: 自上而下流程图（用于线性流程）
- **sequenceDiagram**: 时序图（用于多方交互）
- **stateDiagram-v2**: 状态机图（用于状态转换）

### 节点类型约定

```mermaid
flowchart TB
    Start([开始/结束 - 圆角矩形])
    Action[操作/步骤 - 矩形]
    Decision{判断/决策 - 菱形}
    SubProcess[[子流程 - 双边框]]
    API{{API调用 - 六边形}}
```

### 颜色约定

- 🟢 **绿色**: 成功路径
- 🔴 **红色**: 错误/失败路径
- 🟡 **黄色**: 警告/引导路径
- 🔵 **蓝色**: 信息/说明

---

## 核心流程清单

| 流程 | 文件 | 优先级 | 状态 |
|------|------|--------|------|
| 游客启动与初心设定 | [onboarding-flow.md](./onboarding-flow.md) | P0 | ✅ 已完成 |
| AI 情绪对话 | [chat-flow.md](./chat-flow.md) | P0 | ✅ 已完成 |
| 投资心理复盘 | [review-flow.md](./review-flow.md) | P0 | ✅ 已完成 |
| 每日情绪打卡 | [emotion-checkin-flow.md](./emotion-checkin-flow.md) | P0 | ✅ 已完成 |
| 游客转化注册 | [guest-conversion-flow.md](./guest-conversion-flow.md) | P1 | ✅ 已完成 |

2026-1-21 jiya修改后版本

| 流程 | 文件 | 优先级 | 状态 |
|------|------|--------|------|
| 游客启动与初心设定 | [onboarding-flow.md](./onboarding-flow.md) | P0 | ✅ 已完成 |
| AI 情绪对话 | chat-flow.md | P0 | 📋 待补充 |
| 投资心理复盘 | review-flow.md | P0 | 📋 待补充 |
| 每日情绪打卡 | emotion-checkin-flow.md | P0 | 🟡 CHANGE-002 |
| 游客转化注册 | guest-conversion-flow.md | P1 | 📋 待补充 |

---

## 使用指南

### 前端开发者

1. 查看流程图了解页面跳转逻辑
2. 根据流程实现路由和状态管理
3. 匹配 API 调用时机

### 后端开发者

1. 查看流程图中的 API 调用节点
2. 参照 `api-contracts/` 实现对应接口
3. 确保状态转换符合流程定义

### QA 测试

1. 根据流程图设计测试用例
2. 覆盖所有分支（成功/失败路径）
3. 验证边界条件（如网络断开、中途退出）

---

**最后更新**: 2026-01-20  
**维护者**: Product & Engineering Team
