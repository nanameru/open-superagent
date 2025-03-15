# ディープリサーチ・エージェントSDK 設計書

## 目次

1. [概要](#概要)
2. [アーキテクチャ概念](#アーキテクチャ概念)
3. [主要コンポーネント](#主要コンポーネント)
   - [データモデル](#データモデル)
   - [エージェント](#エージェント)
   - [ツール](#ツール)
   - [コンテキスト管理](#コンテキスト管理)
4. [プロセスフロー](#プロセスフロー)
   - [ループ処理の実装](#ループ処理の実装)
5. [実装パターン](#実装パターン)
6. [TypeScriptへの移植ガイド](#typescriptへの移植ガイド)
7. [他言語への移植ガイド](#他言語への移植ガイド)
8. [拡張と統合](#拡張と統合)

## 概要

ディープリサーチ・エージェントSDKは、単一の検索で終わらせるのではなく、検索結果を分析して新たな検索クエリ（サブクエリ）を生成し、それを使って再び検索を行うというプロセスを繰り返すAI検索手法を実装するためのフレームワークです。この連鎖的なプロセスにより、情報の精度と網羅性が向上し、ユーザーが求める深い洞察を得ることができます。

このSDKは、OpenAI Agents SDKをベースに構築されていますが、その概念と設計パターンは他の言語やフレームワークにも適用可能です。

## アーキテクチャ概念

ディープリサーチ・エージェントSDKは、以下の主要な概念に基づいて設計されています：

### 1. エージェント指向アーキテクチャ

システムは複数の専門化されたAIエージェントから構成され、各エージェントは特定のタスク（検索、分析、サブクエリ生成など）に特化しています。これらのエージェントは協調して動作し、複雑な検索プロセスを実行します。

### 2. オーケストレーションパターン

中央のオーケストレーターエージェントが全体のプロセスを制御し、各専門エージェントを適切なタイミングで呼び出します。このパターンにより、複雑なワークフローを管理しつつ、各コンポーネントの疎結合性を保つことができます。

### 3. 状態管理とコンテキスト共有

検索プロセス全体を通じて状態（検索履歴、結果、分析など）を保持し、各エージェント間で共有するためのコンテキスト管理メカニズムを提供します。これにより、エージェント間の情報の一貫性と連続性が確保されます。

### 4. 非同期処理モデル

検索や分析などの時間のかかる操作を効率的に処理するために、非同期処理モデル（Python ではasync/await）を採用しています。これにより、複数の操作を並列に実行することが可能になり、全体のパフォーマンスが向上します。

### 5. 関数型ツールパターン

各エージェントが使用する機能（検索、分析など）は、関数型ツールとして実装されています。これにより、機能の再利用性が高まり、システムの拡張性が向上します。

## 主要コンポーネント

### データモデル

ディープリサーチ・エージェントSDKでは、以下の主要なデータモデルを使用しています：

#### 1. SearchResult

検索結果を構造化するためのモデルで、以下のフィールドを持ちます：
- `query`: 検索クエリ
- `content`: 検索結果のテキスト
- `main_points`: 主要なポイントのリスト
- `subtopics`: サブトピックのリスト
- `reliability`: 情報の信頼性評価

```python
class SearchResult(BaseModel):
    query: str
    content: str
    main_points: List[str]
    subtopics: List[str]
    reliability: str
```

#### 2. AnalysisResult

検索結果の分析結果を構造化するためのモデルで、以下のフィールドを持ちます：
- `main_points`: 主要なポイントのリスト
- `subtopics`: サブトピックのリスト
- `reliability`: 情報の信頼性評価

```python
class AnalysisResult(BaseModel):
    main_points: List[str]
    subtopics: List[str]
    reliability: str
```

#### 3. DeepDiveInput / ParallelDeepDiveInput

深堀り検索の入力を構造化するためのモデルです：
- `subtopic`: 深堀りするサブトピック
- `parent_query`: 親クエリ
- `subtopics`: 並列深堀りの場合の複数サブトピック

```python
class DeepDiveInput(BaseModel):
    subtopic: str
    parent_query: str

class ParallelDeepDiveInput(BaseModel):
    subtopics: List[str]
    parent_query: str
```

#### 4. ReportInput

レポート生成の入力を構造化するためのモデルです：
- `style`: レポートのスタイル（academic, business, journalisticなど）

```python
class ReportInput(BaseModel):
    style: str = "academic"
```

### エージェント

システムは以下の専門化されたエージェントから構成されています：

#### 1. オーケストレーターエージェント

システム全体を制御する中心的なエージェントで、以下の責任を持ちます：
- 初期クエリの処理
- 各専門エージェントの呼び出し
- 検索プロセス全体の管理
- 最終レポートの生成

```python
orchestrator_agent = Agent(
    name="Research Orchestrator",
    instructions="""
    連鎖検索オーケストレーターとして、以下のプロセスを管理してください：
    1. 初期クエリで検索を実行
    2. 検索結果を分析し、得られた情報と不足している情報を特定
    3. 不足情報を補うためのサブクエリを生成
    4. サブクエリで検索を実行
    5. 情報の精度と充実度を評価
    6. 必要に応じてステップ2-5を繰り返す
    7. 十分な情報が得られたら、最終レポートを生成
    """
)
```

#### 2. 検索エージェント

指定されたクエリでウェブ検索を実行するエージェントです：

```python
search_agent = Agent(
    name="Search Agent",
    instructions="""
    指定されたクエリについて詳細なウェブ検索を実行し、以下を含む包括的な結果を返してください：
    1. 最も関連性の高い情報
    2. 複数の信頼できる情報源からの見解
    3. 最新の情報（可能であれば日付を含む）
    4. 異なる視点や意見
    """,
    tools=[WebSearchTool(search_context_size="high")]
)
```

#### 3. 分析エージェント

検索結果を分析し、主要なポイントとサブトピックを抽出するエージェントです：

```python
analysis_agent = Agent(
    name="Analysis Agent",
    instructions="""
    分析エージェントとして、以下を実行してください：
    1. 提供されたコンテンツから主要なポイントを5つ抽出する
    2. さらに調査すべき重要なサブトピックを3つ特定する
    3. 情報の信頼性を評価する（高、中、低）と理由を説明
    4. 結果をJSON形式で返す
    """,
)
```

#### 4. 深堀りエージェント

特定のサブトピックについて詳細な調査を行うエージェントです：

```python
deep_dive_agent = Agent(
    name="Deep Dive Agent",
    instructions="""
    特定のサブトピックについて詳細な調査を行い、元のコンテキストとの関連性を明確にしてください。
    特に以下の点に注目してください：
    1. サブトピックの重要な側面
    2. 最新の発展や研究
    3. 実際の応用例や事例
    4. 異なる見解や論争点
    """,
    tools=[WebSearchTool(search_context_size="high")]
)
```

#### 5. レポート生成エージェント

収集した情報を統合して最終レポートを生成するエージェントです：

```python
report_agent = Agent(
    name="Report Generator",
    instructions="""
    収集した研究データから整形された文章レポートを生成してください。
    以下の構成でレポートを作成します：
    1. エグゼクティブサマリー
    2. 導入（背景と目的）
    3. 方法論（検索プロセスの説明）
    4. 主要な発見（テーマ別に整理）
    5. 分析と考察
    6. 結論と今後の展望
    7. 参考文献（検索クエリを含む）
    """,
)
```

### ツール

各エージェントが使用する機能は、関数型ツールとして実装されています：

#### 1. execute_search

指定されたクエリでウェブ検索を実行するツールです：

```python
@function_tool
async def execute_search(ctx: RunContextWrapper[Dict[str, Any]], query: str) -> str:
    """指定されたクエリでウェブ検索を実行します"""
    # 検索処理の実装
    return search_result
```

#### 2. analyze_content

検索結果を分析し、主要なポイントとサブトピックを抽出するツールです：

```python
@function_tool
async def analyze_content(ctx: RunContextWrapper[Dict[str, Any]], content: str) -> str:
    """検索結果を分析し、重要なポイントとサブトピックを抽出します"""
    # 分析処理の実装
    return analysis_result
```

#### 3. deep_dive_search

特定のサブトピックについて深堀り検索を実行するツールです：

```python
@function_tool
async def deep_dive_search(ctx: RunContextWrapper[Dict[str, Any]], subtopic: str) -> str:
    """特定のサブトピックについて深堀り検索を実行します"""
    # 深堀り検索処理の実装
    return deep_dive_result
```

#### 4. parallel_deep_dive

複数のサブトピックを並列で深堀り検索するツールです：

```python
@function_tool
async def parallel_deep_dive(ctx: RunContextWrapper[Dict[str, Any]], subtopics: List[str]) -> str:
    """複数のサブトピックを並列で深堀り検索します"""
    # 並列深堀り検索処理の実装
    return parallel_deep_dive_result
```

#### 5. generate_research_report

収集した情報を統合して最終レポートを生成するツールです：

```python
@function_tool
async def generate_research_report(ctx: RunContextWrapper[Dict[str, Any]], style: str) -> str:
    """収集した研究データから整形された文章レポートを生成します"""
    # レポート生成処理の実装
    return report
```

### コンテキスト管理

検索プロセス全体を通じて状態を保持し、各エージェント間で共有するためのコンテキスト管理メカニズムを提供します：

```python
def create_research_context(max_depth: int = 3) -> Dict[str, Any]:
    """研究コンテキストを初期化する関数"""
    return {
        "search_history": [],  # 検索履歴
        "results": {},         # 検索結果
        "current_depth": 0,    # 現在の深度
        "max_depth": max_depth, # 最大深度
        "report_sections": {}  # レポートセクション
    }
```

このコンテキストは、各ツール関数に渡され、検索プロセス全体を通じて更新されます。

## プロセスフロー

ディープリサーチ・エージェントSDKの基本的なプロセスフローは以下の通りです：

1. **初期化**
   - 研究コンテキストの作成
   - オーケストレーターエージェントの初期化

2. **初期検索**
   - ユーザーから受け取った初期クエリで検索を実行
   - 検索結果をコンテキストに保存

3. **分析と深堀りポイントの特定**
   - 検索結果を分析し、主要なポイントとサブトピックを抽出
   - 分析結果をコンテキストに保存

4. **深堀り検索**
   - 抽出されたサブトピックについて深堀り検索を実行
   - 深堀り結果をコンテキストに保存
   - 必要に応じて複数のサブトピックを並列で深堀り

5. **反復的な深堀り**
   - 深堀り結果を分析し、新たなサブトピックを抽出
   - 最大深度に達するまで深堀りを繰り返す

6. **レポート生成**
   - 収集したすべての情報を統合して最終レポートを生成
   - レポートをユーザーに返す

このプロセスは、オーケストレーターエージェントによって管理され、各ステップは適切なツール関数を通じて実行されます。

### ループ処理の実装

ディープリサーチ・エージェントSDKの核心となるのは、検索→分析→サブクエリ生成→再検索というループ処理です。このループ処理は以下のように実装されています：

#### 1. ループの制御構造

連鎖検索のループは、以下の条件に基づいて制御されます：

- **最大深度/反復回数**: コンテキストの `max_depth` または `max_iterations` パラメータで指定
- **現在の深度/反復回数**: コンテキストの `current_depth` または `current_iteration` で追跡
- **精度評価**: 収集した情報が十分かどうかの評価

```python
# ループ制御の例
while context["current_depth"] < context["max_depth"]:
    # 深堀り検索を実行
    result = await deep_dive_search(deep_dive_input, context)
    
    # 精度評価
    accuracy = await evaluate_accuracy(context)
    if accuracy.is_sufficient:
        break  # 十分な情報が得られた場合はループを終了
    
    # 次の深度へ
    context["current_depth"] += 1
```

#### 2. 再帰的な深堀り

連鎖検索では、各サブトピックについて再帰的に深堀りを行うことができます：

```python
async def deep_dive_search(deep_dive_input, context):
    # 深度の制限をチェック
    if context["current_depth"] >= context["max_depth"]:
        return "Maximum depth reached"
    
    # 深度を増加
    context["current_depth"] += 1
    
    # 検索を実行
    result = await execute_search(deep_dive_input.subtopic)
    
    # 分析を実行
    analysis = await analyze_content(result)
    
    # 新たなサブトピックについて再帰的に深堀り
    for subtopic in analysis.subtopics:
        await deep_dive_search(DeepDiveInput(subtopic=subtopic), context)
    
    # 深度を元に戻す
    context["current_depth"] -= 1
    
    return result
```

#### 3. 並列処理によるループの最適化

複数のサブトピックを並列に処理することで、ループの効率を向上させることができます：

```python
async def parallel_deep_dive(parallel_input, context):
    # 並列タスクを作成
    tasks = []
    for subtopic in parallel_input.subtopics:
        task = deep_dive_search(DeepDiveInput(subtopic=subtopic), context)
        tasks.append(task)
    
    # 並列実行
    results = await asyncio.gather(*tasks)
    
    return results
```

#### 4. ループの終了条件

連鎖検索のループは、以下の条件のいずれかが満たされた場合に終了します：

- 最大深度/反復回数に達した
- 精度評価で情報が十分と判断された
- 新たなサブトピックが見つからなくなった
- ユーザーが中断した

```python
# 精度評価の例
async def evaluate_accuracy(context):
    # 現在の情報を評価
    evaluation_agent = Agent(
        name="Accuracy Evaluator",
        instructions="""現在の情報の精度と充実度を評価し、さらなる検索が必要かどうかを判断してください。"""
    )
    
    result = await Runner.run(evaluation_agent, json.dumps(context["obtained_info"]))
    
    try:
        evaluation = json.loads(result.final_output)
        return AccuracyEvaluation(
            is_sufficient=evaluation.get("is_sufficient", False),
            reason=evaluation.get("reason", ""),
            iteration=context["current_iteration"],
            max_iterations=context["max_iterations"]
        )
    except:
        return AccuracyEvaluation(
            is_sufficient=False,
            reason="評価エラー",
            iteration=context["current_iteration"],
            max_iterations=context["max_iterations"]
        )
```

#### 5. オーケストレーターによるループの管理

オーケストレーターエージェントは、ループ全体を管理し、各ステップを適切なタイミングで実行します：

```python
async def run_chain_research(query, max_iterations=3):
    # コンテキストを初期化
    context = create_research_context(max_iterations=max_iterations)
    
    # 初期検索
    search_result = await execute_search(query, context)
    
    # ループ処理
    while context["current_iteration"] < context["max_iterations"]:
        # 検索結果を分析
        analysis = await analyze_content(query, search_result, context)
        
        # 精度評価
        accuracy = await evaluate_accuracy(context)
        if accuracy.is_sufficient:
            break  # 十分な情報が得られた場合はループを終了
        
        # サブクエリを生成
        subqueries = await generate_subqueries(context["missing_info"], context)
        
        # サブクエリで検索を実行
        for subquery in subqueries:
            sub_result = await execute_search(subquery.sub_query, context)
            # 結果を分析して統合
            await analyze_content(subquery.sub_query, sub_result, context)
        
        # 反復回数を増加
        context["current_iteration"] += 1
    
    # 最終レポートを生成
    report = await generate_research_report("academic", context)
    
    return report
```

このように、ディープリサーチ・エージェントSDKでは、複数の制御構造とメカニズムを組み合わせて、効果的なループ処理を実現しています。このループ処理により、単一の検索では得られない深い洞察と包括的な情報を収集することができます。

## 実装パターン

ディープリサーチ・エージェントSDKの実装には、以下のパターンが使用されています：

### 1. 関数型ツールパターン

各機能は、`@function_tool`デコレータを使用して関数型ツールとして実装されています。これにより、AIエージェントが関数を直接呼び出すことができます：

```python
@function_tool
async def some_function(ctx: RunContextWrapper[Dict[str, Any]], param: str) -> str:
    """関数の説明"""
    # 実装
    return result
```

### 2. コンテキスト共有パターン

各ツール関数は、共有コンテキストを受け取り、必要に応じて更新します：

```python
async def some_function(param: str, context: Dict[str, Any] = None) -> str:
    # コンテキストが提供されている場合
    if context:
        # コンテキストを更新
        context["some_key"] = some_value
    
    # 処理
    return result
```

### 3. 非同期処理パターン

時間のかかる操作（検索、分析など）は、非同期関数として実装されています：

```python
async def some_async_function():
    # 非同期処理
    result = await some_other_async_function()
    return result
```

### 4. 並列処理パターン

複数の操作を並列に実行するために、`asyncio.gather`を使用しています：

```python
async def parallel_function(items: List[str]):
    tasks = [some_async_function(item) for item in items]
    results = await asyncio.gather(*tasks)
    return results
```

### 5. エラー処理パターン

エラーが発生した場合でも処理を継続するために、try-except構文を使用しています：

```python
try:
    result = json.loads(some_json_string)
except json.JSONDecodeError:
    # エラー時のデフォルト値を設定
    result = default_value
```

## 他言語への移植ガイド

ディープリサーチ・エージェントSDKの概念と設計パターンは、他の言語やフレームワークにも適用可能です。以下に、主要な言語への移植ガイドを示します：

## TypeScriptへの移植ガイド

TypeScriptは静的型付けとモジュール性を備えたJavaScriptのスーパーセットであり、ディープリサーチ・エージェントSDKの実装に適した言語です。静的型システムにより、開発時のエラー検出が容易になり、コードの品質と保守性が向上します。また、モジュールシステムを活用することで、コードの再利用性と拡張性を高めることができます。

以下に、TypeScriptでのディープリサーチ・エージェントSDKの実装ガイドを示します。このガイドでは、特にループ処理（連鎖検索）の実装に焦点を当て、TypeScriptの特性を活かした実装パターンを紹介します。

### データモデル

TypeScriptでのインターフェース定義：

```typescript
// 基本的なデータモデル
interface SearchResult {
  query: string;
  content: string;
  mainPoints: string[];
  subtopics: string[];
  reliability: string;
}

interface AnalysisResult {
  mainPoints: string[];
  subtopics: string[];
  reliability: string;
}

interface DeepDiveInput {
  subtopic: string;
  parentQuery: string;
}

interface ParallelDeepDiveInput {
  subtopics: string[];
  parentQuery: string;
}

interface AccuracyEvaluation {
  isSufficient: boolean;
  reason: string;
  iteration: number;
  maxIterations: number;
}
```

### コンテキスト管理

TypeScriptでのコンテキスト管理：

```typescript
interface ResearchContext {
  searchHistory: string[];
  results: Record<string, SearchResult>;
  currentDepth: number;
  maxDepth: number;
  currentIteration: number;
  maxIterations: number;
  obtainedInfo: Record<string, any>;
  missingInfo: string[];
  reportSections: Record<string, string>;
}

function createResearchContext(maxDepth: number = 3, maxIterations: number = 3): ResearchContext {
  return {
    searchHistory: [],
    results: {},
    currentDepth: 0,
    maxDepth,
    currentIteration: 0,
    maxIterations,
    obtainedInfo: {},
    missingInfo: [],
    reportSections: {}
  };
}
```

### 非同期処理

TypeScriptでの非同期処理：

```typescript
// Async/Await パターン
async function executeSearch(query: string, context?: ResearchContext): Promise<string> {
  // 検索実装
  const searchResult = await fetchSearchResults(query);
  
  // コンテキストが提供されている場合は更新
  if (context) {
    context.searchHistory.push(query);
    context.results[query] = searchResult;
  }
  
  return JSON.stringify(searchResult);
}

// Promise パターン
function analyzeContent(content: string, context?: ResearchContext): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    try {
      // 分析実装
      const analysisResult: AnalysisResult = {
        mainPoints: extractMainPoints(content),
        subtopics: extractSubtopics(content),
        reliability: evaluateReliability(content)
      };
      
      // コンテキスト更新
      if (context) {
        // コンテキストを更新
      }
      
      resolve(analysisResult);
    } catch (error) {
      reject(error);
    }
  });
}
```

### ループ処理の実装

ディープリサーチ・エージェントSDKの核心となる連鎖検索（検索→分析→サブクエリ生成→再検索）のループ処理をTypeScriptで実装する方法を詳しく説明します。

TypeScriptでの実装は、Pythonの実装と概念的には類似していますが、TypeScriptの静的型付け、Promiseベースの非同期処理、モジュールシステムなどの特性を活かした実装が可能です。以下に、実用的なループ処理パターンを示します。

#### 1. ループの制御構造

```typescript
async function runChainResearch(query: string, maxIterations: number = 3): Promise<string> {
  // コンテキストを初期化
  const context = createResearchContext(3, maxIterations);
  
  // 初期検索
  const searchResult = await executeSearch(query, context);
  
  // ループ処理
  while (context.currentIteration < context.maxIterations) {
    // 検索結果を分析
    const analysisResult = await analyzeContent(searchResult, context);
    
    // 精度評価
    const accuracy = await evaluateAccuracy(context);
    if (accuracy.isSufficient) {
      break; // 十分な情報が得られた場合はループを終了
    }
    
    // サブクエリを生成
    const subqueries = await generateSubqueries(context.missingInfo, context);
    
    // サブクエリで検索を実行
    for (const subquery of subqueries) {
      const subResult = await executeSearch(subquery.subQuery, context);
      // 結果を分析して統合
      await analyzeContent(subResult, context);
    }
    
    // 反復回数を増加
    context.currentIteration++;
  }
  
  // 最終レポートを生成
  const report = await generateResearchReport("academic", context);
  
  return report;
}
```

#### 2. 再帰的な深堀り

TypeScriptでの再帰的な深堀り実装：

```typescript
async function deepDiveSearch(input: DeepDiveInput, context: ResearchContext): Promise<string> {
  // 深度の制限をチェック
  if (context.currentDepth >= context.maxDepth) {
    return "Maximum depth reached";
  }
  
  // 深度を増加
  context.currentDepth++;
  
  try {
    // 検索を実行
    const result = await executeSearch(input.subtopic, context);
    
    // 分析を実行
    const analysis = await analyzeContent(result, context);
    
    // 新たなサブトピックについて再帰的に深堀り
    const deepDivePromises = analysis.subtopics.map(subtopic => 
      deepDiveSearch({ subtopic, parentQuery: input.subtopic }, context)
    );
    
    // 並列実行（オプション）
    await Promise.all(deepDivePromises);
    
    return result;
  } finally {
    // 深度を元に戻す（try-finallyで確実に実行）
    context.currentDepth--;
  }
}
```

#### 3. 並列処理によるループの最適化

TypeScriptでの並列処理実装：

```typescript
async function parallelDeepDive(input: ParallelDeepDiveInput, context: ResearchContext): Promise<string[]> {
  // 並列タスクを作成
  const tasks = input.subtopics.map(subtopic => 
    deepDiveSearch({ subtopic, parentQuery: input.parentQuery }, context)
  );
  
  // 並列実行
  const results = await Promise.all(tasks);
  
  return results;
}
```

#### 4. ループの終了条件と精度評価

TypeScriptでの精度評価実装：

```typescript
async function evaluateAccuracy(context: ResearchContext): Promise<AccuracyEvaluation> {
  try {
    // APIを使用して現在の情報を評価
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "現在の情報の精度と充実度を評価し、さらなる検索が必要かどうかを判断してください。"
          },
          {
            role: "user",
            content: JSON.stringify(context.obtainedInfo)
          }
        ],
        temperature: 0.7
      })
    });
    
    const data = await response.json();
    const evaluationText = data.choices[0].message.content;
    
    // 評価結果をパース
    try {
      const evaluation = JSON.parse(evaluationText);
      return {
        isSufficient: evaluation.is_sufficient || false,
        reason: evaluation.reason || "",
        iteration: context.currentIteration,
        maxIterations: context.maxIterations
      };
    } catch (parseError) {
      // JSONパースエラー処理
      console.error("評価結果のパースに失敗しました:", parseError);
      return {
        isSufficient: false,
        reason: "評価結果のパースエラー",
        iteration: context.currentIteration,
        maxIterations: context.maxIterations
      };
    }
  } catch (error) {
    // API呼び出しエラー処理
    console.error("精度評価中にエラーが発生しました:", error);
    return {
      isSufficient: false,
      reason: "評価エラー",
      iteration: context.currentIteration,
      maxIterations: context.maxIterations
    };
  }
}
```

#### 5. エラー処理とリトライメカニズム

TypeScriptでの非同期操作のエラー処理とリトライ実装：

```typescript
async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`操作に失敗しました (${attempt + 1}/${maxRetries}):`, error);
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        // 指数バックオフ遅延
        const backoffDelay = delay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError || new Error("不明なエラーが発生しました");
}

// 使用例
async function reliableSearch(query: string, context?: ResearchContext): Promise<string> {
  return executeWithRetry(() => executeSearch(query, context));
}
```

### モジュール構造

TypeScriptでの推奨モジュール構造：

```plaintext
src/
├── models/
│   ├── index.ts              # モデルのエクスポート
│   ├── searchModels.ts       # 検索関連のインターフェース
│   └── contextModels.ts      # コンテキスト関連のインターフェース
├── agents/
│   ├── index.ts              # エージェントのエクスポート
│   ├── orchestrator.ts       # オーケストレーターエージェント
│   ├── searchAgent.ts        # 検索エージェント
│   └── analysisAgent.ts      # 分析エージェント
├── tools/
│   ├── index.ts              # ツールのエクスポート
│   ├── searchTools.ts        # 検索関連のツール
│   └── analysisTools.ts      # 分析関連のツール
├── services/
│   ├── index.ts              # サービスのエクスポート
│   ├── openaiService.ts      # OpenAI API連携
│   └── searchService.ts      # 検索サービス連携
├── utils/
│   ├── index.ts              # ユーティリティのエクスポート
│   ├── contextUtils.ts       # コンテキスト管理ユーティリティ
│   └── asyncUtils.ts         # 非同期処理ユーティリティ
└── index.ts                  # メインエントリポイント
```

### Java

#### データモデル

Javaでのクラス定義：

```java
public class SearchResult {
    private String query;
    private String content;
    private List<String> mainPoints;
    private List<String> subtopics;
    private String reliability;
    
    // コンストラクタ、ゲッター、セッター
}

public class AnalysisResult {
    private List<String> mainPoints;
    private List<String> subtopics;
    private String reliability;
    
    // コンストラクタ、ゲッター、セッター
}
```

#### 非同期処理

Javaでの非同期処理（CompletableFuture）：

```java
public CompletableFuture<String> executeSearch(String query) {
    return CompletableFuture.supplyAsync(() -> {
        // 実装
        return searchResult;
    });
}
```

#### コンテキスト管理

Javaでのコンテキスト管理：

```java
public class ResearchContext {
    private List<String> searchHistory;
    private Map<String, SearchResult> results;
    private int currentDepth;
    private int maxDepth;
    private Map<String, String> reportSections;
    
    // コンストラクタ、ゲッター、セッター
}

public static ResearchContext createResearchContext(int maxDepth) {
    ResearchContext context = new ResearchContext();
    context.setSearchHistory(new ArrayList<>());
    context.setResults(new HashMap<>());
    context.setCurrentDepth(0);
    context.setMaxDepth(maxDepth);
    context.setReportSections(new HashMap<>());
    return context;
}
```

### C#

#### データモデル

C#でのクラス定義：

```csharp
public class SearchResult
{
    public string Query { get; set; }
    public string Content { get; set; }
    public List<string> MainPoints { get; set; }
    public List<string> Subtopics { get; set; }
    public string Reliability { get; set; }
}

public class AnalysisResult
{
    public List<string> MainPoints { get; set; }
    public List<string> Subtopics { get; set; }
    public string Reliability { get; set; }
}
```

#### 非同期処理

C#での非同期処理（Task）：

```csharp
public async Task<string> ExecuteSearchAsync(string query)
{
    // 実装
    return await Task.FromResult(searchResult);
}
```

#### コンテキスト管理

C#でのコンテキスト管理：

```csharp
public class ResearchContext
{
    public List<string> SearchHistory { get; set; }
    public Dictionary<string, SearchResult> Results { get; set; }
    public int CurrentDepth { get; set; }
    public int MaxDepth { get; set; }
    public Dictionary<string, string> ReportSections { get; set; }
}

public static ResearchContext CreateResearchContext(int maxDepth = 3)
{
    return new ResearchContext
    {
        SearchHistory = new List<string>(),
        Results = new Dictionary<string, SearchResult>(),
        CurrentDepth = 0,
        MaxDepth = maxDepth,
        ReportSections = new Dictionary<string, string>()
    };
}
```

### Go

#### データモデル

Goでの構造体定義：

```go
type SearchResult struct {
    Query       string
    Content     string
    MainPoints  []string
    Subtopics   []string
    Reliability string
}

type AnalysisResult struct {
    MainPoints  []string
    Subtopics   []string
    Reliability string
}
```

#### 非同期処理

Goでの非同期処理（goroutine）：

```go
func executeSearch(query string) chan string {
    resultChan := make(chan string)
    
    go func() {
        // 実装
        resultChan <- searchResult
    }()
    
    return resultChan
}
```

#### コンテキスト管理

Goでのコンテキスト管理：

```go
type ResearchContext struct {
    SearchHistory  []string
    Results        map[string]SearchResult
    CurrentDepth   int
    MaxDepth       int
    ReportSections map[string]string
}

func CreateResearchContext(maxDepth int) ResearchContext {
    return ResearchContext{
        SearchHistory:  []string{},
        Results:        make(map[string]SearchResult),
        CurrentDepth:   0,
        MaxDepth:       maxDepth,
        ReportSections: make(map[string]string),
    }
}
```

## 拡張と統合

ディープリサーチ・エージェントSDKは、以下の方法で拡張および統合することができます：

### 1. 新しいエージェントの追加

特定のドメインや特殊なタスクに対応するための新しいエージェントを追加することができます：

```python
domain_specific_agent = Agent(
    name="Domain Specific Agent",
    instructions="""
    特定のドメインに関する専門的な分析を行ってください。
    """,
)
```

### 2. 新しいツールの追加

新しい機能を提供するためのツールを追加することができます：

```python
@function_tool
async def new_tool_function(ctx: RunContextWrapper[Dict[str, Any]], param: str) -> str:
    """新しいツールの説明"""
    # 実装
    return result
```

### 3. 外部APIとの統合

外部APIと統合して、追加の情報源やサービスを利用することができます：

```python
@function_tool
async def call_external_api(ctx: RunContextWrapper[Dict[str, Any]], param: str) -> str:
    """外部APIを呼び出す"""
    # 外部APIの呼び出し
    response = requests.get(f"https://api.example.com/endpoint?param={param}")
    return response.json()
```

### 4. データベースとの統合

検索結果や分析結果をデータベースに保存して、後で利用することができます：

```python
@function_tool
async def save_to_database(ctx: RunContextWrapper[Dict[str, Any]], data: Dict[str, Any]) -> str:
    """データをデータベースに保存する"""
    # データベースへの保存処理
    db.insert(data)
    return "保存完了"
```

### 5. ウェブインターフェースとの統合

ウェブインターフェースを通じて、ユーザーが検索プロセスを制御したり、結果を閲覧したりできるようにすることができます：

```python
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    data = request.json
    query = data.get('query', '')
    # 検索処理
    return jsonify({"result": result})
```

これらの拡張と統合により、ディープリサーチ・エージェントSDKをさまざまなユースケースや環境に適応させることができます。
