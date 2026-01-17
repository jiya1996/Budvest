---
name: Product PRD Generator
description: A skill to generate comprehensive Product Requirement Documents (PRD) and User Stories.
---
# Product PRD Generator Skill

此 Skill 旨在帮助生成标准化、高质量的产品需求文档 (PRD) 和用户故事，确保产品开发方向清晰、需求明确。

## 核心功能

1. **PRD 生成**: 基于模糊的想法或简单的描述，生成结构化的 PRD。
2. **用户故事编写**: 将功能点拆解为标准的 "As a... I want to... So that..." 用户故事。
3. **功能优先级排序**: 使用 MoSCoW (Must, Should, Could, Won't) 方法对需求进行排序。
4. **验收标准定义**: 为每个功能定义清晰的验收标准 (Acceptance Criteria)。

## PRD 模板结构

生成 PRD 时，请遵循以下核心结构：

### 1. 文档元数据
- 版本号、日期、作者、状态 (Draft/Review/Approved)

### 2. 项目背景与目标
- **背景**: 为什么要做这个功能/产品？解决了什么问题？
- **目标**: 预期的商业价值或用户价值是什么？
- **成功指标 (KPIs)**: 如何衡量成功？

### 3. 用户角色 (Personas)
- 描述核心用户群体及其特征。

### 4. 核心流程 (User Flow)
- 使用 Mermaid 流程图描述用户操作路径。

### 5. 功能需求 (Functional Requirements)
- 按模块拆分功能点，每个功能点包含：
  - **ID**: 唯一标识符 (如 FEAT-01)
  - **标题**: 简短描述
  - **描述**: 详细行为逻辑
  - **前置条件**: 功能触发的条件
  - **验收标准**: 测试通过的标准

### 6. 非功能需求 (Non-Functional Requirements)
- 性能、安全性、兼容性、可访问性等要求。

### 7. 数据埋点 (可选)
- 关键事件追踪定义。

## 使用指南

### 场景 1: 从想法到 PRD
**Prompt**: "我有一个想法，想做一个针对小白用户的股票投资教育 App，请帮我生成一份 MVP 版本的 PRD，核心功能包括 AI 问答和模拟持仓。"

### 场景 2: 编写用户故事
**Prompt**: "请将 '用户需要记录他们的投资情绪' 这一需求拆解为具体的用户故事，并包含验收标准。"

### 场景 3: 需求评审检查
**Prompt**: "请帮我检查这份 PRD (提供内容)，指出逻辑漏洞、缺失的边缘情况或不清晰的描述。"
