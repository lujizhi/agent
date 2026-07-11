'use client';

/**
 * 文生大屏智能体 — 独立 Agent 面板
 *
 * 完整演示流程（对齐演示脚本）：
 *   自然语言输入 → 意图解析 → 推荐3套模板 → 用户选择 →
 *   语义化渲染 → 画布生成 → 二次编辑
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, FileText, Sparkles, CheckCircle2, LayoutTemplate, MessageSquare, ArrowRight } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

// ============================================================
// 演示数据
// ============================================================

const DEMO_USER_PROMPT = '帮我做一个电力运维大数据监控大屏，整体用深色科技风，采用标准左右两侧看板布局，版面要规整专业。需要包含电力负荷数据卡片、负荷趋势折线图、各站点供电量柱状图、故障预警列表组件，用于电力日常运维监控、能耗统计与异常监测。';

interface TemplateRec {
  id: string;
  name: string;
  scene: string;
  layout: string;
  components: string[];
  reason: string;
  isRecommended: boolean;
}

const DEMO_TEMPLATES: TemplateRec[] = [
  {
    id: 'tpl-power-monitor',
    name: '电力全域运维监控大屏',
    scene: '区域电网综合运维 · 电力调度中心 · 供电负荷实时监控 · 故障告警集中处理',
    layout: '顶部通栏标题 + 标准左右双侧看板（左侧趋势分析与站点对比 / 右侧核心指标与故障告警）',
    components: ['电力负荷指标卡片组', '负荷趋势折线图', '站点供电量柱状图', '故障预警列表', '电网运行状态提示'],
    reason: '与「电力运维 + 左右两侧看板 + 深色科技风 + 故障预警」需求匹配度最高，模板骨架规整，适合快速生成专业运维监控大屏。推荐优先选择。',
    isRecommended: true,
  },
  {
    id: 'tpl-power-energy',
    name: '电网能耗数据总览大屏',
    scene: '电力能耗统计 · 站点用电分析 · 周期性报表展示 · 供电效率评估',
    layout: '顶部标题区 + 左侧核心能耗指标 + 右侧趋势图表与对比分析 + 中下能耗排名和统计汇总',
    components: ['能耗指标卡', '同比环比趋势图', '站点能耗柱状对比图', '能耗排名列表', '用电结构占比图'],
    reason: '更适合突出能耗统计和站点数据对比，对异常告警的表达弱于模板1。如果演示重点偏"数据分析"和"报表总览"，可以选择该模板。',
    isRecommended: false,
  },
  {
    id: 'tpl-power-alert',
    name: '电力负荷监测预警大屏',
    scene: '电网负荷动态监测 · 过载预警 · 异常风险研判 · 调度中心实时预警',
    layout: '顶部运行状态总览 + 左侧负荷趋势分析 + 右侧告警信息汇总 + 底部重点线路状态',
    components: ['负荷趋势折线图', '峰值负荷仪表盘', '过载预警列表', '异常站点排行', '红色告警高亮组件'],
    reason: '告警和预警能力更突出，适合强调异常监测和调度预警。如果希望画面更偏风险预警，可以选择该模板。',
    isRecommended: false,
  },
];

// 意图解析数据
const DEMO_INTENT = {
  industry: '电力行业 · 电网运维 · 供电负荷监控',
  usage: '电力日常运维监控 · 能耗数据统计 · 异常故障监测 · 7×24运行态势展示',
  style: '深色科技风 · 专业沉稳 · 数据高亮突出 · 适合调度中心和运维中心长期观看',
  layout: '标准左右两侧看板布局 · 双侧模块化分区展示 · 版面规整对称 · 主次层级清晰',
  components: '电力负荷数据卡片 · 负荷趋势折线图 · 各站点供电量柱状图 · 故障预警列表组件',
  dimensions: '实时负荷 · 峰值负荷 · 站点供电量 · 能耗统计 · 故障预警 · 异常状态',
};

const DEMO_EDIT_CHANGES = [
  { field: '异常数据高亮', before: '默认展示', after: '过载/离线/高危字段红色高亮，异常告警数增加红色呼吸提示' },
  { field: '故障告警列表', before: '基础列表', after: '新增故障站点、故障类型、处理状态、紧急等级字段；高危行增加左侧红色标识条；未处理状态增加警示图标' },
  { field: '右侧看板', before: '常规排布', after: '边框亮度增强，异常告警数指标卡片位置上移优先展示，组件间距微调' },
  { field: '布局自适应', before: '调整前', after: '左右双侧看板比例保持不变，右侧告警信息层级更清晰，无重叠无留白' },
];

// ============================================================
// 卡片组件
// ============================================================

function IntentCard() {
  return (
    <div className="border border-cyan-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-medium text-cyan-300">用户意图解析完成</span>
      </div>
      <div className="p-3 space-y-1.5 text-[10px]">
        {[
          ['核心行业', DEMO_INTENT.industry],
          ['大屏用途', DEMO_INTENT.usage],
          ['视觉风格', DEMO_INTENT.style],
          ['布局偏好', DEMO_INTENT.layout],
          ['必备组件', DEMO_INTENT.components],
          ['数据维度', DEMO_INTENT.dimensions],
        ].map(([label, val]) => (
          <div key={label} className="flex gap-2">
            <span className="text-slate-500 w-16 flex-shrink-0">{label}：</span>
            <span className="text-slate-400">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ tpl, selected, onSelect }: { tpl: TemplateRec; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(tpl.id)}
      className={cn(
        'w-full text-left border rounded-lg transition-all p-3',
        selected
          ? 'border-cyan-500/40 bg-cyan-500/5 ring-1 ring-cyan-500/20'
          : 'border-[#1e293b] bg-[#0a0e1a] hover:border-cyan-500/30'
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', selected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e293b] text-slate-500')}>
          <LayoutTemplate className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-200">{tpl.name}</span>
            {tpl.isRecommended && (
              <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">推荐</span>
            )}
          </div>
        </div>
        {selected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
      </div>
      <div className="space-y-1 text-[10px] pl-9">
        <p><span className="text-slate-500">场景：</span><span className="text-slate-400">{tpl.scene}</span></p>
        <p><span className="text-slate-500">布局：</span><span className="text-slate-400">{tpl.layout}</span></p>
        <p><span className="text-slate-500">组件：</span><span className="text-slate-400">{tpl.components.join(' · ')}</span></p>
        <p className="text-slate-500 pt-1 border-t border-[#1e293b] mt-1">{tpl.reason}</p>
      </div>
    </button>
  );
}

function RenderResultCard() {
  return (
    <div className="border border-emerald-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-300">模板语义转化与大屏生成完成</span>
      </div>
      <div className="p-3 space-y-1.5 text-[10px] text-slate-400">
        <p>初版「电力运维大数据监控大屏」已生成</p>
        <p><span className="text-slate-500">全局风格：</span>深色科技风 · 深蓝背景 + 科技青高亮 · 微光边框</p>
        <p><span className="text-slate-500">整体布局：</span>顶部标题 + 左侧趋势分析(折线图·柱状图) + 右侧核心指标(5卡片·告警列表)</p>
        <p><span className="text-slate-500">组件落地：</span>标题 · 时间 · 趋势折线图 · 柱状图 · KPI卡片×5 · 故障告警列表</p>
        <p><span className="text-slate-500">数据规则：</span>常规→科技青 / 关键→亮蓝 / 异常→红色高亮</p>
        <p className="text-emerald-400">✅ 所有组件均可在编辑器中拖拽、缩放、替换和修改样式</p>
      </div>
    </div>
  );
}

function EditResultCard({ changes }: { changes: typeof DEMO_EDIT_CHANGES }) {
  return (
    <div className="border border-purple-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[11px] font-medium text-purple-300">二次编辑完成</span>
      </div>
      <div className="p-3 space-y-1 text-[10px]">
        {changes.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-500 w-28 flex-shrink-0 truncate">{c.field}：</span>
            <span className="text-slate-500 line-through">{c.before}</span>
            <span className="text-slate-500">→</span>
            <span className="text-emerald-400">{c.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 消息类型与渲染
// ============================================================

type TextMsgBlock =
  | { type: 'text'; content: string }
  | { type: 'intent' }
  | { type: 'templates'; templates: TemplateRec[] }
  | { type: 'render_result' }
  | { type: 'edit_result'; changes: typeof DEMO_EDIT_CHANGES };

interface TextChatMessage {
  id: string;
  role: 'user' | 'assistant';
  blocks: TextMsgBlock[];
  timestamp: number;
}

function RenderMessage({ msg, selectedTpl, onTemplateSelect }: {
  msg: TextChatMessage;
  selectedTpl: string | null;
  onTemplateSelect: (id: string) => void;
}) {
  if (msg.role === 'user') {
    return <div className="whitespace-pre-wrap">{msg.blocks[0]?.type === 'text' ? msg.blocks[0].content : ''}</div>;
  }
  return (
    <div className="space-y-2.5">
      {msg.blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <div key={i} className="whitespace-pre-wrap text-slate-300 leading-relaxed text-xs">{block.content}</div>;
          case 'intent':
            return <IntentCard key={i} />;
          case 'templates':
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-medium px-1">
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  匹配内置模板完成，请选择模板
                </div>
                {block.templates.map((tpl) => (
                  <TemplateCard key={tpl.id} tpl={tpl} selected={selectedTpl === tpl.id} onSelect={onTemplateSelect} />
                ))}
              </div>
            );
          case 'render_result':
            return <RenderResultCard key={i} />;
          case 'edit_result':
            return <EditResultCard key={i} changes={block.changes} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// ============================================================
// 欢迎页
// ============================================================

function TextAgentWelcome({ onDemo, onPrompt }: { onDemo: () => void; onPrompt: (text: string) => void }) {
  const prompts = [
    { label: '电力运维监控', text: '帮我做一个电力运维大数据监控大屏，深色科技风，左右看板布局，需要负荷数据卡片、趋势折线图、站点供电量柱状图、故障预警列表' },
    { label: '智慧园区驾驶舱', text: '帮我生成一个智慧园区运营驾驶舱，政企科技风，中间园区总览+左右数据看板，包含入驻企业、人流车流、能耗趋势、安防告警' },
    { label: '物流运输调度', text: '帮我做一个物流运输调度大屏，商务科技风，左右看板布局，展示订单量、在途车辆、准时率、异常运单、运输趋势' },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-cyan-300">文生大屏智能体</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">用自然语言描述需求，AI 自动解析场景并生成可编辑大屏：</p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
          <p>🧠 意图解析：识别行业、用途、风格、布局、组件</p>
          <p>📋 模板推荐：固定推荐 <span className="text-cyan-400">3 套</span> 最适配模板</p>
          <p>🎨 语义渲染：将用户语义映射为真实大屏布局和视觉风格</p>
          <p>✏️ 二次编辑：生成后可继续用自然语言修改组件/布局/配色</p>
        </div>
      </div>

      <button onClick={onDemo} className="w-full text-left rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors p-3 group">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-cyan-300">运行完整演示</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">推荐</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">电力运维需求 → 意图解析 → 3套模板推荐 → 选择模板1 → 画布生成 → 二次编辑</p>
          </div>
          <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
        </div>
      </button>

      <p className="text-[10px] text-slate-500 px-1">💬 快速体验：</p>
      <div className="space-y-1.5">
        {prompts.map((p) => (
          <button key={p.label} onClick={() => onPrompt(p.text)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors border bg-[#1e293b]/50 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 border-transparent">
            <MessageSquare className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px] truncate">{p.label}</span>
            <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0 text-slate-600" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 主面板
// ============================================================

export function TextAgentPanel() {
  const store = useEditorStore();

  const [messages, setMessages] = useState<TextChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [selectedTpl, setSelectedTpl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasUserMsgs = messages.some((m) => m.role === 'user');
  const hasTemplates = messages.some((m) => m.blocks.some((b) => b.type === 'templates'));
  const isEditing = messages.some((m) => m.blocks.some((b) => b.type === 'render_result'));

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const addMsg = useCallback((msg: TextChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const uid = () => `txt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // ─── 模板选择 ───
  const handleTemplateSelect = useCallback((id: string) => {
    setSelectedTpl((prev) => (prev === id ? null : id));
  }, []);

  // ─── 画布渲染：生成大屏 ───
  const renderDashboard = useCallback(() => {
    // 清除画布现有内容
    const ids = store.components.map((c) => c.id);
    ids.forEach((id) => store.removeComponent(id));

    // 标题
    store.addComponent('title_text', { x: 500, y: 10 }, '电力运维大数据监控大屏', { width: 920, height: 50 });

    // 左侧分析看板
    store.addComponent('line_chart', { x: 20, y: 75 }, '全网电力负荷趋势折线图', { width: 440, height: 260 });
    store.addComponent('bar_chart', { x: 20, y: 350 }, '各站点供电量柱状对比图', { width: 440, height: 260 });

    // 中央地图
    store.addComponent('map_chart', { x: 480, y: 75 }, '电网拓扑总览', { width: 460, height: 535 });

    // 右侧看板：KPI卡片
    store.addComponent('kpi_card', { x: 970, y: 75 }, '实时总负荷', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1210, y: 75 }, '今日峰值负荷', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1430, y: 75 }, '供电总量', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1650, y: 75 }, '线路完好率', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 970, y: 200 }, '异常告警数', { width: 220, height: 110 });

    // 右侧看板：告警列表
    store.addComponent('alarm_list', { x: 970, y: 325 }, '故障预警列表', { width: 930, height: 250 });

    // 装饰
    store.addComponent('border_decoration', { x: 20, y: 68 }, '发光边框', { width: 1880, height: 555 });

    store.pushHistory('文生大屏生成');
    setTimeout(() => store.fitCanvas(), 200);
  }, [store]);

  // ─── 完整演示流程 ───
  const runTextDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setLoading(true);
    setMessages([]);
    setSelectedTpl(null);

    // ===== Step 1: 用户输入 =====
    await wait(400);
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: DEMO_USER_PROMPT }],
      timestamp: Date.now(),
    });

    // ===== Step 2: 意图解析 =====
    await wait(700);
    setLoading(false);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '已解析你的大屏创作需求，核心场景、风格、布局和组件需求已锁定，正在为你匹配 3 套最优内置模板。\n\n#### 第一步：用户意图解析完成' },
        { type: 'intent' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 3: 推荐 3 套模板 =====
    await wait(500);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第二步：匹配内置模板完成\n\n基于你的行业、用途、布局、风格和组件需求，为你推荐以下 3 套最适配模板，请选择需要使用的模板（回复序号或名称）：' },
        { type: 'templates', templates: DEMO_TEMPLATES },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 4: 自动选择模板1 =====
    await wait(1500);
    setSelectedTpl('tpl-power-monitor');
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: '选第一个，电力全域运维监控大屏。' }],
      timestamp: Date.now(),
    });

    // ===== Step 5: 确认选择 =====
    await wait(400);
    setLoading(true);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [{ type: 'text', content: '已选择【电力全域运维监控大屏】模板，正在基于该模板骨架进行风格、布局和组件语义化渲染。' }],
      timestamp: Date.now(),
    });

    // ===== Step 6: 画布渲染 =====
    await wait(500);
    renderDashboard();
    setLoading(false);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第三步：模板语义转化与大屏生成完成\n\n初版「电力运维大数据监控大屏」已生成。所有组件均可在编辑器中继续拖拽、缩放、替换和修改样式。' },
        { type: 'render_result' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 7: 开放二次编辑 =====
    await wait(400);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第四步：开放二次编辑能力\n\n当前初版左右看板结构的电力运维大屏已生成，你可以继续通过自然语言提出精细化修改需求。\n\n**支持修改：** 组件（名称/数值/颜色/类型）、布局（宽度/位置/分区）、风格（配色/边框/光效）、数据（新增/删除指标）、交互（点击/悬浮/联动）。\n\n**示例修改指令：**\n- 把异常数据做红色高亮\n- 优化故障告警列表组件样式\n- 新增电力统计组件到左侧看板\n- 调整左右看板宽度比例' },
      ],
      timestamp: Date.now(),
    });

    setDemoRunning(false);
  }, [demoRunning, addMsg, store, renderDashboard]);

  // ─── 处理用户输入 ───
  const handleSend = useCallback(async (messageText?: string) => {
    const msg = (messageText || input).trim();
    if (!msg || loading || demoRunning) return;
    setInput('');
    addMsg({ id: uid(), role: 'user', blocks: [{ type: 'text', content: msg }], timestamp: Date.now() });
    setLoading(true);
    await wait(500);

    // ── 检测用户意图 ──
    const lower = msg.toLowerCase();

    // 模板选择：数字1/2/3 或 "选第X个" 或 "模板X" 或 "第一个/第二个/第三个"
    const tplIdx =
      msg.includes('1') || msg.includes('一') || msg.includes('全域') || msg.includes('第一个') ? 0 :
      msg.includes('2') || msg.includes('二') || msg.includes('能耗') || msg.includes('第二个') ? 1 :
      msg.includes('3') || msg.includes('三') || msg.includes('监测') || msg.includes('预警') || msg.includes('第三个') ? 2 : -1;

    // 二次编辑指令
    const isEdit =
      msg.includes('修改') || msg.includes('改') || msg.includes('调整') ||
      msg.includes('替换') || msg.includes('换成') || msg.includes('新增') ||
      msg.includes('删除') || msg.includes('优化') || msg.includes('高亮') ||
      msg.includes('调暗') || msg.includes('调亮') || msg.includes('样式') ||
      msg.includes('增加') || msg.includes('去掉') || msg.includes('换');

    // 新的大屏需求
    const isDashboardRequest =
      lower.includes('大屏') || lower.includes('驾驶舱') || lower.includes('监控') ||
      lower.includes('生成') || lower.includes('做一个') || lower.includes('帮我') ||
      lower.includes('创建') || lower.includes('运维') || lower.includes('园区') ||
      lower.includes('物流') || lower.includes('销售') || lower.includes('数据看板');

    // ── 路由 ──
    if (tplIdx >= 0 && hasTemplates) {
      // 模板选择 → 确认 → 渲染大屏
      const tpl = DEMO_TEMPLATES[tplIdx];
      setSelectedTpl(tpl.id);
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [{ type: 'text', content: `已选择【${tpl.name}】模板，正在基于该模板骨架进行风格、布局和组件语义化渲染。` }],
        timestamp: Date.now(),
      });
      await wait(400);
      renderDashboard();
      setLoading(false);
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '#### 第三步：模板语义转化与大屏生成完成\n\n初版大屏已生成，所有组件均可在编辑器中继续拖拽、缩放、替换和修改样式。' },
          { type: 'render_result' },
          { type: 'text', content: '#### 第四步：开放二次编辑能力\n\n你可以继续用自然语言修改组件、布局、配色和数据。示例：\n- 把异常数据做红色高亮\n- 优化故障告警列表组件样式\n- 新增电力统计组件到左侧看板\n- 调整左右看板宽度比例' },
        ],
        timestamp: Date.now(),
      });
    } else if (isEdit && isEditing) {
      // 二次编辑
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '已收到二次修改需求，正在优化大屏组件和样式。\n\n#### 二次编辑完成' },
          { type: 'edit_result', changes: DEMO_EDIT_CHANGES },
          { type: 'text', content: '优化完成。你可以继续修改，或确认完成当前大屏生成。' },
        ],
        timestamp: Date.now(),
      });
    } else if (isDashboardRequest) {
      // 新的大屏需求 → 意图解析 + 推荐模板（画布不渲染，等用户确认）
      setSelectedTpl(null);
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: `已解析你的大屏创作需求。\n\n#### 第一步：用户意图解析完成\n\n核心行业、用途、风格、布局和组件需求已锁定。` },
          { type: 'intent' },
          { type: 'text', content: '#### 第二步：匹配内置模板完成\n\n基于你的需求，为你推荐以下 3 套最适配模板，请选择（回复序号 1/2/3 或模板名称）：' },
          { type: 'templates', templates: DEMO_TEMPLATES },
        ],
        timestamp: Date.now(),
      });
    } else {
      // 无法识别 → 引导
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '收到你的需求。作为文生大屏智能体，你可以：\n\n📝 **描述大屏场景**：例如「帮我做一个电力运维监控大屏，深色科技风，左右看板布局」\n\n🔢 **选择模板**：回复 1/2/3 或模板名称\n\n✏️ **二次编辑**：生成大屏后输入修改指令，例如「把异常数据红色高亮」' },
        ],
        timestamp: Date.now(),
      });
    }

    setLoading(false);
  }, [input, loading, demoRunning, addMsg, store, renderDashboard, hasTemplates, isEditing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#1e293b] flex items-center gap-2 bg-[#0a0e1a]">
        <div className="w-6 h-6 rounded-md bg-cyan-500/20 flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <span className="text-xs font-semibold text-slate-200">文生大屏</span>
        <span className="text-[10px] text-cyan-400/60 ml-auto">自然语言 → 模板推荐 → 画布生成</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!hasUserMsgs && (
          <TextAgentWelcome
            onDemo={runTextDemo}
            onPrompt={(text) => handleSend(text)}
          />
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed',
              msg.role === 'user'
                ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/20'
                : 'bg-[#1e293b] text-slate-300 border border-[#334155]/50'
            )}>
              {msg.role === 'assistant' && msg.blocks.length === 0 && loading ? (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-500 ml-1">AI 正在分析需求...</span>
                </div>
              ) : (
                <RenderMessage msg={msg} selectedTpl={selectedTpl} onTemplateSelect={handleTemplateSelect} />
              )}
            </div>
          </div>
        ))}

        {/* 模板选择确认按钮 */}
        {selectedTpl && hasTemplates && !isEditing && (
          <div className="flex justify-center">
            <button
              onClick={async () => {
                const tpl = DEMO_TEMPLATES.find((t) => t.id === selectedTpl);
                if (!tpl || loading) return;
                setLoading(true);
                addMsg({ id: uid(), role: 'user', blocks: [{ type: 'text', content: `选${tpl.name}。` }], timestamp: Date.now() });
                await wait(400);
                addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: `已选择【${tpl.name}】模板，正在语义化渲染。` }], timestamp: Date.now() });
                await wait(400);
                renderDashboard();
                setLoading(false);
                addMsg({ id: uid(), role: 'assistant', blocks: [
                  { type: 'text', content: '#### 第三步：模板语义转化与大屏生成完成\n\n初版大屏已生成，所有组件可编辑。' },
                  { type: 'render_result' },
                  { type: 'text', content: '#### 第四步：开放二次编辑能力\n\n示例：把异常数据做红色高亮 / 优化告警列表样式 / 新增指标卡片' },
                ], timestamp: Date.now() });
              }}
              disabled={loading}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border',
                loading
                  ? 'bg-slate-500/10 text-slate-600 border-slate-500/20 cursor-not-allowed'
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30'
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              确认选择 — 生成大屏
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-[#1e293b] bg-[#0a0e1a]">
        <div className="flex items-end gap-2 bg-[#1e293b]/80 border border-[#334155]/50 rounded-lg px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isEditing ? '继续编辑：把异常数据红色高亮 / 新增指标卡片...' : '描述你想创建的大屏场景...'}
            rows={1}
            className="flex-1 text-xs bg-transparent text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none min-h-[20px] max-h-[80px]"
          />
          <div className="flex items-center gap-1">
            <button
              onClick={runTextDemo}
              disabled={demoRunning || loading}
              className={cn('p-1 rounded transition-colors', demoRunning || loading ? 'text-slate-600 cursor-not-allowed' : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10')}
              title="运行完整演示"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading || demoRunning}
              className={cn('p-1 rounded transition-colors', input.trim() && !loading && !demoRunning ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-600 cursor-not-allowed')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
