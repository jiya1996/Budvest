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
├── product-vision.md          # 产品愿景和核心价值
├── requirements/
│   ├── functional-requirements.md
│   └── non-functional-requirements.md
├── architecture/
│   └── spec.md
├── ai-system/
│   └── spec.md
└── database/
    └── spec.md
```

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
