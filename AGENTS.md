# AI Agent 智能BI创作编辑器

## 项目概览

AI驱动的智能BI大屏创作编辑器，支持通过自然语言对话生成数据大屏、拖拽编辑组件、模板匹配、3D场景等功能。

## 版本技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4
- **状态管理**: Zustand
- **图表库**: ECharts (echarts-for-react)
- **AI**: coze-coding-dev-sdk (LLM 流式对话)

## 目录结构

```
├── src/
│   ├── app/
│   │   ├── api/chat/route.ts       # AI对话SSE流式API
│   │   ├── page.tsx                # 首页入口
│   │   ├── editor-page.tsx         # 编辑器客户端组件
│   │   ├── layout.tsx              # 根布局（暗色模式）
│   │   └── globals.css             # 全局样式
│   ├── components/
│   │   ├── editor/
│   │   │   ├── EditorLayout.tsx    # 编辑器整体布局
│   │   │   ├── TopToolbar.tsx      # 顶部工具栏
│   │   │   ├── LeftSidebar.tsx     # 左侧导航（组件库/数据源/模板/图层）
│   │   │   ├── Canvas.tsx          # 中央画布（组件拖拽/选中/缩放）
│   │   │   ├── RightSidebar.tsx    # 右侧面板（属性/AI对话/动画）
│   │   │   ├── BottomStatusBar.tsx # 底部状态栏
│   │   │   └── DynamicIcon.tsx     # 动态图标加载
│   │   ├── ui/                     # shadcn/ui 组件
│   │   └── charts/                 # 图表组件
│   ├── stores/
│   │   └── editor-store.ts         # Zustand 状态管理
│   ├── types/
│   │   └── editor.ts               # 类型定义
│   └── lib/
│       ├── utils.ts                # 工具函数
│       ├── component-library.ts    # 组件库定义
│       ├── chart-config.ts         # ECharts配置生成
│       └── templates.ts           # 模板定义
```

## 构建和测试命令

- 开发：`coze dev`
- 构建：`pnpm build`
- 类型检查：`pnpm ts-check`
- 代码规范：`pnpm lint`
- 启动：`coze start`

## 编码规范

- 仅使用 pnpm，禁止 npm/yarn
- TypeScript strict 模式，禁止隐式 any
- 组件使用 'use client' 标注客户端组件
- 禁止在 JSX 中直接使用 typeof window/Date.now()/Math.random()
- 使用 Zustand 管理全局状态
- ECharts 通过 echarts-for-react 封装
- AI 对话使用 SSE 流式输出，前端用 Reader 增量渲染

## 核心交互

- 用户通过右侧AI对话面板发送指令 → 后端 LLM 解析 → 返回 DSL 指令
- 前端解析 DSL 指令，自动在画布上创建/修改组件
- 支持拖拽组件到画布、选中组件后通过 AI 调整属性
- 支持撤销/重做（最多50步）
- 支持模板一键应用
