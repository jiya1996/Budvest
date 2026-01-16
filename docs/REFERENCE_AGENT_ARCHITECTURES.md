# 三个开源项目 Agent 架构对比分析

## 一、架构总览对比

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        三种架构模式对比                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【ai-hedge-fund】              【finagents】              【mentoragents】       │
│  ================              ============              ===============       │
│                                                                                 │
│  ┌─────────────┐              ┌─────────────┐           ┌─────────────┐        │
│  │  用户输入   │              │  用户输入   │           │  用户对话   │        │
│  └──────┬──────┘              └──────┬──────┘           └──────┬──────┘        │
│         │                            │                         │               │
│         ▼                            ▼                         ▼               │
│  ┌─────────────┐              ┌─────────────┐           ┌─────────────┐        │
│  │ START_NODE  │              │ Analyst Team│           │ 对话节点    │        │
│  └──────┬──────┘              │ (5人并行)   │           └──────┬──────┘        │
│         │                     └──────┬──────┘                  │               │
│    ┌────┴────┐                       │                   ┌─────┴─────┐         │
│    │ 并行分发 │                       ▼                   │ 需要工具?  │         │
│    └────┬────┘                ┌─────────────┐           └─────┬─────┘         │
│ ┌───┬───┼───┬───┐             │Investor Team│                 │               │
│ │   │   │   │   │             │ (5人并行)   │           ┌─────┴─────┐         │
│ ▼   ▼   ▼   ▼   ▼             └──────┬──────┘           ▼           ▼         │
│┌───┐┌───┐┌───┐┌───┐                  │           ┌──────────┐  ┌─────┐       │
││巴 ││芒 ││林 ││... │                  ▼           │RAG检索   │  │继续 │       │
││菲 ││格 ││奇 ││17个│           ┌─────────────┐   │上下文    │  │对话 │       │
││特 ││  ││  ││Agent│           │ Synthesis   │   └────┬─────┘  └─────┘       │
│└─┬─┘└─┬─┘└─┬─┘└─┬──┘           │ (LLM主持人) │        │                       │
│  │    │    │    │              └──────┬──────┘        ▼                       │
│  └────┴────┴────┘                     │         ┌──────────┐                  │
│         │                             ▼         │总结上下文│                  │
│         ▼                      ┌─────────────┐  └────┬─────┘                  │
│  ┌─────────────┐               │  最终决策   │       │                        │
│  │ Risk Manager│               │ BUY/HOLD/  │       ▼                        │
│  └──────┬──────┘               │   SELL     │  ┌──────────┐                  │
│         │                      └─────────────┘  │ 对话节点 │                  │
│         ▼                                       └────┬─────┘                  │
│  ┌─────────────┐                                     │                        │
│  │ Portfolio   │                               ┌─────┴─────┐                  │
│  │ Manager     │                               │ 需要总结?  │                  │
│  └──────┬──────┘                               └─────┬─────┘                  │
│         │                                            │                        │
│         ▼                                            ▼                        │
│  ┌─────────────┐                               ┌──────────┐                  │
│  │  交易决策   │                               │总结对话  │                  │
│  │ (仓位/方向) │                               │(长期记忆)│                  │
│  └─────────────┘                               └──────────┘                  │
│                                                                                 │
│  模式：并行分析 → 级联决策        模式：分层辩论 → 综合         模式：对话驱动 → RAG增强   │
│  框架：LangGraph StateGraph       框架：ThreadPoolExecutor    框架：LangGraph StateGraph  │
│  特点：17个大师Agent              特点：三层辩论架构           特点：对话式+工具调用        │
│       定量分析 + LLM推理               投资者人设明确              动态上下文检索           │
│       风险管理层                       意见综合机制               对话记忆管理             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、ai-hedge-fund 详细架构

### 2.1 核心设计理念

```
定量分析 (Python函数) + 定性推理 (LLM) = 投资决策
```

### 2.2 状态管理 (State)

```python
# src/graph/state.py
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]  # 消息累加
    data: Annotated[dict[str, any], merge_dicts]              # 数据合并
    metadata: Annotated[dict[str, any], merge_dicts]          # 元数据合并

# 状态流转示意
state = {
    "data": {
        "tickers": ["AAPL", "MSFT"],
        "portfolio": {...},
        "analyst_signals": {
            "warren_buffett_agent": {"AAPL": {"signal": "bullish", "confidence": 85}},
            "charlie_munger_agent": {"AAPL": {"signal": "bullish", "confidence": 78}},
            # ... 所有Agent信号聚合
        }
    },
    "metadata": {"show_reasoning": True, "model_name": "gpt-4"}
}
```

### 2.3 工作流编排

```python
# src/main.py
def create_workflow(selected_analysts=None):
    workflow = StateGraph(AgentState)

    # 1. 添加起始节点
    workflow.add_node("start_node", start)

    # 2. 动态添加分析师节点（支持选择性启用）
    for analyst_key in selected_analysts:
        node_name, node_func = analyst_nodes[analyst_key]
        workflow.add_node(node_name, node_func)
        workflow.add_edge("start_node", node_name)  # 并行边

    # 3. 添加管理层节点
    workflow.add_node("risk_management_agent", risk_management_agent)
    workflow.add_node("portfolio_manager", portfolio_management_agent)

    # 4. 连接边：Analysts → Risk → Portfolio
    for analyst_key in selected_analysts:
        workflow.add_edge(analyst_key + "_agent", "risk_management_agent")
    workflow.add_edge("risk_management_agent", "portfolio_manager")
    workflow.add_edge("portfolio_manager", END)

    return workflow
```

### 2.4 单个 Agent 设计模式 (Warren Buffett 示例)

```python
# src/agents/warren_buffett.py

# 1. 输出结构定义 (Pydantic)
class WarrenBuffettSignal(BaseModel):
    signal: Literal["bullish", "bearish", "neutral"]
    confidence: int = Field(description="Confidence 0-100")
    reasoning: str

# 2. Agent 主函数
def warren_buffett_agent(state: AgentState, agent_id: str):
    for ticker in state["data"]["tickers"]:
        # ============ 数据获取层 ============
        metrics = get_financial_metrics(ticker, ...)
        financial_items = search_line_items(ticker, [...], ...)
        market_cap = get_market_cap(ticker, ...)

        # ============ 定量分析层（多维度独立函数）============
        fundamental = analyze_fundamentals(metrics)      # ROE/债务/利润率
        consistency = analyze_consistency(items)         # 收益稳定性
        moat = analyze_moat(metrics)                    # 护城河评分
        pricing_power = analyze_pricing_power(items)    # 定价权
        book_value = analyze_book_value_growth(items)   # 账面价值
        management = analyze_management_quality(items)  # 管理层质量
        intrinsic = calculate_intrinsic_value(items)    # DCF估值

        # ============ 综合评分 ============
        total_score = (
            fundamental["score"] +
            consistency["score"] +
            moat["score"] +
            management["score"] +
            pricing_power["score"] +
            book_value["score"]
        )

        # 安全边际计算
        margin_of_safety = (intrinsic_value - market_cap) / market_cap

        # ============ LLM 推理层 ============
        output = generate_buffett_output(
            ticker=ticker,
            analysis_data={...},  # 所有定量结果
            state=state
        )

    # 写入状态
    state["data"]["analyst_signals"][agent_id] = buffett_analysis
    return {"messages": [...], "data": state["data"]}

# 3. LLM Prompt 设计
template = ChatPromptTemplate.from_messages([
    ("system", """You are Warren Buffett.

Checklist for decision:
- Circle of competence
- Competitive moat
- Management quality
- Financial strength
- Valuation vs intrinsic value

Signal rules:
- Bullish: strong business AND margin_of_safety > 0
- Bearish: poor business OR clearly overvalued
- Neutral: good business but margin_of_safety <= 0

Confidence scale:
- 90-100%: Exceptional business within my circle
- 70-89%: Good business with decent moat
- 50-69%: Mixed signals
- 30-49%: Outside expertise
- 10-29%: Poor business

Return JSON only."""),
    ("human", """Ticker: {ticker}
Facts:
{facts}

Return: {"signal": "...", "confidence": N, "reasoning": "..."}""")
])
```

### 2.5 所有 Agent 清单

| Agent | 投资风格 | 核心分析维度 |
|-------|---------|-------------|
| Warren Buffett | 价值投资 | 护城河、管理层、内在价值、安全边际 |
| Charlie Munger | 理性思维 | 商誉强度、可预测性、质量优先 |
| Ben Graham | 深度价值 | NCAV、Graham数字、安全边际 |
| Michael Burry | 逆向投资 | FCF收益率、反向情绪、资产负债表 |
| Peter Lynch | GARP | PEG比率、十倍股潜力、可理解业务 |
| Cathie Wood | 破坏性创新 | R&D强度、颠覆性指标、增长加速 |
| Stanley Druckenmiller | 宏观投资 | 动量、风险收益比、宏观趋势 |
| Aswath Damodaran | 估值专家 | DCF、相对估值、风险调整 |
| Bill Ackman | 激进主义 | 战略价值、管理变革潜力 |
| Phil Fisher | Scuttlebutt | 管理访谈、产品创新、长期增长 |
| Rakesh Jhunjhunwala | 新兴市场 | 宏观洞察、高增长行业 |
| Mohnish Pabrai | 复制策略 | 安全边际、简单业务 |
| Technical Analyst | 技术分析 | 图表模式、价格行为 |
| Fundamentals Analyst | 基本面 | 财务报表深度分析 |
| Growth Analyst | 增长分析 | 增长趋势、估值合理性 |
| News Sentiment | 新闻情绪 | 新闻情感分析 |
| Sentiment Analyst | 市场情绪 | 投资者行为分析 |

---

## 三、finagents 详细架构

### 3.1 核心设计理念

```
分层辩论：Analysts(数据分析) → Investors(投资判断) → Synthesis(综合决策)
```

### 3.2 三层辩论架构

```python
# src/agents/debate_manager.py

class DebateManager:
    def __init__(self, investor_team, analyst_team):
        self.investor_team = investor_team   # 5个投资者
        self.analyst_team = analyst_team     # 5个分析师

    def run_debate(self, tickers, stock_data):
        for ticker in tickers:
            # 第1层：分析师并行分析
            analyst_reports = self.get_analyst_reports(ticker, stock_data)

            # 第2层：投资者基于分析师报告给意见
            investor_opinions = self.get_investor_opinions(
                ticker, stock_data, analyst_reports
            )

            # 第3层：LLM主持人综合意见
            decision = self.synthesize_decision(ticker, investor_opinions)

        return results
```

### 3.3 并行执行机制

```python
def get_analyst_reports(self, ticker, stock_data):
    """并行获取所有分析师报告"""
    with ThreadPoolExecutor(max_workers=len(self.analyst_team)) as executor:
        future_to_analyst = {
            executor.submit(get_report, (name, agent)): name
            for name, agent in self.analyst_team.items()
        }
        for future in concurrent.futures.as_completed(future_to_analyst):
            name, report = future.result()
            analyst_reports[name] = report
    return analyst_reports

def get_investor_opinions(self, ticker, stock_data, analyst_reports):
    """投资者并行分析（基于分析师报告）"""
    with ThreadPoolExecutor(max_workers=len(self.investor_team)) as executor:
        # 每个投资者都能看到所有分析师报告
        # 并行收集各投资者意见
```

### 3.4 投资者人设定义

```python
# src/agents/investor_agents.py

INVESTOR_PERSONAS = {
    "Warren Buffett": {
        "philosophy": "Value investing with focus on long-term potential...",
        "risk_profile": "Conservative, prefers established companies",
        "famous_quotes": [
            "Price is what you pay. Value is what you get.",
            "Our favorite holding period is forever.",
        ]
    },
    "Ray Dalio": {
        "philosophy": "Macro investing, diversification, risk parity",
        "risk_profile": "Balanced, emphasis on diversification",
        ...
    },
    "Cathie Wood": {...},
    "Peter Lynch": {...},
    "Michael Burry": {...},
}

def create_investor_prompt(persona_name, persona_data):
    """为每个投资者创建专属 Prompt"""
    return ChatPromptTemplate.from_messages([
        ("system", f"""You are {persona_name}, the famous investor.
Investment Philosophy: {persona_data['philosophy']}
Risk Profile: {persona_data['risk_profile']}

Famous Quotes:
{quotes}

Analyze using your unique investment approach.
Make a clear recommendation: BUY, HOLD, or SELL.
"""),
        ("human", """
Stock: {ticker}
Stock Info: {stock_info}
Market Context: {market_context}
Analyst Reports: {analyst_reports}

Would you invest? Provide reasoning.
""")
    ])
```

### 3.5 综合决策机制

```python
# Synthesis Prompt
synthesis_prompt = """You are a debate moderator.

Synthesize diverse investor opinions:
1. Summary of Investor Opinions
2. Areas of Agreement
3. Areas of Disagreement
4. Key Decision Factors
5. Final Recommendation: [BUY/HOLD/SELL]
6. Confidence Level: [HIGH/MEDIUM/LOW]
7. Key Risks and Considerations

Investor Opinions:
{investor_opinions}
"""
```

---

## 四、mentoragents 详细架构

### 4.1 核心设计理念

```
对话驱动 + RAG增强 + 长期记忆
```

### 4.2 工作流图

```python
# workflow/graph.py

class MentorGraph:
    def build(self):
        # 添加节点
        self.graph_builder.add_node("conversation_node", ...)
        self.graph_builder.add_node("retrieve_context_node", ...)
        self.graph_builder.add_node("summarize_context_node", ...)
        self.graph_builder.add_node("summarize_conversations_node", ...)
        self.graph_builder.add_node("connector_node", ...)

        # 定义流程
        self.graph_builder.add_edge(START, "conversation_node")

        # 条件分支：需要工具时走 RAG
        self.graph_builder.add_conditional_edges(
            "conversation_node",
            tools_condition,  # 内置条件函数
            {
                "tools": "retrieve_context_node",  # 需要检索
                END: "connector_node",             # 直接结束
            }
        )

        # RAG 链路
        self.graph_builder.add_edge("retrieve_context_node", "summarize_context_node")
        self.graph_builder.add_edge("summarize_context_node", "conversation_node")

        # 对话总结（长期记忆）
        self.graph_builder.add_conditional_edges(
            "connector_node",
            should_summarize_conversation,
            {
                "summarize_conversations_node": "summarize_conversations_node",
                END: END,
            }
        )
```

### 4.3 节点实现

```python
# workflow/nodes.py

class Nodes:
    async def conversation_node(self, state, config):
        """核心对话节点"""
        response = await self.chains.get_mentor_response_chain().ainvoke({
            "messages": state["messages"],
            "summary": state.get("summary", ""),       # 历史总结
            "mentor_name": state["mentor_name"],       # 导师名称
            "mentor_expertise": state["mentor_expertise"],
            "mentor_perspective": state["mentor_perspective"],
            "mentor_style": state["mentor_style"],
        })
        state["messages"].append(response)
        return state

    async def retrieve_context_node(self, state):
        """RAG 检索节点"""
        return ToolNode(self.tools)

    async def summarize_context_node(self, state):
        """总结检索到的上下文"""
        response = await self.chains.get_context_summary_chain().ainvoke({
            "context": state["messages"][-1].content,
        })
        state["messages"][-1].content = response.content
        return state

    async def summarize_conversations_node(self, state):
        """对话总结（压缩长期记忆）"""
        summary_chain = self.chains.get_conversations_summary_chain()
        response = await summary_chain.ainvoke({
            "messages": state["messages"],
            "summary": state.get("summary", "")
        })

        # 删除旧消息，保留摘要
        delete_messages = [
            RemoveMessage(id=m.id)
            for m in state["messages"][:-TOTAL_MESSAGES_AFTER_SUMMARY]
        ]
        state["messages"] = delete_messages
        state["summary"] = response.content
        return state
```

---

## 五、架构对比总结

| 维度 | ai-hedge-fund | finagents | mentoragents |
|-----|---------------|-----------|--------------|
| **定位** | 交易决策系统 | 投资辩论系统 | 对话式导师 |
| **架构模式** | 并行分析 → 级联决策 | 分层辩论 → 综合 | 对话驱动 → RAG增强 |
| **Agent数量** | 17个专业Agent | 5分析师+5投资者 | 1个导师Agent |
| **工作流框架** | LangGraph StateGraph | ThreadPoolExecutor | LangGraph StateGraph |
| **并行方式** | 图的并行边 | 线程池 | 异步等待 |
| **数据来源** | Financial Datasets API | Stock Data API | RAG知识库 |
| **决策机制** | 信号聚合 → 风险调整 → 仓位 | 辩论综合 → 投票 | 对话引导 |
| **记忆系统** | 无（批处理） | 无（批处理） | 对话总结（长期记忆） |
| **人设一致性** | 强（定量规则+Prompt约束） | 中（Prompt约束） | 强（多维度人设） |
| **输出结构** | Pydantic 强类型 | 文本格式 | 对话式 |

---

## 六、设计模式精华提炼

### 模式1：定量分析与定性推理分离 (ai-hedge-fund)

```python
# 定量层（Python函数，可测试）
score = (
    analyze_moat(metrics)["score"] * 0.35 +
    analyze_management(items)["score"] * 0.25 +
    analyze_valuation(items)["score"] * 0.40
)

# 定性层（LLM推理，基于数据事实）
output = llm.invoke({
    "facts": {"score": score, "details": {...}},
    "signal_rules": {...}
})
```

### 模式2：信号聚合与级联决策 (ai-hedge-fund)

```python
# 所有 Agent 信号聚合
analyst_signals = {
    "buffett": {"signal": "bullish", "confidence": 85},
    "munger": {"signal": "bullish", "confidence": 78},
    "burry": {"signal": "neutral", "confidence": 55},
}

# Risk Manager 基于聚合信号调整
position_size = adjust_for_risk(signals, portfolio)

# Portfolio Manager 生成最终指令
decision = generate_order(position_size, constraints)
```

### 模式3：分层辩论与综合 (finagents)

```python
# Layer 1: 分析师出数据报告
analyst_reports = parallel_analyze(stock_data)

# Layer 2: 投资者基于报告发表意见
investor_opinions = parallel_debate(analyst_reports)

# Layer 3: LLM主持人综合
final = synthesize(investor_opinions)
```

### 模式4：对话记忆压缩 (mentoragents)

```python
# 当对话过长时压缩
if len(messages) > THRESHOLD:
    summary = llm.summarize(messages[:-N])
    messages = [summary] + messages[-N:]
```

### 模式5：人设一致性保障

```python
# Prompt 中嵌入决策规则
signal_rules = {
    "bullish": "condition A AND condition B",
    "bearish": "condition C OR condition D",
}

confidence_limits = {
    "bullish": {"min": 50, "max": 100},
    "neutral": {"min": 30, "max": 69},
}
```

---

## 七、对伴投项目的适用性分析

### 你的项目特点

1. **面向个人投资者**：情绪安抚 > 交易决策
2. **对话式交互**：实时对话 > 批量分析
3. **7个大师人设**：已有 Prompt 定义
4. **A股市场数据**：已集成 AkShare

### 推荐采用的设计

| 模块 | 推荐参考 | 理由 |
|------|---------|------|
| **工作流编排** | ai-hedge-fund 的 LangGraph | 成熟稳定，支持并行和条件分支 |
| **人设设计** | ai-hedge-fund 的 Agent 模式 | 定量+定性分离，人设一致性强 |
| **对话记忆** | mentoragents 的记忆压缩 | 适合长对话场景 |
| **辩论综合** | finagents 的 Synthesis | 可选：多大师综合意见 |
| **数据查询** | ai-hedge-fund 的 Tools 模式 | 标准化的工具定义 |

### 建议的混合架构

```
用户对话
    ↓
┌──────────────────────────────────────────────────┐
│              意图分类 (Intent Router)             │
└──────────────────────────────────────────────────┘
    │
    ├─── 情绪安抚 ─────→ 直接对话 + RAG知识库
    │
    ├─── 数据查询 ─────→ 工具调用 (股价/资金流向)
    │
    └─── 投资分析 ─────→ 多大师并行分析
                              │
                        ┌─────┴─────┐
                        ▼           ▼
                    大师1分析    大师2分析
                        │           │
                        └─────┬─────┘
                              │
                        ┌─────┴─────┐
                        │ 意见综合  │
                        │(可选辩论) │
                        └─────┬─────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ 反思优化    │
                        └─────────────┘
                              │
                              ▼
                        ┌─────────────┐
                        │ 记忆更新    │
                        │(对话压缩)   │
                        └─────────────┘
                              │
                              ▼
                          最终回复
```

这个混合架构结合了三个项目的优点，适合你的"投资陪伴"场景。
