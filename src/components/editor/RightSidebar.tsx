'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  Send, Mic, Sparkles, Settings, Wand2,
  LayoutTemplate, Palette, Stethoscope, ChevronLeft, ChevronRight,
  Check, X, Play, Star,
  MessageSquare, ArrowRight, Zap, Eye,
  Lightbulb, ChevronDown, Crosshair,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';
import type { RightPanelType, CanvasComponent } from '@/types/editor';
import {
  parseDSLInstructions,
  executeInstruction,
  extractDisplayText,
  getTemplateById,
  type RecommendTemplatesInstruction,
} from '@/lib/dsl-executor';

/** Interactive demo steps — matches the new document's power scenario */
const DEMO_STEPS = [
  {
    step: 1,
    title: '意图解析',
    desc: '用自然语言描述电力大屏需求',
    prompt: '帮我做一个电力运维大数据监控大屏，深色科技风，采用左右看板布局，需要电力负荷卡片、负荷趋势折线图、站点供电量柱状图、故障预警列表',
    icon: LayoutTemplate,
    color: 'cyan',
  },
  {
    step: 2,
    title: '模板推荐',
    desc: 'AI匹配3套电力模板供你选择',
    prompt: '选第一个电力全域运维监控大屏',
    icon: Zap,
    color: 'amber',
  },
  {
    step: 3,
    title: '语义渲染',
    desc: '左右看板大屏自动生成到画布',
    prompt: '确认应用，帮我生成这个大屏',
    icon: Wand2,
    color: 'emerald',
  },
  {
    step: 4,
    title: '二次编辑',
    desc: '选中组件精准修改样式/数据/类型',
    prompt: '把异常数据做红色高亮，优化故障告警列表样式',
    icon: Settings,
    color: 'purple',
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
};

const QUICK_COMMANDS = [
  { icon: LayoutTemplate, label: '电力运维大屏', prompt: '帮我做一个电力运维大数据监控大屏，深色科技风，左右看板布局，需要电力负荷卡片、趋势折线图、站点供电量柱状图、故障预警列表', color: 'cyan' as const },
  { icon: Wand2, label: '销售驾驶舱', prompt: '帮我生成一个零售销售业绩驾驶舱，商务风，要有销售KPI、趋势图、产品对比、区域占比', color: 'amber' as const },
  { icon: Palette, label: '异常高亮', prompt: '把异常数据做红色高亮，优化故障告警列表组件样式', color: 'emerald' as const },
  { icon: Stethoscope, label: '大屏体检', prompt: '帮我检查当前大屏的设计布局问题，并给出优化建议', color: 'purple' as const },
];

const TAB_ITEMS: { key: RightPanelType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: 'ai-chat', icon: Sparkles, label: 'AI助手' },
  { key: 'properties', icon: Settings, label: '属性' },
];

/** Template recommendation card rendered in chat */
function TemplateRecommendCard({ rec, onApply, applied }: {
  rec: RecommendTemplatesInstruction['recommendations'][number] & { template?: { name: string; industry: string; style: string; components: CanvasComponent[] } };
  onApply: (templateId: string) => void;
  applied: boolean;
}) {
  const tpl = rec.template;
  if (!tpl) return null;

  return (
    <div className={cn(
      'rounded-lg border overflow-hidden transition-all group',
      applied ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-[#334155] bg-[#0a0e1a] hover:border-cyan-500/40'
    )}>
      {/* Preview */}
      <div className="h-28 bg-gradient-to-br from-[#0c4a6e] to-[#1e293b] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(6,182,212,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(245,158,11,0.2) 0%, transparent 50%)',
        }} />
        {/* Mini layout preview */}
        <div className="relative z-10 p-3 w-full">
          <div className="flex gap-1 mb-1.5">
            {tpl.components.slice(0, 4).map((comp, i) => (
              <div
                key={comp.id + i}
                className={cn(
                  'rounded-sm border',
                  comp.type.includes('kpi') || comp.type.includes('number')
                    ? 'bg-amber-500/20 border-amber-500/30'
                    : 'bg-cyan-500/20 border-cyan-500/30'
                )}
                style={{
                  width: Math.max(20, Math.min(50, comp.size.width / 12)),
                  height: comp.type.includes('kpi') || comp.type.includes('number') ? 16 : Math.max(20, Math.min(40, comp.size.height / 8)),
                }}
              />
            ))}
          </div>
          <div className="flex gap-1">
            {tpl.components.slice(4, 9).map((comp, i) => (
              <div
                key={comp.id + i}
                className={cn(
                  'rounded-sm border',
                  comp.type.includes('chart') ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-slate-500/20 border-slate-500/30'
                )}
                style={{
                  width: Math.max(16, Math.min(45, comp.size.width / 12)),
                  height: Math.max(16, Math.min(35, comp.size.height / 10)),
                }}
              />
            ))}
          </div>
        </div>
        {/* Match score badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-[9px] text-cyan-400">
          <Star className="w-2.5 h-2.5" />
          {Math.round(rec.match_score * 100)}%匹配
        </div>
        {/* Applied overlay */}
        {applied && (
          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
              <Check className="w-3.5 h-3.5" />
              已应用
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="text-xs font-medium text-slate-200 mb-1.5">{tpl.name}</div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400/80">{tpl.industry}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80">{tpl.style}</span>
          <span className="text-[10px] text-slate-500">{tpl.components.length}个组件</span>
        </div>
        <p className="text-[10px] text-slate-500 mb-2.5 leading-relaxed">{rec.reason}</p>
        <button
          onClick={() => onApply(rec.template_id)}
          disabled={applied}
          className={cn(
            'w-full py-1.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
            applied
              ? 'bg-emerald-500/15 text-emerald-400 cursor-default'
              : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
          )}
        >
          {applied ? (
            <>
              <Check className="w-3 h-3" />
              已应用到画布
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              应用此模板
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Execution result badge with details */
function ExecutionBadge({ success, message }: { success: boolean; message: string }) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-3 py-2 rounded-md text-[11px] border',
      success
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
    )}>
      {success ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <X className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{message}</span>
    </div>
  );
}

/** Workflow step indicator */
function WorkflowStepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-[#0a0e1a]/50 border-b border-[#1e293b]">
      {DEMO_STEPS.map((step, i) => {
        const colors = COLOR_MAP[step.color];
        const isActive = currentStep === step.step;
        const isDone = currentStep > step.step;
        return (
          <React.Fragment key={step.step}>
            <div className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all',
              isActive ? `${colors.bg} ${colors.text} border ${colors.border}` :
              isDone ? 'bg-emerald-500/10 text-emerald-400' : 'text-slate-600'
            )}>
              {isDone ? (
                <Check className="w-3 h-3" />
              ) : (
                <step.icon className="w-3 h-3" />
              )}
              <span>{step.title}</span>
            </div>
            {i < DEMO_STEPS.length - 1 && (
              <ArrowRight className={cn(
                'w-3 h-3 flex-shrink-0',
                currentStep > step.step ? 'text-emerald-500/50' : 'text-slate-700'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Welcome & demo guide panel */
function WelcomeGuide({ onTryDemo }: { onTryDemo: (prompt: string) => void }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-[#1e293b] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#0a0e1a]/60 hover:bg-[#0a0e1a] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium text-slate-300">试试 AI Agent 完整工作流</span>
        </div>
        <ChevronDown className={cn(
          'w-3.5 h-3.5 text-slate-500 transition-transform',
          expanded && 'rotate-180'
        )} />
      </button>

      {expanded && (
        <div className="p-3 space-y-2">
          <p className="text-[10px] text-slate-500 leading-relaxed mb-2">
            跟随以下4个步骤，体验从自然语言到大屏生成的完整AI Agent工作流：
          </p>
          {DEMO_STEPS.map((step) => {
            const colors = COLOR_MAP[step.color];
            return (
              <button
                key={step.step}
                onClick={() => onTryDemo(step.prompt)}
                className={cn(
                  'w-full flex items-start gap-2.5 p-2.5 rounded-md border transition-all text-left',
                  'hover:' + colors.bg,
                  'border-[#1e293b] hover:' + colors.border,
                  'group'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0',
                  colors.bg, colors.text
                )}>
                  <step.icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[10px] font-medium', colors.text)}>
                      步骤 {step.step}
                    </span>
                    <span className="text-[11px] font-medium text-slate-300">{step.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{step.desc}</p>
                  <div className="mt-1.5 flex items-center gap-1 px-2 py-1 rounded bg-[#0a0e1a]/80 text-[10px] text-slate-400 group-hover:text-slate-300">
                    <MessageSquare className="w-2.5 h-2.5 flex-shrink-0" />
                    <span className="truncate">&ldquo;{step.prompt}&rdquo;</span>
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 mt-1 flex-shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PropertyPanel() {
  const { components, selectedIds, updateComponent } = useEditorStore();
  const selectedComponent = components.find((c) => c.id === selectedIds[0]);

  if (!selectedComponent) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <Settings className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">选中组件查看属性</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">基础属性</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">X</label>
            <input
              type="number"
              value={selectedComponent.position.x}
              onChange={(e) => updateComponent(selectedComponent.id, { position: { ...selectedComponent.position, x: Number(e.target.value) } })}
              className="w-full px-2 py-1 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded text-slate-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">Y</label>
            <input
              type="number"
              value={selectedComponent.position.y}
              onChange={(e) => updateComponent(selectedComponent.id, { position: { ...selectedComponent.position, y: Number(e.target.value) } })}
              className="w-full px-2 py-1 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded text-slate-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">宽度</label>
            <input
              type="number"
              value={selectedComponent.size.width}
              onChange={(e) => updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, width: Number(e.target.value) } })}
              className="w-full px-2 py-1 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded text-slate-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 mb-1 block">高度</label>
            <input
              type="number"
              value={selectedComponent.size.height}
              onChange={(e) => updateComponent(selectedComponent.id, { size: { ...selectedComponent.size, height: Number(e.target.value) } })}
              className="w-full px-2 py-1 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded text-slate-300 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">组件信息</h3>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">名称</label>
          <input
            type="text"
            value={selectedComponent.name}
            onChange={(e) => updateComponent(selectedComponent.id, { name: e.target.value })}
            className="w-full px-2 py-1 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded text-slate-300 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 mb-1 block">类型</label>
          <div className="text-xs text-slate-400 px-2 py-1 bg-[#0a0e1a] border border-[#1e293b] rounded">
            {selectedComponent.type}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">显示</h3>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedComponent.visible}
              onChange={(e) => updateComponent(selectedComponent.id, { visible: e.target.checked })}
              className="rounded border-[#334155] bg-[#0a0e1a]"
            />
            可见
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedComponent.locked}
              onChange={(e) => updateComponent(selectedComponent.id, { locked: e.target.checked })}
              className="rounded border-[#334155] bg-[#0a0e1a]"
            />
            锁定
          </label>
        </div>
      </div>
    </div>
  );
}

/** Parsed assistant message with rich content */
function RichAssistantMessage({ content, onApplyTemplate, appliedTemplateIds }: {
  content: string;
  onApplyTemplate: (templateId: string) => void;
  appliedTemplateIds: Set<string>;
}) {
  const store = useEditorStore();
  const [templateRecs, setTemplateRecs] = useState<(RecommendTemplatesInstruction['recommendations'][number] & { template?: { name: string; industry: string; style: string; components: CanvasComponent[] } })[]>([]);
  const [executionResults, setExecutionResults] = useState<{ success: boolean; message: string }[]>([]);
  // Track already-executed instructions by content hash to avoid re-executing during streaming
  const executedRef = useRef(new Set<string>());

  // Re-parse on every content change (streaming chunks arrive progressively)
  useEffect(() => {
    if (!content) return;

    const instructions = parseDSLInstructions(content);
    const newRecs: typeof templateRecs = [];
    const newResults: typeof executionResults = [];

    for (const inst of instructions) {
      const hash = JSON.stringify(inst);

      if (inst.action === 'recommend_templates') {
        // Template recommendations are display-only — always derive from latest content
        const recInst = inst as RecommendTemplatesInstruction;
        const enrichedRecs = recInst.recommendations.map((r) => {
          const tpl = getTemplateById(r.template_id);
          return { ...r, template: tpl ? { name: tpl.name, industry: tpl.industry, style: tpl.style, components: tpl.components } : undefined };
        }).filter((r) => r.template);
        newRecs.push(...enrichedRecs);
      } else if (!executedRef.current.has(hash)) {
        // Only execute instructions we haven't executed yet
        executedRef.current.add(hash);
        const result = executeInstruction(inst, () => store.components, {
          addComponent: store.addComponent,
          updateComponent: store.updateComponent,
          removeComponent: store.removeComponent,
          applyTemplate: store.applyTemplateById,
          setDashboardName: store.setDashboardName,
          selectComponent: (id: string) => store.selectComponent(id),
          pushHistory: store.pushHistory,
        });
        newResults.push({ success: result.success, message: result.message });
      }
    }

    // Always update template recs (from latest content)
    setTemplateRecs(newRecs);
    // Append new execution results
    if (newResults.length > 0) {
      setExecutionResults((prev) => [...prev, ...newResults]);
    }
  }, [content, store]);

  const displayText = extractDisplayText(content);

  return (
    <div className="space-y-2">
      {/* Text content */}
      {displayText && (
        <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">{displayText}</div>
      )}

      {/* Template recommendation cards */}
      {templateRecs.length > 0 && (
        <div className="space-y-2.5 mt-2">
          <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/70">
            <LayoutTemplate className="w-3 h-3" />
            <span>为您推荐以下模板，点击应用即可生成大屏</span>
          </div>
          {templateRecs.map((rec) => (
            <TemplateRecommendCard
              key={rec.template_id}
              rec={rec}
              applied={appliedTemplateIds.has(rec.template_id)}
              onApply={onApplyTemplate}
            />
          ))}
        </div>
      )}

      {/* Execution results */}
      {executionResults.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {executionResults.map((r, i) => (
            <ExecutionBadge key={i} success={r.success} message={r.message} />
          ))}
        </div>
      )}
    </div>
  );
}

function AIChatPanel() {
  const store = useEditorStore();
  const { chatMessages, addChatMessage, setChatLoading, chatLoading, selectedComponentContext, components } = store;
  const [input, setInput] = useState('');
  const [appliedTemplateIds, setAppliedTemplateIds] = useState<Set<string>>(new Set());
  const [workflowStep, setWorkflowStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef<string>('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

  // Track workflow step based on canvas state and messages
  useEffect(() => {
    const hasUserMsg = chatMessages.some((m) => m.role === 'user');
    const hasTemplateApplied = components.length > 0;
    if (hasTemplateApplied) {
      // Check if user has done modifications beyond initial template
      const hasModifiedAfterApply = chatMessages.some(
        (m) => m.role === 'user' && (
          m.content.includes('改') || m.content.includes('换') ||
          m.content.includes('调整') || m.content.includes('添加') ||
          m.content.includes('删除') || m.content.includes('增加') ||
          m.content.includes('新增') || m.content.includes('去掉')
        )
      );
      setWorkflowStep(hasModifiedAfterApply ? 4 : 3);
    } else if (hasUserMsg && chatMessages.some((m) => m.role === 'assistant' && m.content.includes('第二步'))) {
      setWorkflowStep(2);
    } else if (hasUserMsg) {
      setWorkflowStep(1);
    } else {
      setWorkflowStep(0);
    }
  }, [chatMessages, components.length]);

  const handleApplyTemplate = useCallback((templateId: string) => {
    const result = store.applyTemplateById(templateId);
    if (result) {
      setAppliedTemplateIds((prev) => new Set([...prev, templateId]));
      setWorkflowStep(3);
      const tpl = getTemplateById(templateId);
      const compList = tpl?.components || [];
      const chartComps = compList.filter((c) => c.type.includes('chart') || c.type.includes('map'));
      const kpiComps = compList.filter((c) => c.type.includes('kpi') || c.type.includes('number') || c.type.includes('flip'));
      const otherComps = compList.filter((c) => !chartComps.includes(c) && !kpiComps.includes(c) && c.type !== 'title_text');

      // Response matching the document's 4-step workflow format
      const responseMsg = `### 第三步：模板语义转化&大屏生成完成

已基于【${tpl?.name || templateId}】模板，结合你的需求完成全量语义适配，**初版大屏已生成**，具体配置如下：

1. **全局风格**：统一${tpl?.style || '科技蓝'}主色调，搭配${tpl?.industry || '行业'}视觉规范，大气简洁
2. **整体布局**：${compList.length}个组件分区排布，层级分明、一目了然
3. **组件落地**：
${
  chartComps.length > 0 ? `- 图表模块：${chartComps.map((c) => c.name).join('、')}\n` : ''
}${
  kpiComps.length > 0 ? `- 数据卡片：${kpiComps.map((c) => c.name).join('、')}\n` : ''
}${
  otherComps.length > 0 ? `- 业务组件：${otherComps.map((c) => c.name).join('、')}\n` : ''
}4. **适配能力**：支持全屏展示、数据实时刷新，适配${tpl?.industry || '行业'}监控场景

### 第四步：开放二次编辑能力
当前初版大屏已生成，你可随时告诉我修改需求，支持：
- **单组件修改**（样式/数据/尺寸/图表类型）
- **布局调整**（模块位置/大小/间距）
- **配色更换**（全局风格/局部配色）
- **图表替换**（新增/删除数据模块、切换图表类型）
- **数据更新**（标题文案/数据源）

示例修改指令：「把折线图换成饼图」「整体色调调深一点」「新增预警列表组件」「调整卡片尺寸」`;

      addChatMessage('assistant', responseMsg);
    }
  }, [store, addChatMessage]);

  const handleSend = useCallback(async (messageText?: string) => {
    const msg = (messageText || input).trim();
    if (!msg || chatLoading) return;

    setInput('');
    addChatMessage('user', msg);
    setChatLoading(true);

    // Add empty assistant message for streaming
    addChatMessage('assistant', '');
    streamingContentRef.current = '';

    try {
      const chatHistory = chatMessages
        .filter((m) => m.role !== 'assistant' || m.content)
        .map((m) => ({ role: m.role, content: m.content }));

      // Build component summary for context
      const compSummary = components.map((c) => ({
        name: c.name,
        type: c.type,
        position: c.position,
        size: c.size,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatHistory,
          selectedContext: selectedComponentContext,
          canvasComponents: compSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                useEditorStore.getState().updateLastAssistantMessage(fullContent);
              }
              if (parsed.error) {
                fullContent += `\n\n[错误: ${parsed.error}]`;
                useEditorStore.getState().updateLastAssistantMessage(fullContent);
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : '未知错误';
      useEditorStore.getState().updateLastAssistantMessage(`抱歉，请求出错: ${errMsg}`);
    } finally {
      setChatLoading(false);
    }
  }, [input, chatLoading, chatMessages, addChatMessage, setChatLoading, selectedComponentContext, components]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Check if there are only the initial welcome message (no user messages yet)
  const hasUserMessages = chatMessages.some((m) => m.role === 'user');

  return (
    <div className="flex flex-col h-full">
      {/* Workflow step indicator */}
      {workflowStep > 0 && (
        <WorkflowStepIndicator currentStep={workflowStep} />
      )}

      {/* Context bar — show selected component for targeted modification */}
      {selectedComponentContext && (
        <div className="px-3 py-2 border-b border-cyan-500/20 bg-cyan-500/10 flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[11px] text-cyan-300 font-medium">
            已选中「{selectedComponentContext.replace(/\s*\(.*\)\s*$/, '')}」
          </span>
          <span className="text-[10px] text-cyan-400/60 ml-auto">输入指令精准修改</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Welcome guide (only show when no user messages) */}
        {!hasUserMessages && (
          <WelcomeGuide onTryDemo={(prompt) => handleSend(prompt)} />
        )}

        {chatMessages.map((msg) => (
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
                  ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/20'
                  : 'bg-[#1e293b] text-slate-300 border border-[#334155]/50'
              )}
            >
              {msg.role === 'assistant' && msg.content === '' && chatLoading ? (
                <div className="flex items-center gap-1.5 py-1">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-[10px] text-slate-500 ml-1">AI 正在思考...</span>
                </div>
              ) : msg.role === 'assistant' ? (
                <RichAssistantMessage
                  content={msg.content}
                  onApplyTemplate={handleApplyTemplate}
                  appliedTemplateIds={appliedTemplateIds}
                />
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick commands */}
      <div className="px-3 py-2 border-t border-[#1e293b]">
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_COMMANDS.map((cmd) => {
            const colors = COLOR_MAP[cmd.color];
            return (
              <button
                key={cmd.label}
                onClick={() => handleSend(cmd.prompt)}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-[10px] transition-colors border',
                  'bg-[#1e293b] text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 border-transparent'
                )}
              >
                <cmd.icon className="w-3 h-3" />
                {cmd.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Input area */}
      <div className="px-3 py-2 border-t border-[#1e293b]">
        {/* Selected component hint */}
        {selectedComponentContext && (
          <div className="flex items-center gap-1.5 mb-1.5 text-[10px] text-cyan-400/80">
            <Crosshair className="w-3 h-3" />
            <span>已选中「{selectedComponentContext.replace(/\s*\(.*\)\s*$/, '')}」，输入修改指令精准修改：</span>
          </div>
        )}
        <div className="flex items-end gap-2 bg-[#0a0e1a] border border-[#1e293b] rounded-lg px-3 py-2 focus-within:border-cyan-500/50 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedComponentContext
              ? '把它换成饼图 / 调大一点 / 改成XX...'
              : '描述你想创建的大屏或输入修改指令...'}
            rows={1}
            className="flex-1 text-xs bg-transparent text-slate-300 placeholder:text-slate-600 resize-none focus:outline-none min-h-[20px] max-h-[80px]"
          />
          <div className="flex items-center gap-1">
            <button className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors" title="语音输入">
              <Mic className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || chatLoading}
              className={cn(
                'p-1 rounded transition-colors',
                input.trim() && !chatLoading
                  ? 'text-cyan-400 hover:text-cyan-300'
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

export function RightSidebar() {
  const { rightPanel, setRightPanel, rightPanelOpen, toggleRightPanel } = useEditorStore();

  return (
    <div className="flex h-full">
      {/* Panel content */}
      {rightPanelOpen && (
        <div className="w-[340px] bg-[#111827] border-l border-[#1e293b] overflow-hidden flex flex-col">
          {/* Tab header */}
          <div className="flex items-center border-b border-[#1e293b] px-1">
            {TAB_ITEMS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setRightPanel(key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs transition-colors border-b-2',
                  rightPanel === key
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-slate-500 border-transparent hover:text-slate-300'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === 'ai-chat' && <AIChatPanel />}
            {rightPanel === 'properties' && <PropertyPanel />}
          </div>
        </div>
      )}

      {/* Icon rail */}
      <div className="w-10 bg-[#0a0e1a] border-l border-[#1e293b] flex flex-col items-center py-2 gap-1">
        {TAB_ITEMS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => {
              setRightPanel(key);
              if (!rightPanelOpen) toggleRightPanel();
            }}
            className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center transition-colors',
              rightPanel === key && rightPanelOpen
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]'
            )}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={toggleRightPanel}
          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors"
        >
          {rightPanelOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
