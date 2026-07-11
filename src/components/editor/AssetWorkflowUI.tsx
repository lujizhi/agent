'use client';

/**
 * 组件素材生成智能体 — 工作流 UI 组件集
 * 包含：资产方案卡片、意图解析卡片、图层配置详情、二次编辑结果、欢迎页、快捷命令
 */

import React from 'react';
import {
  Sparkles, Layers, Palette, Wand2, Zap, Box,
  CheckCircle2, Star, Info, ArrowRight, Gauge,
  Component, PaintBucket, Grid3X3, Tag, Monitor,
  AlertTriangle, ZapOff, Settings, PenTool, Eye,
  Activity, TriangleAlert, Play,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AssetScheme, AssetLayer, AssetIntentLabels } from '@/types/editor';

// ============================================================
// 颜色/样式常量
// ============================================================

const SCHEME_STYLES: Record<number, {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  1: {
    icon: CheckCircle2,
    color: 'cyan',
    bg: 'bg-cyan-500/5',
    border: 'border-cyan-500/30',
    label: '推荐首选',
  },
  2: {
    icon: Zap,
    color: 'amber',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/30',
    label: '视觉强化',
  },
  3: {
    icon: Sparkles,
    color: 'purple',
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/30',
    label: '轻量简约',
  },
};

const COLOR_MAP: Record<string, { text: string; bg: string; border: string }> = {
  cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  purple: { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  rose: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

// ============================================================
// 1. 资产方案卡片（增强版）
// ============================================================

export function AssetSchemeCard({
  scheme,
  selected,
  onSelect,
}: {
  scheme: AssetScheme;
  selected: boolean;
  onSelect: (index: number) => void;
}) {
  const style = SCHEME_STYLES[scheme.schemeIndex] || SCHEME_STYLES[1];
  const colors = COLOR_MAP[style.color];

  return (
    <button
      onClick={() => onSelect(scheme.schemeIndex)}
      className={cn(
        'w-full text-left border rounded-lg transition-all p-3 group',
        selected
          ? `${style.border} ${style.bg} ring-1 ring-${style.color}-500/30`
          : 'border-[#1e293b] bg-[#0a0e1a] hover:border-cyan-500/30'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          colors.bg
        )}>
          <style.icon className={cn('w-4 h-4', colors.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs font-semibold', colors.text)}>
              方案 {scheme.schemeIndex}
            </span>
            <span className="text-xs font-medium text-slate-200">
              {scheme.schemeName}
            </span>
          </div>
          <p className="text-[10px] text-slate-500">{scheme.schemeStyle}</p>
        </div>
        {selected && (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        )}
        {!selected && (
          <span className={cn(
            'text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0',
            colors.bg, colors.text
          )}>
            {style.label}
          </span>
        )}
      </div>

      {/* Visual Summary */}
      <div className="mb-2 px-2 py-1 rounded bg-[#1e293b]/40 text-[10px] text-slate-400">
        <span className="text-slate-500">风格：</span>{scheme.visualSummary}
      </div>

      {/* Components */}
      {scheme.components.length > 0 && (
        <div className="mb-1.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <Component className="w-3 h-3" />
            组件 ({scheme.components.length})
          </div>
          <div className="space-y-1">
            {scheme.components.map((c) => (
              <div key={c.id} className="flex flex-col gap-0.5 pl-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <div className="w-1 h-1 rounded-full bg-cyan-500/60" />
                  {c.name}
                </div>
                <p className="text-[9px] text-slate-500 pl-3">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {scheme.materials.length > 0 && (
        <div className="mb-1.5">
          <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-1">
            <PaintBucket className="w-3 h-3" />
            素材 ({scheme.materials.length})
          </div>
          <div className="space-y-1">
            {scheme.materials.map((m) => (
              <div key={m.id} className="flex flex-col gap-0.5 pl-4">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <div className="w-1 h-1 rounded-full bg-amber-500/60" />
                  {m.name}
                </div>
                <p className="text-[9px] text-slate-500 pl-3">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fit scene */}
      <div className="flex items-start gap-1 mt-2 pt-2 border-t border-[#1e293b]">
        <Info className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          适配：{scheme.fitScene}
        </p>
      </div>
    </button>
  );
}

// ============================================================
// 2. 资产图层信息卡片
// ============================================================

export function AssetLayerInfo({ layers }: { layers: AssetLayer[] }) {
  if (layers.length === 0) return null;

  return (
    <div className="border border-emerald-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-300">
          已生成 {layers.length} 个独立图层
        </span>
      </div>

      {/* Layer list */}
      <div className="p-2 space-y-1">
        {layers.map((layer, i) => (
          <div
            key={layer.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded text-[10px] bg-[#1e293b]/50 hover:bg-[#1e293b] transition-colors"
          >
            <span className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-slate-300 truncate flex-1">{layer.name}</span>
            <span className={cn(
              'text-[9px] px-1 py-0.5 rounded flex-shrink-0',
              layer.type === 'component'
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'bg-amber-500/10 text-amber-400'
            )}>
              {layer.type === 'component' ? '组件' : '素材'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-emerald-500/10 bg-emerald-500/5">
        <p className="text-[10px] text-slate-500">
          💡 所有图层可单独拖拽移动、缩放、隐藏、编辑样式
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 3. 意图解析标签卡片（新增）
// ============================================================

export function AssetIntentCard({ labels }: { labels: AssetIntentLabels }) {
  return (
    <div className="border border-cyan-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
        <Tag className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-medium text-cyan-300">
          用户需求意图解析完成
        </span>
        <span className="text-[10px] text-cyan-400/60 ml-auto">结构化标签</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Row 1: Industry + Style */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded bg-[#1e293b]/50 p-2">
            <span className="text-[9px] text-slate-500">所属行业</span>
            <p className="text-[11px] text-cyan-400 font-medium mt-0.5">{labels.industry}</p>
          </div>
          <div className="rounded bg-[#1e293b]/50 p-2">
            <span className="text-[9px] text-slate-500">视觉风格</span>
            <p className="text-[11px] text-amber-400 font-medium mt-0.5">{labels.style}</p>
          </div>
        </div>

        {/* Row 2: Usage scene */}
        <div className="rounded bg-[#1e293b]/50 p-2">
          <span className="text-[9px] text-slate-500">使用场景 / 画布位置</span>
          <p className="text-[11px] text-slate-300 mt-0.5">{labels.usageScene}</p>
        </div>

        {/* Row 3: Asset types */}
        <div className="rounded bg-[#1e293b]/50 p-2">
          <span className="text-[9px] text-slate-500">目标资产类型</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {labels.assetTypes.map((at, i) => (
              <span key={i} className={cn(
                'text-[10px] px-2 py-0.5 rounded-full',
                at.type === 'component'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              )}>
                {at.type === 'component' ? '组件' : '素材'} · {at.subType}
              </span>
            ))}
          </div>
        </div>

        {/* Row 4: Color scheme */}
        <div className="rounded bg-[#1e293b]/50 p-2">
          <span className="text-[9px] text-slate-500 flex items-center gap-1">
            <Palette className="w-3 h-3" /> 配色方案
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-[#334155]" style={{ backgroundColor: labels.colorScheme.background }} />
              <span className="text-[9px] text-slate-500">{labels.colorScheme.background}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-[#334155]" style={{ backgroundColor: labels.colorScheme.primary }} />
              <span className="text-[9px] text-slate-500">{labels.colorScheme.primary}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-[#334155]" style={{ backgroundColor: labels.colorScheme.accent }} />
              <span className="text-[9px] text-slate-500">{labels.colorScheme.accent}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded border border-[#334155]" style={{ backgroundColor: labels.colorScheme.warning }} />
              <span className="text-[9px] text-slate-500">{labels.colorScheme.warning}</span>
            </div>
          </div>
        </div>

        {/* Row 5: Effects */}
        {labels.effects.length > 0 && (
          <div className="rounded bg-[#1e293b]/50 p-2">
            <span className="text-[9px] text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3" /> 动效要求
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {labels.effects.map((fx, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {fx}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 4. 图层配置详情卡片（新增）
// ============================================================

export interface LayerConfigItem {
  layerName: string;
  layerType: 'component' | 'material';
  position: string;
  size: string;
  visualDetails: { label: string; value: string; status?: string }[];
  editableItems: string[];
}

export function AssetLayerConfigCard({
  schemeName,
  schemeIndex,
  layers,
  canvasPosition,
}: {
  schemeName: string;
  schemeIndex: number;
  layers: LayerConfigItem[];
  canvasPosition: string;
}) {
  const style = SCHEME_STYLES[schemeIndex] || SCHEME_STYLES[1];
  const colors = COLOR_MAP[style.color];

  return (
    <div className="border border-emerald-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2">
        <Monitor className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-medium text-emerald-300">
          画布图层实例化渲染完成
        </span>
      </div>

      {/* Summary */}
      <div className="px-3 py-2 border-b border-emerald-500/5 bg-[#1e293b]/30">
        <p className="text-[10px] text-slate-400">
          已将「方案 {schemeIndex}：{schemeName}」生成并插入当前画布。
          本次新增 <span className="text-emerald-400 font-medium">{layers.length} 个独立图层</span>
        </p>
        <p className="text-[10px] text-slate-500 mt-1">
          插入位置：{canvasPosition} · 层级：默认置于右侧看板原有图层之上，不遮挡原有内容
        </p>
      </div>

      {/* Layer details */}
      <div className="p-3 space-y-3">
        {layers.map((layer, i) => (
          <div key={i} className="rounded border border-[#1e293b] overflow-hidden">
            {/* Layer header */}
            <div className={cn(
              'px-3 py-1.5 flex items-center gap-2',
              layer.layerType === 'component' ? 'bg-cyan-500/10' : 'bg-amber-500/10'
            )}>
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded',
                layer.layerType === 'component'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-amber-500/20 text-amber-400'
              )}>
                {layer.layerType === 'component' ? '组件' : '素材'}
              </span>
              <span className="text-[11px] text-slate-200 font-medium truncate">{layer.layerName}</span>
            </div>

            {/* Config details */}
            <div className="p-2.5 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="text-[10px]">
                  <span className="text-slate-500">位置：</span>
                  <span className="text-slate-400">{layer.position}</span>
                </div>
                <div className="text-[10px]">
                  <span className="text-slate-500">尺寸：</span>
                  <span className="text-slate-400">{layer.size}</span>
                </div>
              </div>

              {/* Visual params */}
              <div className="space-y-0.5 pt-1 border-t border-[#1e293b]">
                {layer.visualDetails.map((vd, j) => (
                  <div key={j} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">{vd.label}</span>
                    <span className="text-slate-300 flex items-center gap-1">
                      {vd.value}
                      {vd.status && (
                        <span className={cn(
                          'text-[9px] px-1 rounded',
                          vd.status === '开启' ? 'bg-emerald-500/10 text-emerald-400' :
                          vd.status === '关闭' ? 'bg-slate-500/10 text-slate-500' :
                          'bg-amber-500/10 text-amber-400'
                        )}>
                          {vd.status}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Editable items */}
              <div className="pt-1 border-t border-[#1e293b]">
                <span className="text-[9px] text-slate-600 flex items-center gap-1 mb-1">
                  <Settings className="w-2.5 h-2.5" /> 可编辑项
                </span>
                <div className="flex flex-wrap gap-1">
                  {layer.editableItems.map((item, k) => (
                    <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1e293b] text-slate-500">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 5. 二次编辑结果卡片（新增）
// ============================================================

export interface EditChangeItem {
  layerName: string;
  changes: { field: string; before: string; after: string }[];
}

export function AssetEditResultCard({ changes }: { changes: EditChangeItem[] }) {
  return (
    <div className="border border-purple-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
        <PenTool className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[11px] font-medium text-purple-300">
          生成资产二次编辑完成
        </span>
      </div>

      {/* Safety notice */}
      <div className="px-3 py-2 border-b border-purple-500/5 bg-[#1e293b]/30">
        <p className="text-[10px] text-slate-400">
          ✅ 本次仅修改生成的组件和素材图层，<span className="text-emerald-400">未改动画布原有大屏内容</span>
        </p>
      </div>

      {/* Changes list */}
      <div className="p-3 space-y-2">
        {changes.map((layerChange, i) => (
          <div key={i} className="rounded border border-[#1e293b] overflow-hidden">
            <div className="px-3 py-1.5 bg-[#1e293b]/50 flex items-center gap-2">
              <Settings className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-slate-300 font-medium">{layerChange.layerName}</span>
            </div>
            <div className="p-2.5 space-y-1">
              {layerChange.changes.map((change, j) => (
                <div key={j} className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500 w-24 flex-shrink-0">{change.field}：</span>
                  <span className="text-slate-500 line-through">{change.before}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                  <span className="text-emerald-400">{change.after}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="px-3 py-2 border-t border-purple-500/10 bg-purple-500/5">
        <p className="text-[10px] text-slate-500">
          💡 所有生成资产仍为独立可编辑图层，你可以继续用自然语言调整颜色、尺寸、文字、动效、图标、透明度、层级等
        </p>
      </div>
    </div>
  );
}

// ============================================================
// 6. 资产智能体专用欢迎页（新增）
// ============================================================

export function AssetAgentWelcome({ onDemo, onPromptSelect }: {
  onDemo: () => void;
  onPromptSelect: (prompt: string) => void;
}) {
  const demoPrompts = [
    {
      icon: Component,
      label: '电力指标卡片+告警分割线',
      prompt: '电力运维监控大屏，深色科技风格，生成电力负荷指标卡片组件，搭配红色警示光效告警分割线素材，工业深蓝配色',
      desc: '组件 + 素材组合生成',
      color: 'cyan' as const,
    },
    {
      icon: PaintBucket,
      label: '智慧园区顶栏素材',
      prompt: '智慧园区运营驾驶舱，政企深蓝风格，顶部区域生成3套大屏顶栏素材，要求园区科技感，中间能放标题',
      desc: '纯素材生成',
      color: 'purple' as const,
    },
    {
      icon: Wand2,
      label: '工业底座+光效素材',
      prompt: '工业监控大屏，制作带金属质感底座素材、设备图标组件，增加粒子光效，科技蓝配色',
      desc: '底座素材 + 图标组件',
      color: 'amber' as const,
    },
    {
      icon: Grid3X3,
      label: '告警装饰素材套件',
      prompt: '给我生成一套告警光效分割线和装饰边框素材，科技蓝风格，适合电力监控大屏右侧告警看板',
      desc: '批量装饰素材',
      color: 'cyan' as const,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Agent intro */}
      <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <Box className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-purple-300">组件素材生成智能体</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          我是你的组件/素材生成助手。不用从素材库手动搜索，只需描述需求，我会：
        </p>
        <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500">
          <p>🎯 解析行业、风格、资产类型和画布位置</p>
          <p>🎨 一次生成 <span className="text-purple-400">3 套差异化方案</span> 供你选择</p>
          <p>📌 选中方案作为 <span className="text-purple-400">独立图层</span> 挂载至画布</p>
          <p>✏️ 支持对生成资产做 <span className="text-purple-400">二次编辑</span>，不影响原有大屏</p>
        </div>
      </div>

      {/* Demo prompt */}
      <button
        onClick={onDemo}
        className="w-full text-left rounded-lg border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors p-3 group"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Play className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-purple-300">运行完整演示</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">推荐</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              电力运维大屏 → 意图解析 → 3套方案 → 选择方案2 → 图层挂载 → 二次编辑
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Quick prompt cards */}
      <p className="text-[10px] text-slate-500 px-1">💬 或直接输入需求开始生成：</p>
      <div className="space-y-1.5">
        {demoPrompts.map((p) => {
          const c = COLOR_MAP[p.color];
          return (
            <button
              key={p.label}
              onClick={() => onPromptSelect(p.prompt)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors border',
                'bg-[#1e293b]/50 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 border-transparent'
              )}
            >
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', c.bg)}>
                <p.icon className={cn('w-3.5 h-3.5', c.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] text-slate-300">{p.label}</span>
                <p className="text-[9px] text-slate-500">{p.desc}</p>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 7. 资产专用快捷命令按钮（新增）
// ============================================================

export function AssetQuickCommands({ onSelect }: { onSelect: (prompt: string) => void }) {
  const commands = [
    {
      icon: Component,
      label: '电力指标卡片',
      prompt: '电力深色运维大屏，右侧告警看板生成指标卡片组件，搭配红色警示光效分割线素材',
      color: 'cyan' as const,
    },
    {
      icon: PaintBucket,
      label: '政务标题框',
      prompt: '政务简约风，生成一批标题框素材、圆角指标组件，低饱和度配色',
      color: 'amber' as const,
    },
    {
      icon: Wand2,
      label: '工业光效',
      prompt: '工业监控大屏，制作带金属质感底座素材，增加粒子光效',
      color: 'purple' as const,
    },
    {
      icon: AlertTriangle,
      label: '告警装饰',
      prompt: '给我生成一套告警光效分割线和装饰边框素材，科技蓝风格',
      color: 'rose' as const,
    },
  ];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1">
        <Sparkles className="w-3 h-3" />
        <span>资产生成示例</span>
      </div>
      <div className="space-y-1">
        {commands.map((cmd) => {
          const c = COLOR_MAP[cmd.color];
          return (
            <button
              key={cmd.label}
              onClick={() => onSelect(cmd.prompt)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors border',
                'bg-[#1e293b]/50 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/20 border-transparent'
              )}
            >
              <cmd.icon className="w-3 h-3 flex-shrink-0" />
              <span className="text-[10px]">{cmd.label}</span>
              <ArrowRight className="w-3 h-3 ml-auto flex-shrink-0 text-slate-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
