'use client';

/**
 * 组件素材生成智能体 — 独立 Agent 面板
 *
 * 完整的演示流程：
 *   用户输入 → 意图解析 → 3套方案 → 用户选择 → 图层挂载画布 → 二次编辑
 *
 * 支持两种交互模式：
 *   1. 演示模式 — 点击「运行完整演示」，自动走完 10 步脚本
 *   2. 交互模式 — 用户自由输入，AI 模拟响应
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Send, Sparkles, Box, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/types/editor';
import {
  AssetSchemeCard,
  AssetLayerInfo,
  AssetIntentCard,
  AssetLayerConfigCard,
  AssetEditResultCard,
  AssetAgentWelcome,
  AssetQuickCommands,
} from './AssetWorkflowUI';
import type { LayerConfigItem, EditChangeItem } from './AssetWorkflowUI';

// ============================================================
// 消息内容类型（用于渲染富文本卡片）
// ============================================================

type MessageBlock =
  | { type: 'text'; content: string }
  | { type: 'intent'; labels: import('@/types/editor').AssetIntentLabels }
  | { type: 'schemes'; schemes: import('@/types/editor').AssetScheme[] }
  | { type: 'layer_config'; schemeName: string; schemeIndex: number; layers: LayerConfigItem[]; position: string }
  | { type: 'edit_result'; changes: EditChangeItem[] }
  | { type: 'layer_info'; layers: import('@/types/editor').AssetLayer[] };

interface AssetChatMessage {
  id: string;
  role: 'user' | 'assistant';
  blocks: MessageBlock[];
  timestamp: number;
}

// ============================================================
// 演示数据（严格按照脚本）
// ============================================================

const DEMO_USER_PROMPT = '我现在做电力运维监控大屏，深色科技风格，需要适配右侧告警看板，生成几组电力负荷指标卡片组件，再搭配带红色警示光效的告警分割线素材。整体用工业深蓝配色，突出故障告警数据。';

const DEMO_INTENT_LABELS: import('@/types/editor').AssetIntentLabels = {
  industry: '电力运维监控',
  style: '深色科技风、工业深蓝、红色警示高亮',
  assetTypes: [
    { type: 'component', subType: '指标组件', description: '电力负荷指标卡片' },
    { type: 'material', subType: '分割线素材', description: '告警光效分割线' },
  ],
  colorScheme: {
    primary: '#0a1629',
    background: '#050d1a',
    accent: '#00ccff',
    warning: '#ff3333',
  },
  effects: ['红色警示光效', '蓝色粒子流动描边', '故障数值呼吸闪烁'],
  usageScene: '右侧告警看板区域 — 补充视觉层级，突出故障告警数据',
};

const DEMO_SCHEMES: import('@/types/editor').AssetScheme[] = [
  {
    schemeIndex: 1,
    schemeName: '标准通用款',
    schemeStyle: '视觉稳定、信息清晰，适合长时间值守大屏',
    components: [{
      id: 'c1', name: '电力负荷指标卡片 - 标准款', type: 'component', subType: '指标组件',
      description: '深蓝半透明底板，直角金属边框，科技青数据文字，红色故障数值高亮',
      visualParams: { border: '直角金属边框', background: '深蓝半透明', glow: '静态蓝色微光', size: '12栅格宽度，2×2排布' },
      canvasComponentType: 'kpi_card',
    }],
    materials: [{
      id: 'm1', name: '红色警示告警分割线 - 标准款', type: 'material', subType: '分割线',
      description: '细款横向分割线，两端红色警示光条，中间嵌入小型电力图标',
      visualParams: { glow: '静态红色微光' },
    }],
    fitScene: '常规运维监控场景，需要稳定清晰的信息展示',
    visualSummary: '深蓝半透明底板 + 直角金属边框 + 静态光效',
  },
  {
    schemeIndex: 2,
    schemeName: '强化视觉高亮款',
    schemeStyle: '渐变边框，动态粒子光效，高对比警示色',
    components: [{
      id: 'c2', name: '电力负荷指标卡片 - 高亮款', type: 'component', subType: '指标组件',
      description: '圆角渐变深蓝底板，外框带蓝色流动粒子光效，故障数值红色闪烁高亮',
      visualParams: { border: '圆角科技描边', background: '渐变深蓝', glow: '蓝色粒子流动描边', particle: '红色呼吸闪烁' },
      canvasComponentType: 'kpi_card',
    }],
    materials: [{
      id: 'm2', name: '红色流动光效告警分割线', type: 'material', subType: '分割线',
      description: '加粗横向发光线条，红色流动警示光效，中部嵌入告警三角图标',
      visualParams: { glow: '红色流动光效（左→右循环）' },
    }],
    fitScene: '调度中心、故障预警、领导驾驶舱等需要强提示的核心展示区域',
    visualSummary: '圆角渐变深蓝 + 蓝色粒子流动描边 + 红色呼吸闪烁',
  },
  {
    schemeIndex: 3,
    schemeName: '轻量化简约款',
    schemeStyle: '极简无边框，低饱和配色，无复杂动效',
    components: [{
      id: 'c3', name: '电力负荷指标卡片 - 简约款', type: 'component', subType: '指标组件',
      description: '低饱和深灰蓝半透明底板，无复杂边框，仅颜色区分常规/告警数据',
      visualParams: { border: '无边框', background: '半透明深灰蓝', glow: '无', size: '窄版卡片，适配密集排布' },
      canvasComponentType: 'kpi_card',
    }],
    materials: [{
      id: 'm3', name: '简约告警分割线', type: 'material', subType: '分割线',
      description: '细线分割，两端小红点标识告警区域',
      visualParams: { glow: '无动画' },
    }],
    fitScene: '数据密集、视觉负载较高的大屏，突出信息但不抢占主画面焦点',
    visualSummary: '无边框 + 半透明底板 + 纯色静态分割',
  },
];

const LAYER_CONFIGS_BY_SCHEME: Record<number, LayerConfigItem[]> = {
  1: [
    {
      layerName: '【生成 - 指标组件 - 电力负荷指标卡片（标准款）】',
      layerType: 'component',
      position: '右侧告警看板上方（x:970, y:70 ~ y:325）',
      size: '4宫格排布，每卡片 300×120px',
      visualDetails: [
        { label: '卡片底色', value: '深蓝半透明', status: '' },
        { label: '边框样式', value: '直角金属边框', status: '' },
        { label: '光效状态', value: '静态蓝色微光', status: '已开启' },
        { label: '告警强调', value: '故障数值红色静态高亮', status: '' },
        { label: '内置指标', value: '总负荷、峰值负荷、线路完好率、故障数量', status: '' },
      ],
      editableItems: ['卡片尺寸', '指标名称', '指标数量', '数值颜色', '光效开关', '边框粗细'],
    },
    {
      layerName: '【生成 - 素材 - 红色警示告警分割线（标准款）】',
      layerType: 'material',
      position: '右侧告警看板（指标卡片与告警列表之间，x:970, y:335）',
      size: '细款横向分割线，620×20px',
      visualDetails: [
        { label: '线条样式', value: '细款横向分割线', status: '' },
        { label: '主色', value: '警示红', status: '' },
        { label: '动效状态', value: '静态红色微光', status: '已开启' },
        { label: '中部图标', value: '小型电力图标', status: '' },
      ],
      editableItems: ['线条长度', '线条颜色', '透明度', '中部图标'],
    },
  ],
  2: [
    {
      layerName: '【生成 - 指标组件 - 电力负荷指标卡片（高亮款）】',
      layerType: 'component',
      position: '右侧告警看板上方（x:970, y:70 ~ y:345）',
      size: '4宫格排布，每卡片 300×130px',
      visualDetails: [
        { label: '卡片底色', value: '渐变深蓝', status: '' },
        { label: '边框样式', value: '圆角科技描边', status: '' },
        { label: '光效状态', value: '蓝色粒子流动描边', status: '已开启' },
        { label: '告警强调', value: '故障数值红色呼吸闪烁', status: '已开启' },
        { label: '内置指标', value: '实时总负荷、今日峰值负荷、异常线路数、当前故障数', status: '' },
      ],
      editableItems: ['卡片尺寸', '指标名称', '指标数量', '数值颜色', '光效开关', '边框粗细'],
    },
    {
      layerName: '【生成 - 素材 - 红色流动光效告警分割线】',
      layerType: 'material',
      position: '右侧告警看板（指标卡片与告警列表之间，x:970, y:360）',
      size: '加粗横向发光线条，620×30px',
      visualDetails: [
        { label: '线条样式', value: '加粗横向发光分割线', status: '' },
        { label: '主色', value: '警示红', status: '' },
        { label: '动效状态', value: '红色流动光效', status: '已开启' },
        { label: '中部图标', value: '告警三角图标', status: '' },
      ],
      editableItems: ['线条长度', '线条粗细', '光效亮度', '流动速度', '中部图标', '透明度'],
    },
  ],
  3: [
    {
      layerName: '【生成 - 指标组件 - 电力负荷指标卡片（简约款）】',
      layerType: 'component',
      position: '右侧告警看板上方（x:970, y:70 ~ y:285）',
      size: '窄版卡片密集排布，每卡片 290×100px',
      visualDetails: [
        { label: '卡片底色', value: '低饱和深灰蓝半透明', status: '' },
        { label: '边框样式', value: '无边框', status: '' },
        { label: '光效状态', value: '无动态光效', status: '已关闭' },
        { label: '告警强调', value: '故障字段红色静态高亮', status: '' },
        { label: '内置指标', value: '总负荷、负荷波动、告警数量、处理率', status: '' },
      ],
      editableItems: ['卡片尺寸', '透明度', '文字大小', '指标名称', '指标数量'],
    },
    {
      layerName: '【生成 - 素材 - 简约告警分割线】',
      layerType: 'material',
      position: '右侧告警看板（指标卡片与告警列表之间，x:970, y:300）',
      size: '细线分割，910×16px',
      visualDetails: [
        { label: '线条样式', value: '细纯色静态分割线', status: '' },
        { label: '主色', value: '暗红', status: '' },
        { label: '动效状态', value: '无动画', status: '已关闭' },
        { label: '端点标记', value: '两端小红点标识', status: '' },
      ],
      editableItems: ['线条长度', '线条颜色', '透明度', '位置'],
    },
  ],
};

const DEMO_LAYER_CONFIGS: LayerConfigItem[] = LAYER_CONFIGS_BY_SCHEME[2]; // 默认展示方案2的图层配置

const DEMO_EDIT_CHANGES: EditChangeItem[] = [
  {
    layerName: '指标组件图层',
    changes: [
      { field: '蓝色流动粒子描边', before: '已开启', after: '已关闭' },
      { field: '深蓝渐变底板', before: '保留', after: '保留' },
      { field: '故障数值红色高亮', before: '保留', after: '保留' },
    ],
  },
  {
    layerName: '分割线素材图层',
    changes: [
      { field: '中部图标', before: '告警三角图标', after: '电力变压器图标' },
      { field: '红色流动光效亮度', before: '默认亮度', after: '已降低' },
      { field: '线条粗细/长度/位置', before: '保持不变', after: '保持不变' },
    ],
  },
];

// ============================================================
// Assistant 消息渲染器
// ============================================================

function RenderMessage({ msg, onSchemeSelect, selectedSchemes }: {
  msg: AssetChatMessage;
  onSchemeSelect: (index: number) => void;
  selectedSchemes: number[];
}) {
  if (msg.role === 'user') {
    return <div className="whitespace-pre-wrap">{msg.blocks[0]?.type === 'text' ? msg.blocks[0].content : ''}</div>;
  }

  return (
    <div className="space-y-2.5">
      {msg.blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return (
              <div key={i} className="whitespace-pre-wrap text-slate-300 leading-relaxed text-xs">
                {block.content}
              </div>
            );
          case 'intent':
            return <AssetIntentCard key={i} labels={block.labels} />;
          case 'schemes':
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-purple-400 font-medium px-1">
                  <Box className="w-3.5 h-3.5" />
                  请选择要插入画布的方案序号
                </div>
                {block.schemes.map((scheme) => (
                  <AssetSchemeCard
                    key={scheme.schemeIndex}
                    scheme={scheme}
                    selected={selectedSchemes.includes(scheme.schemeIndex)}
                    onSelect={onSchemeSelect}
                  />
                ))}
              </div>
            );
          case 'layer_config':
            return (
              <AssetLayerConfigCard
                key={i}
                schemeName={block.schemeName}
                schemeIndex={block.schemeIndex}
                layers={block.layers}
                canvasPosition={block.position}
              />
            );
          case 'edit_result':
            return <AssetEditResultCard key={i} changes={block.changes} />;
          case 'layer_info':
            return <AssetLayerInfo key={i} layers={block.layers} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ============================================================
// 主面板组件
// ============================================================

export function AssetAgentPanel() {
  const store = useEditorStore();
  const {
    assetSchemes, assetSelectedSchemes, assetLayers,
    setAssetSchemes, setAssetSelectedSchemes, addAssetLayer, clearAssetLayers,
    setAssetWorkflowStep, resetAssetWorkflow,
    setPreviewComponents, clearPreviewComponents,
  } = store;

  const [messages, setMessages] = useState<AssetChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [selectedSchemes, setSelectedSchemes] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if there are any user messages yet
  const hasUserMsgs = messages.some((m) => m.role === 'user');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 🆕 组件卸载时清除画布预览
  useEffect(() => {
    return () => {
      clearPreviewComponents();
    };
  }, [clearPreviewComponents]);

  // Helper: add a message with delay
  const addMsg = useCallback((msg: AssetChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  // Helper: wait
  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // Helper: generate unique IDs
  const uid = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ─── 生成简短唯一 ID ───
  const makeUID = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  // ─── 构建方案组件配置（预览和正式共用）───
  const buildSchemeComponents = useCallback((schemeIndex: number): {
    addComps: Array<{ type: import('@/types/editor').ComponentType; position: { x: number; y: number }; name: string; size: { width: number; height: number } }>;
    addLayers: Array<{ id: string; name: string; type: import('@/types/editor').AssetType; schemeIndex: number; canvasComponentId: string; position: { x: number; y: number }; size: { width: number; height: number }; zIndex: number; editable: boolean }>;
  } => {
    if (schemeIndex === 1) {
      return {
        addComps: [
          { type: 'kpi_card', position: { x: 970, y: 70 }, name: '总负荷（标准款）', size: { width: 300, height: 120 } },
          { type: 'kpi_card', position: { x: 1290, y: 70 }, name: '峰值负荷（标准款）', size: { width: 300, height: 120 } },
          { type: 'kpi_card', position: { x: 970, y: 205 }, name: '线路完好率（标准款）', size: { width: 300, height: 120 } },
          { type: 'kpi_card', position: { x: 1290, y: 205 }, name: '故障数量（标准款）', size: { width: 300, height: 120 } },
          { type: 'border_decoration', position: { x: 970, y: 335 }, name: '告警分割线（标准款）', size: { width: 620, height: 20 } },
        ],
        addLayers: [
          { id: 'al_1', name: '【生成 - 指标组件 - 电力负荷指标卡片（标准款）】', type: 'component', schemeIndex: 1, canvasComponentId: '', position: { x: 970, y: 70 }, size: { width: 620, height: 265 }, zIndex: 10, editable: true },
          { id: 'al_2', name: '【生成 - 素材 - 红色警示告警分割线（标准款）】', type: 'material', schemeIndex: 1, canvasComponentId: '', position: { x: 970, y: 335 }, size: { width: 620, height: 20 }, zIndex: 11, editable: true },
        ],
      };
    } else if (schemeIndex === 2) {
      return {
        addComps: [
          { type: 'kpi_card', position: { x: 970, y: 70 }, name: '实时总负荷', size: { width: 300, height: 130 } },
          { type: 'kpi_card', position: { x: 1290, y: 70 }, name: '今日峰值负荷', size: { width: 300, height: 130 } },
          { type: 'kpi_card', position: { x: 970, y: 215 }, name: '异常线路数', size: { width: 300, height: 130 } },
          { type: 'kpi_card', position: { x: 1290, y: 215 }, name: '当前故障数', size: { width: 300, height: 130 } },
          { type: 'border_decoration', position: { x: 970, y: 360 }, name: '告警分割线（高亮款）', size: { width: 620, height: 30 } },
        ],
        addLayers: [
          { id: 'al_1', name: '【生成 - 指标组件 - 电力负荷指标卡片（高亮款）】', type: 'component', schemeIndex: 2, canvasComponentId: '', position: { x: 970, y: 70 }, size: { width: 620, height: 275 }, zIndex: 10, editable: true },
          { id: 'al_2', name: '【生成 - 素材 - 红色流动光效告警分割线】', type: 'material', schemeIndex: 2, canvasComponentId: '', position: { x: 970, y: 360 }, size: { width: 620, height: 30 }, zIndex: 11, editable: true },
        ],
      };
    } else {
      // schemeIndex === 3
      return {
        addComps: [
          { type: 'kpi_card', position: { x: 970, y: 70 }, name: '总负荷（简约款）', size: { width: 290, height: 100 } },
          { type: 'kpi_card', position: { x: 1280, y: 70 }, name: '负荷波动（简约款）', size: { width: 290, height: 100 } },
          { type: 'kpi_card', position: { x: 1590, y: 70 }, name: '告警数量（简约款）', size: { width: 290, height: 100 } },
          { type: 'kpi_card', position: { x: 970, y: 185 }, name: '处理率（简约款）', size: { width: 290, height: 100 } },
          { type: 'border_decoration', position: { x: 970, y: 300 }, name: '告警分割线（简约款）', size: { width: 910, height: 16 } },
        ],
        addLayers: [
          { id: 'al_1', name: '【生成 - 指标组件 - 电力负荷指标卡片（简约款）】', type: 'component', schemeIndex: 3, canvasComponentId: '', position: { x: 970, y: 70 }, size: { width: 910, height: 215 }, zIndex: 10, editable: true },
          { id: 'al_2', name: '【生成 - 素材 - 简约告警分割线】', type: 'material', schemeIndex: 3, canvasComponentId: '', position: { x: 970, y: 300 }, size: { width: 910, height: 16 }, zIndex: 11, editable: true },
        ],
      };
    }
  }, []);

  // ─── 画布实时预览方案 🆕 ───
  const previewScheme = useCallback((schemeIndex: number) => {
    const { addComps } = buildSchemeComponents(schemeIndex);
    const previewComps: import('@/types/editor').CanvasComponent[] = addComps.map((c, i) => ({
      id: `pv_${schemeIndex}_${i}_${makeUID()}`,
      type: c.type,
      name: c.name,
      position: c.position,
      size: c.size,
      props: {} as Record<string, unknown>,
      zIndex: 100 + i,
      locked: true,
      visible: true,
      preview: true,
    }));
    setPreviewComponents(previewComps);
  }, [buildSchemeComponents, setPreviewComponents]);

  // ─── 将选中方案实例化到画布 ───
  const instantiateScheme = useCallback((schemeIndex: number) => {
    // 先清除预览
    clearPreviewComponents();
    const { addComps, addLayers } = buildSchemeComponents(schemeIndex);
    addComps.forEach((c) => {
      store.addComponent(c.type, c.position, c.name, c.size);
    });
    clearAssetLayers();
    addLayers.forEach((layer) => {
      addAssetLayer(layer);
    });
  }, [store, clearPreviewComponents, buildSchemeComponents, clearAssetLayers, addAssetLayer]);

  // ─── 完整演示流程 ───
  const runAssetDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setLoading(true);
    setSelectedSchemes([]);
    setMessages([]);
    resetAssetWorkflow();

    // ===== Step 1: 用户输入 =====
    await wait(300);
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: DEMO_USER_PROMPT }],
      timestamp: Date.now(),
    });

    // ===== Step 2: 意图解析 =====
    await wait(800);
    setLoading(false);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '已收到你的组件 / 素材生成需求，正在解析行业、视觉风格、资产类型和画布使用位置。\n\n#### 第一步：用户需求意图解析完成\n\n结构化需求标签如下：' },
        { type: 'intent', labels: DEMO_INTENT_LABELS },
        { type: 'text', content: '我将基于以上需求生成 **3 套差异化资产方案**，每套都同时包含「电力负荷指标卡片组件」和「告警分割线素材」。' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 3: 生成 3 套方案 =====
    await wait(600);
    setAssetSchemes(DEMO_SCHEMES);
    setAssetWorkflowStep('schemes_generated');
    // 不在画布预览，等用户确认后再渲染
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第二步：批量生成 3 套差异化组件 / 素材方案\n\n每套方案都同时包含「电力负荷指标卡片组件」和「告警分割线素材」，请根据场景选择最合适的一套。' },
        { type: 'schemes', schemes: DEMO_SCHEMES },
        { type: 'text', content: '请选择要插入画布的方案序号，选中后我会将对应组件和素材作为独立图层挂载到当前大屏右侧告警看板。' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 4: 自动选择方案 2 =====
    await wait(1500);
    setSelectedSchemes([2]);
    setAssetSelectedSchemes([2]);
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: '选择方案 2，只生成这套指标卡片和分割线素材。' }],
      timestamp: Date.now(),
    });

    // ===== Step 5: 确认选择 =====
    await wait(500);
    setLoading(true);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [{ type: 'text', content: '已选择「方案 2：强化视觉高亮款」。\n\n正在将电力负荷指标卡片组件和红色流动光效告警分割线素材生成至当前画布，并以独立图层挂载到右侧告警看板区域。' }],
      timestamp: Date.now(),
    });

    // ===== Step 6: 图层实例化 —— 添加组件到画布 =====
    await wait(600);
    setAssetWorkflowStep('layer_rendering');

    // 将方案2的组件和素材实例化到画布右侧告警看板
    instantiateScheme(2);

    setAssetWorkflowStep('completed');
    setLoading(false);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第四步：画布图层实例化渲染完成\n\n已将「方案 2：强化视觉高亮款」生成并插入当前电力运维监控大屏。' },
        {
          type: 'layer_config',
          schemeName: '强化视觉高亮款',
          schemeIndex: 2,
          layers: DEMO_LAYER_CONFIGS,
          position: '右侧告警看板区域',
        },
        {
          type: 'text',
          content: '当前组件和素材已完成画布挂载，你可以继续对这两个独立图层做单独修改。\n\n**可尝试的二次编辑指令：**\n- 把指标卡片粒子光效关掉\n- 分割线红色光效调暗一点\n- 把中间告警三角图标换成电力变压器图标\n- 指标卡片新增线路损耗指标\n- 把这两个图层整体下移 20 像素',
        },
      ],
      timestamp: Date.now(),
    });

    // Fit canvas
    setTimeout(() => store.fitCanvas(), 200);
    setDemoRunning(false);

    // ===== Step 7-9: 等待用户输入二次编辑指令 =====
  }, [demoRunning, addMsg, store, resetAssetWorkflow, setAssetSchemes, setAssetWorkflowStep, setAssetSelectedSchemes, instantiateScheme]);

  // ─── 处理用户输入 ───
  const handleSend = useCallback(async (messageText?: string) => {
    const msg = (messageText || input).trim();
    if (!msg || loading || demoRunning) return;
    setInput('');

    addMsg({ id: uid(), role: 'user', blocks: [{ type: 'text', content: msg }], timestamp: Date.now() });
    setLoading(true);

    // ── 检测用户意图 ──
    // 方案选择（数字 1/2/3 或 "选方案X"）
    const schemeIdx =
      (msg.includes('1') || msg.includes('一') || msg.includes('标准') || msg.includes('通用')) ? 1 :
      (msg.includes('2') || msg.includes('二') || msg.includes('高亮') || msg.includes('强化')) ? 2 :
      (msg.includes('3') || msg.includes('三') || msg.includes('简约') || msg.includes('轻量')) ? 3 : 0;

    // 二次编辑指令
    const isEditCommand =
      msg.includes('关闭') || msg.includes('关掉') || msg.includes('换成') ||
      msg.includes('替换') || msg.includes('调暗') || msg.includes('调亮') ||
      msg.includes('修改') || msg.includes('调整') || msg.includes('新增') ||
      msg.includes('删除') || msg.includes('下移') || msg.includes('上移') ||
      msg.includes('改') || msg.includes('换') || msg.includes('增加');

    // 资产生成请求
    const isAssetGenRequest =
      msg.includes('生成') || msg.includes('素材') || msg.includes('组件') ||
      msg.includes('指标') || msg.includes('分割线') || msg.includes('顶栏') ||
      msg.includes('底座') || msg.includes('光效') || msg.includes('装饰') ||
      msg.includes('边框') || msg.includes('卡片') || msg.includes('图标');

    // 是否正在展示方案
    const hasSchemes = assetSchemes.length > 0;

    await wait(600);

    if (schemeIdx > 0 && hasSchemes) {
      // ─── 方案选择 → 直接确认并渲染到画布 ───
      const scheme = DEMO_SCHEMES.find((s) => s.schemeIndex === schemeIdx);
      setSelectedSchemes([schemeIdx]);
      setAssetSelectedSchemes([schemeIdx]);
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [{ type: 'text', content: `已选择「方案 ${schemeIdx}：${scheme?.schemeName || ''}」。\n\n正在将对应组件和素材生成至当前画布，并以独立图层挂载。` }],
        timestamp: Date.now(),
      });
      await wait(400);
      setAssetWorkflowStep('layer_rendering');
      instantiateScheme(schemeIdx);
      setAssetWorkflowStep('completed');
      setLoading(false);
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: `#### 画布图层实例化渲染完成\n\n已将「方案 ${schemeIdx}：${scheme?.schemeName || ''}」的组件和素材挂载至画布。` },
          { type: 'layer_config', schemeName: scheme?.schemeName || '', schemeIndex: schemeIdx, layers: DEMO_LAYER_CONFIGS, position: '告警看板区域' },
          { type: 'text', content: '✅ 图层可单独拖拽、缩放、隐藏、删除。你可以继续对生成资产做二次编辑，或描述新的组件/素材需求。' },
        ],
        timestamp: Date.now(),
      });
      setTimeout(() => store.fitCanvas(), 200);
    } else if (isEditCommand && assetLayers.length > 0) {
      // ─── 二次编辑响应 ───
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '已收到二次编辑需求，正在针对生成的独立图层进行局部调整。\n\n#### 二次编辑完成\n\n本次仅修改生成的组件和素材图层，未改动画布原有内容。' },
          { type: 'edit_result', changes: DEMO_EDIT_CHANGES },
          { type: 'text', content: '优化完成。你可以继续描述新的组件/素材需求。' },
        ],
        timestamp: Date.now(),
      });
    } else if (isAssetGenRequest) {
      // ─── 资产生成 ───
      setSelectedSchemes([]);
      setAssetSchemes(DEMO_SCHEMES);
      setAssetWorkflowStep('schemes_generated');
      // 不自动预览，等用户选择方案后再渲染到画布
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '已收到你的组件/素材生成需求。\n\n#### 第一步：用户需求意图解析完成' },
          { type: 'intent', labels: DEMO_INTENT_LABELS },
          { type: 'text', content: '#### 第二步：批量生成 3 套差异化方案\n\n请从下方方案中选择（回复序号 1/2/3）：' },
          { type: 'schemes', schemes: DEMO_SCHEMES },
        ],
        timestamp: Date.now(),
      });
    } else {
      // ─── 引导 ───
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '收到你的需求。作为组件素材生成智能体，我可以帮你：\n\n🎯 **生成组件**：指标卡片、图表、列表等业务组件\n🎨 **生成素材**：分割线、边框、顶栏、底座、光效等装饰素材\n\n💬 请描述你需要的组件或素材类型，例如：\n- 「生成电力指标卡片组件」\n- 「制作科技蓝告警分割线素材」' },
        ],
        timestamp: Date.now(),
      });
    }

    setLoading(false);
    scrollToBottom();
  }, [input, loading, demoRunning, addMsg, assetLayers, assetSchemes, setAssetSchemes, setAssetWorkflowStep, scrollToBottom, instantiateScheme, setSelectedSchemes, setAssetSelectedSchemes, store]);

  // ─── 方案选择处理（仅支持单选，不在画布预览）───
  const handleSchemeSelect = useCallback((index: number) => {
    setSelectedSchemes((prev) => {
      // 点击已选中的方案 → 取消选择
      if (prev.includes(index)) {
        return [];
      }
      // 单选：仅标记选中，不渲染画布
      return [index];
    });
  }, []);

  // ─── 确认方案选择 ───
  const handleConfirmSelection = useCallback(async () => {
    if (selectedSchemes.length === 0 || loading) return;
    setLoading(true);
    const selNames = selectedSchemes.map((i) => `方案 ${i}`).join('和');
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: `选择${selNames}，生成对应的指标卡片和分割线素材。` }],
      timestamp: Date.now(),
    });
    setAssetSelectedSchemes(selectedSchemes);
    await wait(500);

    // 确认消息
    const scheme = DEMO_SCHEMES.find((s) => s.schemeIndex === selectedSchemes[0]);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [{ type: 'text', content: `已选择「方案 ${selectedSchemes[0]}：${scheme?.schemeName || ''}」。\n\n正在将对应组件和素材生成至当前画布，并以独立图层挂载到右侧告警看板区域。` }],
      timestamp: Date.now(),
    });
    await wait(400);

    // 图层实例化 — 处理所有选中方案
    setAssetWorkflowStep('layer_rendering');
    for (const idx of selectedSchemes) {
      instantiateScheme(idx);
    }
    setAssetWorkflowStep('completed');

    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: `#### 画布图层实例化渲染完成\n\n已将选中的资产批量生成，独立图层挂载至当前画布右侧。` },
        { type: 'layer_config', schemeName: scheme?.schemeName || '', schemeIndex: selectedSchemes[0], layers: DEMO_LAYER_CONFIGS, position: '右侧告警看板区域' },
        { type: 'text', content: '✅ 所有图层可单独拖拽、缩放、隐藏、删除。你可以继续对生成资产做二次编辑。' },
      ],
      timestamp: Date.now(),
    });

    setLoading(false);
    setTimeout(() => store.fitCanvas(), 200);
  }, [selectedSchemes, loading, addMsg, store, setAssetSelectedSchemes, setAssetWorkflowStep, instantiateScheme, clearPreviewComponents]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#1e293b] flex items-center gap-2 bg-[#0a0e1a]">
        <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center">
          <Box className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <span className="text-xs font-semibold text-slate-200">组件素材生成</span>
        <span className="text-[10px] text-purple-400/60 ml-auto">组件 + 素材 → 独立图层</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Welcome (when no messages) */}
        {!hasUserMsgs && (
          <AssetAgentWelcome
            onDemo={runAssetDemo}
            onPromptSelect={(prompt) => handleSend(prompt)}
          />
        )}

        {/* Message list */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-purple-500/20 text-purple-100 border border-purple-500/20'
                  : 'bg-[#1e293b] text-slate-300 border border-[#334155]/50'
              )}
            >
              {msg.role === 'assistant' && msg.blocks.length === 0 && loading ? (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-500 ml-1">AI 正在生成资产...</span>
                </div>
              ) : (
                <RenderMessage
                  msg={msg}
                  onSchemeSelect={handleSchemeSelect}
                  selectedSchemes={selectedSchemes}
                />
              )}
            </div>
          </div>
        ))}

        {/* Confirm button for scheme selection */}
        {selectedSchemes.length > 0 && assetSchemes.length > 0 && (
          <div className="flex justify-center">
            <button
              onClick={handleConfirmSelection}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border',
                loading
                  ? 'bg-slate-500/10 text-slate-600 border-slate-500/20 cursor-not-allowed'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              确认选择方案 {selectedSchemes[0]} — 生成独立图层
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick commands */}
      {hasUserMsgs && (
        <div className="px-3 py-2 border-t border-[#1e293b]">
          <AssetQuickCommands onSelect={(prompt) => handleSend(prompt)} />
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-2 border-t border-[#1e293b] bg-[#0a0e1a]">
        <div className="flex items-end gap-2 bg-[#1e293b]/80 border border-[#334155]/50 rounded-lg px-3 py-2 focus-within:border-purple-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              assetLayers.length > 0
                ? '继续修改生成资产：关闭粒子光效 / 换图标 / 调暗光效...'
                : '描述你需要的组件或素材：指标卡片 / 分割线 / 顶栏 / 底座...'
            }
            rows={1}
            className="flex-1 text-xs bg-transparent text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none min-h-[20px] max-h-[80px]"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={runAssetDemo}
              disabled={demoRunning || loading}
              className={cn(
                'p-1 rounded transition-colors',
                demoRunning || loading
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
              )}
              title="运行完整演示"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || demoRunning}
              className={cn(
                'p-1 rounded transition-colors',
                input.trim() && !loading && !demoRunning
                  ? 'text-purple-400 hover:text-purple-300'
                  : 'text-slate-600 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
