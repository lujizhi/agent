'use client';

/**
 * 图片生成大屏智能体 — 独立 Agent 面板
 *
 * 完整演示流程（对齐演示脚本）：
 *   图片上传 → 预处理 → 语义解析 → 资源检索 → 双分支选择 →
 *   分支A: 模板生成 / 分支B: 从零搭建 → 画布渲染 → 交互优化 → 二次编辑
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Image, Sparkles, CheckCircle2, Layers, Zap, FileText, ImageUp } from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';
import {
  SemanticResultCard,
  BranchSelectionPanel,
} from './ImageWorkflowUI';

// ============================================================
// 消息内容类型
// ============================================================

type ImageMsgBlock =
  | { type: 'text'; content: string }
  | { type: 'semantic_json'; json: import('@/types/editor').SemanticJSON }
  | { type: 'templates'; templates: { name: string; matchScore: number; layout: string; features: string; components: string }[]; compList: string[]; matList: string[] }
  | { type: 'branch_selection'; }
  | { type: 'branch_a_layout'; detail: string }
  | { type: 'render_result'; dashboardName: string; comps: string[]; materials: string[] }
  | { type: 'interaction_events'; events: string[] }
  | { type: 'edit_result'; changes: { field: string; before: string; after: string }[] };

interface ImageChatMessage {
  id: string;
  role: 'user' | 'assistant';
  blocks: ImageMsgBlock[];
  timestamp: number;
}

// ============================================================
// 演示数据（严格按照脚本）
// ============================================================

const DEMO_USER_PROMPT = '📸 上传电力运维深色大屏参考图，补充需求：保留参考图的左右双侧看板布局，多增加几组电力负荷指标卡片，所有异常告警数据用红色高亮，中间区域不要生成 GIS 地图组件，只保留一张变电站背景底图。';

const DEMO_SEMANTIC_JSON: import('@/types/editor').SemanticJSON = {
  industry: '电力运维',
  style: '深色工业科技大屏',
  color: ['#071426', '#00CCFF', '#FF3333'],
  layout: [
    { area: 'top', w: 24, h: 3, component: ['title', 'time'] },
    { area: 'left', w: 7, h: 18, component: ['lineChart', 'barChart', 'rankList'] },
    { area: 'center', w: 10, h: 18, component: ['backgroundImage', 'statusPanel'] },
    { area: 'right', w: 7, h: 18, component: ['numCard', 'gauge', 'alarmList'] },
  ],
  material_tags: ['深色粒子背景', '蓝色发光边框', '电力设备图标', '红色告警高亮', '科技分割线'],
};

const DEMO_TEMPLATES = [
  { name: '电力全域运维监控大屏', matchScore: 93, layout: '顶部标题 + 左中右三栏结构', features: '适配区域电网综合运维场景', components: '负荷趋势、站点统计、运行指标、故障告警' },
  { name: '电网负荷监测预警大屏', matchScore: 86, layout: '顶部标题 + 双侧指标看板 + 中间主视觉', features: '告警展示能力强，适合突出故障数据', components: '负荷仪表盘、告警列表、异常趋势图' },
  { name: '变电站运行态势大屏', matchScore: 78, layout: '顶部标题 + 中心场景图 + 周边数据卡片', features: '适合强调中间变电站视觉底图', components: '设备状态卡、站点统计、运维工单列表' },
];

const DEMO_COMP_LIST = [
  '电力负荷指标卡片', '实时负荷趋势折线图', '站点供电量柱状图',
  '故障告警列表', '线路状态排名列表', '负荷占比饼图',
  '运行状态仪表盘', '顶部标题与时间组件',
];

const DEMO_MAT_LIST = [
  '深色粒子背景', '蓝色发光边框', '电力设备图标',
  '红色警示光效', '科技分割线', '变电站背景底图',
];

const DEMO_EDIT_CHANGES = [
  { field: '右侧看板-运行状态仪表盘', before: '仪表盘', after: '电力负荷占比饼图' },
  { field: '新增指标卡片', before: '无', after: '线路损耗率指标卡片' },
  { field: '中间变电站背景底图', before: '默认亮度', after: '亮度已降低' },
  { field: '布局自适应', before: '调整前', after: '已调整右侧看板间距' },
];

// ============================================================
// 卡片级 UI 组件（内联，不依赖 AssetWorkflowUI）
// ============================================================

function PreprocessingCard() {
  return (
    <div className="border border-cyan-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-medium text-cyan-300">图片预处理完成</span>
      </div>
      <div className="p-3 space-y-2 text-[10px] text-slate-400">
        <p><span className="text-slate-500">图层分割：</span>顶部标题层 · 左侧看板层 · 中间视觉层 · 右侧看板层 · 底层粒子/边框层</p>
        <p><span className="text-slate-500">空间结构：</span>顶部通栏 + 左侧分析 + 中间主视觉 + 右侧汇总告警 · 24栅格宽度</p>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">色卡：</span>
          {['#071426', '#00CCFF', '#1A78FF', '#FF3333', '#6B89A8'].map((c) => (
            <div key={c} className="w-4 h-4 rounded border border-[#334155]" style={{ backgroundColor: c }} title={c} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TemplatesCard({ templates, compList, matList }: { templates: typeof DEMO_TEMPLATES; compList: string[]; matList: string[] }) {
  return (
    <div className="border border-cyan-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-medium text-cyan-300">平台资源检索完成</span>
      </div>
      <div className="p-3 space-y-2.5">
        <div>
          <span className="text-[10px] text-slate-500">候选模板：</span>
          <div className="space-y-1 mt-1">
            {templates.map((t, i) => (
              <div key={t.name} className="flex items-center gap-2 text-[10px] bg-[#1e293b]/50 rounded px-2 py-1.5">
                <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0',
                  i === 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400')}>{i + 1}</span>
                <span className="text-slate-300 flex-1 truncate">{t.name}</span>
                <span className="text-cyan-400 font-mono flex-shrink-0">{t.matchScore}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-[10px] text-slate-500">
          <span>匹配组件：</span>
          <span className="text-slate-400">{compList.join(' · ')}</span>
        </div>
        <div className="text-[10px] text-slate-500">
          <span>匹配素材：</span>
          <span className="text-slate-400">{matList.join(' · ')}</span>
        </div>
      </div>
    </div>
  );
}

function BranchAConfirmCard() {
  return (
    <div className="border border-amber-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-[11px] font-medium text-amber-300">方案 A：选用匹配模板生成</span>
      </div>
      <div className="p-3 text-[10px] text-slate-400 space-y-1">
        <p>已选定「电力全域运维监控大屏」模板（匹配度 93%）</p>
        <p>顶部通栏(24×3) → 左侧分析(7×18) → 中间主视觉(10×18) → 右侧告警(7×18)</p>
        <p>图层：粒子背景底 → 图表/卡片中 → 标题/高亮顶</p>
        <p>配色：背景#071426 / 数据#00CCFF / 告警#FF3333</p>
      </div>
    </div>
  );
}

function RenderResultCard({ dashboardName, comps, materials }: { dashboardName: string; comps: string[]; materials: string[] }) {
  return (
    <div className="border border-emerald-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-300">画布实例渲染完成</span>
      </div>
      <div className="p-3 space-y-1.5 text-[10px] text-slate-400">
        <p>大屏名称：<span className="text-slate-300">{dashboardName}</span></p>
        <p>画布：24栅格 · 顶部 + 左侧 + 中间 + 右侧</p>
        <p>组件({comps.length})：{comps.join(' · ')}</p>
        <p>素材({materials.length})：{materials.join(' · ')}</p>
        <p className="text-emerald-400">✅ 全部支持拖拽、缩放、替换和样式修改</p>
      </div>
    </div>
  );
}

function InteractionCard() {
  const events = [
    '指标卡片点击 → 弹出负荷指标明细',
    '图表悬浮 → 展示精准数值',
    '告警列表点击 → 打开故障详情弹窗',
    '状态浮层点击 → 展示设备运行摘要',
  ];
  return (
    <div className="border border-purple-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[11px] font-medium text-purple-300">交互逻辑推理完成</span>
      </div>
      <div className="p-3 space-y-1 text-[10px] text-slate-400">
        {events.map((e, i) => <p key={i}>{i + 1}. {e}</p>)}
      </div>
    </div>
  );
}

function EditResultCard({ changes }: { changes: { field: string; before: string; after: string }[] }) {
  return (
    <div className="border border-purple-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[11px] font-medium text-purple-300">二次编辑完成</span>
      </div>
      <div className="p-3 space-y-1 text-[10px]">
        {changes.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-slate-500 w-40 flex-shrink-0 truncate">{c.field}：</span>
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
// Assistant 消息渲染器
// ============================================================

function RenderMessage({ msg }: { msg: ImageChatMessage }) {
  if (msg.role === 'user') {
    return <div className="whitespace-pre-wrap">{msg.blocks[0]?.type === 'text' ? msg.blocks[0].content : ''}</div>;
  }
  return (
    <div className="space-y-2.5">
      {msg.blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <div key={i} className="whitespace-pre-wrap text-slate-300 leading-relaxed text-xs">{block.content}</div>;
          case 'semantic_json':
            return <SemanticResultCard key={i} semantic={{ businessScene: block.json.industry, layoutDescription: block.json.layout.map(l => `${l.area}`).join('+'), nativeComponents: block.json.layout.flatMap(l => l.component), visualMaterials: block.json.material_tags, rawAnalysis: '', json: block.json }} retrieval={null} />;
          case 'templates':
            return <TemplatesCard key={i} templates={block.templates} compList={block.compList} matList={block.matList} />;
          case 'branch_selection':
            return (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-medium px-1">
                  <Zap className="w-3.5 h-3.5" />
                  请选择大屏生成方式
                </div>
              </div>
            );
          case 'branch_a_layout':
            return <BranchAConfirmCard key={i} />;
          case 'render_result':
            return <RenderResultCard key={i} dashboardName={block.dashboardName} comps={block.comps} materials={block.materials} />;
          case 'interaction_events':
            return <InteractionCard key={i} />;
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

function ImageAgentWelcome({ onDemo }: { onDemo: () => void }) {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <Image className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">图片生成大屏智能体</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">上传参考大屏截图，AI 自动解析图片结构并生成可编辑大屏：</p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
          <p>🔍 图片预处理：图层分割、结构提取、色卡识别</p>
          <p>🧠 语义解析：识别行业、风格、布局、组件、素材</p>
          <p>🔗 资源检索：匹配平台模板、组件库、素材包</p>
          <p>🔀 双分支生成：<span className="text-amber-400">模板生成</span>（快速）或 <span className="text-purple-400">从零搭建</span>（高还原）</p>
        </div>
      </div>

      {/* 演示按钮 */}
      <button
        onClick={onDemo}
        className="w-full text-left rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-colors p-3 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-300">运行完整演示</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">推荐</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">上传电力大屏参考图 → 图片解析 → 资源检索 → 方案A模板生成 → 画布渲染 → 交互优化 → 二次编辑</p>
          </div>
          <Sparkles className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
        </div>
      </button>

      <p className="text-[10px] text-slate-500 px-1">💬 也可以直接输入需求，或点击输入框旁的 📷 按钮上传参考图</p>
    </div>
  );
}

// ============================================================
// 主面板组件
// ============================================================

export function ImageAgentPanel() {
  const store = useEditorStore();
  const {
    resetImageWorkflow, setImageWorkflowStep,
  } = store;

  const [messages, setMessages] = useState<ImageChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const [branch, setBranch] = useState<'A' | 'B' | null>(null);
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number>(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasUserMsgs = messages.some((m) => m.role === 'user');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const addMsg = useCallback((msg: ImageChatMessage) => {
    setMessages((prev) => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  const uid = () => `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // ─── 上传图片 ─── 仅标记已上传，不立即执行
  const [imageUploaded, setImageUploaded] = useState(false);
  const [imageReqText, setImageReqText] = useState('保留参考图的左右双侧看板布局，多增加几组电力负荷指标卡片，所有异常告警数据用红色高亮，中间区域不要生成 GIS 地图组件，只保留一张变电站背景底图。');

  const handleImageUpload = useCallback(() => {
    if (loading || demoRunning) return;
    setImageUploaded(true);
  }, [loading, demoRunning]);

  // ─── 执行图片解析流程 ───
  const executeImageAnalysis = useCallback(async (reqText: string) => {
    const fullMsg = `📸 上传图片：电力运维深色大屏参考图.png（2.4MB）\n\n补充需求：${reqText}`;
    addMsg({ id: uid(), role: 'user', blocks: [{ type: 'text', content: fullMsg }], timestamp: Date.now() });
    setImageUploaded(false);
    setLoading(true);

    await wait(500);
    setImageWorkflowStep('semantic_analysis');
    store.setImageSemantic({ businessScene: '电力运维监控', layoutDescription: '顶部通栏 + 左侧分析 + 中间主视觉 + 右侧告警', nativeComponents: DEMO_SEMANTIC_JSON.layout.flatMap((l) => l.component), visualMaterials: DEMO_SEMANTIC_JSON.material_tags, rawAnalysis: '', json: DEMO_SEMANTIC_JSON });
    addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '已接收参考图片，开始执行图片预处理。\n\n#### 第一步：图片预处理完成\n\n已完成：画面降噪、边缘裁剪、画布校正、图层语义分割（5层）、空间结构提取（24栅格）、色卡提取。' }], timestamp: Date.now() });
    await wait(400);
    addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '#### 第二步：多模态图像深度语义解析完成' }, { type: 'semantic_json', json: DEMO_SEMANTIC_JSON }, { type: 'text', content: '中间区域：不生成GIS地图，仅保留变电站背景底图。' }], timestamp: Date.now() });
    await wait(400);
    setImageWorkflowStep('vector_retrieval');
    store.setImageRetrieval({ templates: DEMO_TEMPLATES.map((t) => ({ template_id: 'tpl-power-monitor', name: t.name, industry: '电力', style: '深色科技风', matchScore: t.matchScore, reason: t.features, layout: t.layout, coreComponents: t.components.split('、') })), matchedComponents: DEMO_COMP_LIST, matchedMaterials: DEMO_MAT_LIST, colorScheme: { background: '#071426', primary: '#00CCFF', secondary: '#1A78FF', accent: '#FF3333', warning: '#FF3333', textPrimary: '#FFFFFF', textSecondary: '#6B89A8' } });
    addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '#### 第三步：平台资源向量检索完成' }, { type: 'templates', templates: DEMO_TEMPLATES, compList: DEMO_COMP_LIST, matList: DEMO_MAT_LIST }], timestamp: Date.now() });
    await wait(400);
    setImageWorkflowStep('branch_selection');
    addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '#### 第四步：请选择大屏生成方式\n\n**方案 A：选用匹配模板生成** — 快速、规整\n**方案 B：从零空白画布搭建** — 高还原、自由度高\n\n请回复「方案A」或「方案B」。' }, { type: 'branch_selection' }], timestamp: Date.now() });
    setLoading(false);
  }, [addMsg, store, setImageWorkflowStep]);

  // ─── 画布渲染：预加载电力运维大屏组件 ───
  const renderDashboardToCanvas = useCallback(() => {
    // 清空画布现有内容（先获取ID快照，避免迭代中修改数组）
    const ids = store.components.map((c) => c.id);
    ids.forEach((id) => store.removeComponent(id));

    // 顶部标题
    store.addComponent('title_text', { x: 500, y: 10 }, '电力运维大数据监控平台', { width: 920, height: 50 });

    // 左侧分析看板
    store.addComponent('line_chart', { x: 20, y: 75 }, '全网负荷趋势折线图', { width: 440, height: 260 });
    store.addComponent('bar_chart', { x: 20, y: 350 }, '站点供电量柱状图', { width: 440, height: 260 });

    // 中间主视觉区（变电站背景 + 地图）
    store.addComponent('map_chart', { x: 480, y: 75 }, '变电站运行态势图', { width: 460, height: 535 });

    // 右侧看板：指标卡片 + 仪表盘 + 告警列表
    store.addComponent('kpi_card', { x: 970, y: 75 }, '实时总负荷', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1210, y: 75 }, '峰值负荷', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1430, y: 75 }, '线路完好率', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 1650, y: 75 }, '异常线路数', { width: 220, height: 110 });
    store.addComponent('kpi_card', { x: 970, y: 200 }, '当前故障数', { width: 220, height: 110 });
    store.addComponent('gauge_chart', { x: 970, y: 325 }, '运行状态仪表盘', { width: 450, height: 200 });
    store.addComponent('alarm_list', { x: 970, y: 540 }, '故障告警列表', { width: 930, height: 70 });

    // 装饰
    store.addComponent('border_decoration', { x: 970, y: 325 }, '发光边框', { width: 930, height: 235 });

    store.pushHistory('图片生成大屏渲染');
    setTimeout(() => store.fitCanvas(), 200);
  }, [store]);

  // ─── 处理发送：有上传图片则执行解析，否则走文本流程 ───
  const handleSend = useCallback(async (messageText?: string) => {
    // 有上传图片 → 执行图片解析
    if (imageUploaded) {
      executeImageAnalysis(imageReqText);
      return;
    }

    const msg = (messageText || input).trim();
    if (!msg || loading || demoRunning) return;
    setInput('');
    addMsg({ id: uid(), role: 'user', blocks: [{ type: 'text', content: msg }], timestamp: Date.now() });
    setLoading(true);

    const isBranchA = msg.includes('方案A') || msg.includes('方案 A') || msg.includes('分支A') || msg.includes('模板生成') || (msg.includes('模板') && !msg.includes('从零'));
    const isBranchB = msg.includes('方案B') || msg.includes('方案 B') || msg.includes('分支B') || msg.includes('从零');
    const isEdit = msg.includes('替换') || msg.includes('换成') || msg.includes('新增') || msg.includes('调暗') || msg.includes('调亮') || msg.includes('修改') || msg.includes('改') || msg.includes('调整') || msg.includes('删除');

    await wait(400);

    if (isBranchA) {
      setBranch('A'); setImageWorkflowStep('layout_generation'); store.setImageBranch('template');
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: `已选择方案 A：选用「${DEMO_TEMPLATES[0].name}」模板。画布渲染中...` }, { type: 'branch_a_layout', detail: '24×21栅格, 四区域' }], timestamp: Date.now() });
      await wait(300);
      renderDashboardToCanvas(); setImageWorkflowStep('completed');
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '#### 画布渲染完成\n\n已生成可编辑大屏初稿。✅ 支持拖拽、缩放、替换。' }, { type: 'render_result', dashboardName: '电力运维大数据监控平台', comps: ['标题', '趋势折线图', '柱状图', '指标卡片组', '仪表盘', '告警列表'], materials: ['发光边框', '分割线'] }, { type: 'text', content: '可继续输入编辑指令。' }], timestamp: Date.now() });
    } else if (isBranchB) {
      setBranch('B'); setImageWorkflowStep('layout_generation'); store.setImageBranch('from_scratch');
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '已选择方案 B：从零空白画布搭建。高度还原参考图布局。' }], timestamp: Date.now() });
      await wait(300);
      renderDashboardToCanvas(); setImageWorkflowStep('completed');
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '#### 从零搭建渲染完成\n\n所有组件已实例化。✅ 全部支持二次编辑。' }, { type: 'render_result', dashboardName: '电力运维大数据监控平台', comps: ['标题', '趋势折线图', '柱状图', '排名列表', '指标卡片组', '仪表盘', '告警列表'], materials: ['粒子背景', '发光边框'] }], timestamp: Date.now() });
    } else if (isEdit) {
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '已收到二次修改需求。\n\n#### 二次编辑完成' }, { type: 'edit_result', changes: DEMO_EDIT_CHANGES }, { type: 'text', content: '优化完成。' }], timestamp: Date.now() });
    } else {
      addMsg({ id: uid(), role: 'assistant', blocks: [{ type: 'text', content: '收到你的需求。作为图片生成大屏智能体，你可以：\n\n📸 点击输入框旁的 📷 按钮上传参考图\n🔀 解析完成后回复「方案A」或「方案B」选择生成方式\n✏️ 生成后输入修改指令做二次编辑' }], timestamp: Date.now() });
    }
    setLoading(false);
  }, [input, loading, demoRunning, imageUploaded, imageReqText, addMsg, store, setImageWorkflowStep, renderDashboardToCanvas, executeImageAnalysis]);

  // ─── 完整演示流程 ───
  const runImageDemo = useCallback(async () => {
    if (demoRunning) return;
    setDemoRunning(true);
    setLoading(true);
    setMessages([]);
    setBranch(null);
    resetImageWorkflow();

    // ===== Step 1: 用户上传图片 =====
    await wait(400);
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: DEMO_USER_PROMPT }],
      timestamp: Date.now(),
    });

    // ===== Step 2: 图片预处理 =====
    await wait(700);
    setLoading(false);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '已接收参考图片，开始执行图片预处理、图层分割、结构提取和视觉特征分析。\n\n#### 第一步：图片预处理完成\n\n已完成：画面降噪、边缘裁剪、画布校正、图层语义分割（5层）、空间结构提取（24栅格）、色卡提取。' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 3: 语义解析 =====
    await wait(500);
    setImageWorkflowStep('semantic_analysis');
    store.setImageSemantic({
      businessScene: '电力运维监控',
      layoutDescription: '顶部通栏 + 左侧分析 + 中间主视觉 + 右侧告警',
      nativeComponents: DEMO_SEMANTIC_JSON.layout.flatMap((l) => l.component),
      visualMaterials: DEMO_SEMANTIC_JSON.material_tags,
      rawAnalysis: '',
      json: DEMO_SEMANTIC_JSON,
    });
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第二步：多模态图像深度语义解析完成\n\n已根据参考图和你的补充需求，生成结构化解析结果：' },
        { type: 'semantic_json', json: DEMO_SEMANTIC_JSON },
        { type: 'text', content: '识别组件：指标卡片、折线图、柱状图、排名列表、仪表盘、告警列表、标题、时间。\n\n中间区域处理：根据要求，不生成原生GIS地图组件，仅保留变电站背景底图和状态浮层。' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 4: 资源检索 =====
    await wait(500);
    setImageWorkflowStep('vector_retrieval');
    store.setImageRetrieval({
      templates: DEMO_TEMPLATES.map((t) => ({
        template_id: 'tpl-power-monitor',
        name: t.name,
        industry: '电力',
        style: '深色科技风',
        matchScore: t.matchScore,
        reason: t.features,
        layout: t.layout,
        coreComponents: t.components.split('、'),
      })),
      matchedComponents: DEMO_COMP_LIST,
      matchedMaterials: DEMO_MAT_LIST,
      colorScheme: { background: '#071426', primary: '#00CCFF', secondary: '#1A78FF', accent: '#FF3333', warning: '#FF3333', textPrimary: '#FFFFFF', textSecondary: '#6B89A8' },
    });
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第三步：平台资源向量检索完成\n\n已基于行业、布局、风格、色卡和组件语义召回平台资源。' },
        { type: 'templates', templates: DEMO_TEMPLATES, compList: DEMO_COMP_LIST, matList: DEMO_MAT_LIST },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 5: 双分支选择引导 =====
    await wait(500);
    setImageWorkflowStep('branch_selection');
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第四步：请选择大屏生成方式\n\n图片解析与资源检索已完成。当前可提供两种生成方式：\n\n**方案 A：选用匹配模板生成** — 复用平台成熟电力行业模板骨架，生成速度快、布局规整、组件完整。可从上方3套候选模板中选择1套。\n\n**方案 B：从零空白画布搭建** — 不使用模板，完全基于参考图解析结果重构栅格，对原图布局和视觉还原度更高。' },
        { type: 'branch_selection' },
        { type: 'text', content: '请选择生成方式。可点击下方按钮或输入「方案A」/「方案B」。' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 6: 自动选择方案A =====
    await wait(1500);
    setBranch('A');
    addMsg({
      id: uid(), role: 'user',
      blocks: [{ type: 'text', content: '选择方案 A，使用第 1 套「电力全域运维监控大屏」模板。' }],
      timestamp: Date.now(),
    });

    // ===== Step 7: 分支A布局方案 =====
    await wait(500);
    setImageWorkflowStep('layout_generation');
    store.setImageSelectedTemplateId('tpl-power-monitor');
    store.setImageBranch('template');
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '已选择方案 A，并选定模板「电力全域运维监控大屏」。\n\n#### 第五步：分支 A 栅格布局重构方案\n\n复用成熟电力运维栅格骨架，结合参考图解析结果进行组件替换与视觉微调。' },
        { type: 'branch_a_layout', detail: '顶部通栏(24×3) + 左侧分析(7×18) + 中间主视觉(10×18) + 右侧告警(7×18)' },
        { type: 'text', content: '图层排序：底层(粒子背景+变电站底图) → 中层(图表/卡片/告警) → 顶层(标题/高亮/边框)' },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 8: 画布渲染 =====
    await wait(500);
    setImageWorkflowStep('rendering');
    setLoading(true);
    // 渲染大屏到画布
    renderDashboardToCanvas();
    setLoading(false);
    setImageWorkflowStep('completed');
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第六步：平台实例渲染完成\n\n已基于「电力全域运维监控大屏」模板骨架，结合参考图片视觉特征和你的文字需求，生成可编辑大屏初稿。' },
        { type: 'render_result', dashboardName: '电力运维大数据监控平台', comps: ['标题', '时间', '趋势折线图', '柱状图', '排名列表', '变电站底图', '指标卡片组', '仪表盘', '告警列表', '发光边框'], materials: ['深色粒子背景', '蓝色发光边框', '电力设备图标', '红色警示光效', '科技分割线', '变电站底图'] },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 9: 交互事件 =====
    await wait(400);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第七步：交互逻辑推理与全局后处理优化完成\n\n已自动生成基础交互事件，并完成画布后处理优化（间距均衡、对比度修正、字号统一、图层分层、平滑动画）。' },
        { type: 'interaction_events', events: ['指标卡片点击→明细', '图表悬浮→数值', '告警列表点击→详情', '状态浮层点击→摘要'] },
      ],
      timestamp: Date.now(),
    });

    // ===== Step 10: 开放二次编辑 =====
    await wait(400);
    addMsg({
      id: uid(), role: 'assistant',
      blocks: [
        { type: 'text', content: '#### 第八步：大屏初稿生成完成，可继续二次编辑\n\n当前图片生成大屏初稿已完成，所有组件、素材、布局、配色和交互均可在编辑器中继续修改。\n\n你可以继续调整：组件（新增/删除/替换）、布局（区域宽高/位置）、视觉（配色/光效）、交互（点击/悬浮/联动）。\n\n**示例修改指令：**\n- 把右侧仪表盘替换成饼图\n- 再增加一组线路损耗指标卡\n- 中间变电站底图调暗一点\n- 告警列表只展示高危和中危' },
      ],
      timestamp: Date.now(),
    });

    setDemoRunning(false);
  }, [demoRunning, addMsg, store, resetImageWorkflow, setImageWorkflowStep, renderDashboardToCanvas]);

  // ─── 分支选择处理 ───
  const handleBranchChoice = useCallback(async (choice: 'A' | 'B') => {
    if (demoRunning || loading) return;
    setBranch(choice);
    if (choice === 'A') {
      addMsg({
        id: uid(), role: 'user',
        blocks: [{ type: 'text', content: `选择方案 A，使用第 ${selectedTemplateIdx} 套「${DEMO_TEMPLATES[selectedTemplateIdx - 1].name}」模板。` }],
        timestamp: Date.now(),
      });
      await wait(400);
      setImageWorkflowStep('layout_generation');
      store.setImageBranch('template');
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: `已选择方案 A：选用「${DEMO_TEMPLATES[selectedTemplateIdx - 1].name}」模板。\n\n#### 第五步：分支 A 栅格布局重构方案\n\n复用成熟栅格骨架：顶部(24×3) + 左侧(7×18) + 中间(10×18) + 右侧(7×18)` },
          { type: 'branch_a_layout', detail: '24×21栅格, 四区域' },
        ],
        timestamp: Date.now(),
      });
      await wait(400);
      setImageWorkflowStep('rendering');
      setLoading(true);
      renderDashboardToCanvas();
      setLoading(false);
      setImageWorkflowStep('completed');
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '#### 第六步：平台实例渲染完成\n\n所有组件实例化完毕，画布可编辑。' },
          { type: 'render_result', dashboardName: '电力运维大数据监控平台', comps: ['标题', '趋势折线图', '柱状图', '指标卡片组', '仪表盘', '告警列表'], materials: ['发光边框', '分割线'] },
          { type: 'text', content: '#### 第七+八步：交互 + 二次编辑\n\n✅ 已自动生成交互事件\n✅ 支持全维度二次编辑\n\n> 💡 可在画布中选中组件，输入指令精细调整。' },
        ],
        timestamp: Date.now(),
      });
    } else {
      addMsg({
        id: uid(), role: 'user',
        blocks: [{ type: 'text', content: '选择方案 B，从零空白画布搭建，不使用模板。' }],
        timestamp: Date.now(),
      });
      await wait(400);
      setImageWorkflowStep('layout_generation');
      store.setImageBranch('from_scratch');
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '已选择方案 B：从零空白画布搭建。\n\n#### 第五步：分支 B 栅格布局重构方案\n\n不使用模板骨架，仅基于图片解析结果重构标准化栅格。\n\n画布：24×21栅格\n顶部(24×3)：标题 + 时间\n左侧(7×18)：折线图 + 柱状图 + 排名列表\n中间(10×18)：变电站底图 + 状态浮层\n右侧(7×18)：指标卡片 + 仪表盘 + 告警列表\n\n未使用模板骨架，布局比例1:1复刻参考图。' },
        ],
        timestamp: Date.now(),
      });
      await wait(400);
      setLoading(true);
      setImageWorkflowStep('rendering');
      renderDashboardToCanvas();
      setLoading(false);
      setImageWorkflowStep('completed');
      addMsg({
        id: uid(), role: 'assistant',
        blocks: [
          { type: 'text', content: '#### 第六步：从零搭建渲染完成\n\n✅ 所有组件实例化为平台可编辑组件\n✅ 中间区域保留变电站底图，不生成GIS地图\n✅ 异常告警统一红色高亮' },
          { type: 'render_result', dashboardName: '电力运维大数据监控平台', comps: ['标题', '趋势折线图', '柱状图', '排名列表', '指标卡片组', '仪表盘', '告警列表'], materials: ['粒子背景', '发光边框'] },
          { type: 'text', content: '#### 第七+八步：交互 + 二次编辑\n\n✅ 已自动生成交互事件，可继续编辑。' },
        ],
        timestamp: Date.now(),
      });
    }
  }, [demoRunning, loading, addMsg, store, setImageWorkflowStep, renderDashboardToCanvas, selectedTemplateIdx]);

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
        <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
          <Image className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <span className="text-xs font-semibold text-slate-200">图片生成大屏</span>
        <span className="text-[10px] text-amber-400/60 ml-auto">参考图 → 解析 → 双分支 → 画布</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {!hasUserMsgs && <ImageAgentWelcome onDemo={runImageDemo} />}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[92%] rounded-lg px-3 py-2 text-xs leading-relaxed',
              msg.role === 'user'
                ? 'bg-amber-500/20 text-amber-100 border border-amber-500/20'
                : 'bg-[#1e293b] text-slate-300 border border-[#334155]/50'
            )}>
              {msg.role === 'assistant' && msg.blocks.length === 0 && loading ? (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-500 ml-1">AI 正在分析图片...</span>
                </div>
              ) : (
                <RenderMessage msg={msg} />
              )}
            </div>
          </div>
        ))}

        {/* Branch selection buttons */}
        {!branch && messages.some((m) => m.blocks.some((b) => b.type === 'branch_selection')) && (
          <div className="space-y-2">
            <button onClick={() => handleBranchChoice('A')} className="w-full text-left border border-amber-500/30 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-3 group">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                方案 A：选用匹配模板生成
              </div>
              <p className="text-[10px] text-slate-500 mt-1">复用平台成熟电力行业模板骨架，生成速度快、布局规整</p>
            </button>
            <button onClick={() => handleBranchChoice('B')} className="w-full text-left border border-purple-500/30 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 transition-colors p-3 group">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Zap className="w-3.5 h-3.5" />
                方案 B：从零空白画布搭建
              </div>
              <p className="text-[10px] text-slate-500 mt-1">不使用模板骨架，完全基于参考图解析结果重构栅格，还原度更高</p>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[#1e293b] bg-[#0a0e1a]">
        {/* ── 图片上传预览区 ── */}
        {imageUploaded && (
          <div className="px-3 py-2 border-b border-[#1e293b] space-y-2">
            <div className="flex items-center gap-3">
              {/* 缩略图 */}
              <div className="w-20 h-14 rounded-md overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#071426] via-[#0c2d4a] to-[#0a1629] border border-amber-500/30 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full px-2 space-y-0.5">
                    <div className="h-1.5 bg-cyan-500/20 rounded w-2/3 mx-auto" />
                    <div className="flex gap-0.5">
                      <div className="flex-1 h-6 bg-cyan-500/10 rounded-sm" />
                      <div className="flex-1 h-6 bg-amber-500/10 rounded-sm" />
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 flex items-center justify-between">
                  <span className="text-[7px] text-slate-400 truncate">电力运维大屏参考图</span>
                  <span className="text-[7px] text-slate-600">2.4MB</span>
                </div>
                <button onClick={() => setImageUploaded(false)} className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-black/70 text-slate-400 hover:text-red-400 flex items-center justify-center">
                  <svg className="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* 需求文本 */}
              <textarea
                value={imageReqText}
                onChange={(e) => setImageReqText(e.target.value)}
                rows={3}
                className="flex-1 text-[10px] bg-[#1e293b] border border-[#334155] rounded-md text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none focus:border-amber-500/50 px-2 py-1.5"
                placeholder="补充需求描述..."
              />
            </div>
          </div>
        )}

        <div className="flex items-end gap-2 px-3 py-2">
          <div className="flex items-end gap-2 bg-[#1e293b]/80 border border-[#334155]/50 rounded-lg px-3 py-2 focus-within:border-amber-500/50 transition-colors flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={imageUploaded ? '图片已上传，点击发送开始解析...' : branch ? '继续编辑：替换仪表盘为饼图 / 新增指标卡...' : '输入需求，或点击 📷 按钮上传参考图...'}
              rows={1}
              className="flex-1 text-xs bg-transparent text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none min-h-[20px] max-h-[80px]"
            />
            <div className="flex items-center gap-1">
              <button
                onClick={handleImageUpload}
                disabled={loading || demoRunning || imageUploaded}
                className={cn('p-1 rounded transition-colors', loading || demoRunning || imageUploaded ? 'text-slate-600 cursor-not-allowed' : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10')}
                title="上传参考图片"
              >
                <ImageUp className="w-4 h-4" />
              </button>
              <button
                onClick={runImageDemo}
                disabled={demoRunning || loading}
                className={cn('p-1 rounded transition-colors', demoRunning || loading ? 'text-slate-600 cursor-not-allowed' : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10')}
                title="运行完整演示"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleSend()}
                disabled={(!input.trim() && !imageUploaded) || loading || demoRunning}
                className={cn('p-1 rounded transition-colors', (input.trim() || imageUploaded) && !loading && !demoRunning ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 cursor-not-allowed')}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
