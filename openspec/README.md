# OpenSpec for Budvest

本目录包含 Budvest 项目的规范化文档（Spec-Driven Development）。

## 目录结构

- **specs/** - 单一事实来源，所有当前生效的规范
- **changes/** - 待实施或进行中的变更提案
- **archive/** - 已完成并归档的变更

## 工作流程

### 1. 查看当前规范

所有当前生效的规范都在 `specs/` 目录：

```bash
openspec/specs/
├── product-vision.md                    ✅ 已完成
├── mvp-roadmap.md                       ✅ 已完成
├── requirements/
│   ├── functional-requirements.md       ✅ 已完成
│   └── non-functional-requirements.md   ✅ 已完成
├── architecture/
│   ├── system-architecture.md           ✅ 已完成
│   ├── push-notification-system.md      ✅ 已完成
│   └── gamification-engine.md           ✅ 已完成
├── ai-system/
│   └── spec.md                          ✅ 已完成
├── database/
│   └── spec.md                          ✅ 已完成
├── analytics/
│   └── events.md                        ✅ 已完成
│
├── user-flows/                          📋 待补充
│   ├── README.md                        (流程图规范说明)
│   ├── onboarding-flow.md               (登录注册流程)
│   ├── chat-flow.md                     (AI 对话流程)
│   ├── review-flow.md                   (复盘记录流程)
│   ├── emotion-checkin-flow.md          (情绪打卡流程)
│   └── guest-conversion-flow.md         (游客转化流程)
│
<<<<<<< HEAD
├── ui-specifications/                   📋 待补充
=======
├── ui-specifications/                   ✅ 已完成
>>>>>>> 3b4ad3e (docs: 记录我本地的修改)
│   ├── README.md                        (设计系统总览)
│   ├── design-tokens.md                 (颜色、字体、间距)
│   ├── components.md                    (通用组件规范)
│   ├── pages/
│   │   ├── home-page.md                 (首页规范)
│   │   ├── chat-page.md                 (对话页规范)
│   │   ├── review-page.md               (复盘页规范)
│   │   └── profile-page.md              (我的页规范)
│   └── interactions.md                  (交互规范)
│
├── api-contracts/                       📋 待补充
│   ├── README.md                        (API 规范总览)
│   ├── auth-api.md                      (认证相关 API)
│   ├── chat-api.md                      (对话相关 API)
│   ├── review-api.md                    (复盘相关 API)
│   ├── emotion-api.md                   (情绪打卡 API)
│   ├── market-api.md                    (市场数据 API)
│   └── error-codes.md                   (错误码定义)
│
├── state-machines/                      📋 待补充
│   ├── chat-states.md                   (对话状态机)
│   ├── review-states.md                 (复盘状态机)
│   └── emotion-states.md                (情绪枚举)
│
└── operations/                          📋 待补充
    ├── deployment.md                    (部署流程)
    ├── monitoring.md                    (监控告警)
    ├── rollback.md                      (回滚预案)
    └── acceptance-criteria.md           (端到端验收标准)
```

**图例**:

- ✅ 已完成 - 此规范已创建并经过审查
- 📋 待补充 - 计划在后续阶段补充（详见 [OpenSpec Gap Analysis](../.gemini/antigravity/brain/*/openspec_gap_analysis.md))

### 2. 提出变更

创建新的变更提案：

```bash
openspec/changes/<change-name>/
├── proposal.md      # 为什么要做这个变更
├── tasks.md         # 如何实现（任务清单）
└── specs/           # 对现有 spec 的修改（delta）
```

### 3. 实施变更

1. 按照 `tasks.md` 执行实现
2. 更新 `specs/` 中的相应文档
3. 完成后将 change 移动到 `archive/`

## 使用 OpenSpec CLI（可选）

如果安装了 OpenSpec CLI：

```bash
# 查看所有活动变更
openspec list

# 查看变更详情
openspec show <change-name>

# 归档已完成的变更
openspec archive <change-name>
```

## 规范优先原则

**所有代码变更必须先更新 spec，再实施。**

这确保：

- 文档与代码始终同步
- 变更有明确的设计决策追溯
- 团队对产品方向有统一理解
