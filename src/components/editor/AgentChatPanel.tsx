'use client';

import React, { useState } from 'react';
import { Sparkles, Image, Box } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageAgentPanel } from './ImageAgentPanel';
import { AssetAgentPanel } from './AssetAgentPanel';

type AgentMode = 'text-to-screen' | 'image-to-screen' | 'asset-gen';

const AGENT_MODES: { key: AgentMode; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
  { key: 'text-to-screen', icon: Sparkles, label: '文生大屏', color: 'cyan' },
  { key: 'image-to-screen', icon: Image, label: '图生大屏', color: 'emerald' },
  { key: 'asset-gen', icon: Box, label: '组件素材', color: 'purple' },
];

const COLOR_CLASSES: Record<string, { active: string; hover: string; dot: string }> = {
  cyan:   { active: 'text-cyan-400 border-cyan-400',   hover: 'hover:text-cyan-300',   dot: 'bg-cyan-400' },
  emerald:{ active: 'text-emerald-400 border-emerald-400', hover: 'hover:text-emerald-300', dot: 'bg-emerald-400' },
  purple: { active: 'text-purple-400 border-purple-400', hover: 'hover:text-purple-300', dot: 'bg-purple-400' },
};

/** AI Chat Panel — imported from RightSidebar for reuse */
import { AIChatPanel } from './RightSidebar';

/**
 * 统一的智能体对话面板
 * 将「文生大屏」「图生大屏」「组件素材」三个智能体入口集成在同一个对话框内
 * 通过顶部模式切换栏切换不同智能体
 */
export function AgentChatPanel() {
  const [mode, setMode] = useState<AgentMode>('text-to-screen');

  return (
    <div className="flex flex-col h-full">
      {/* ─── Agent Mode Selector ─── */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e293b] bg-[#0a0e1a]/50">
        {AGENT_MODES.map(({ key, icon: Icon, label, color }) => {
          const isActive = mode === key;
          const colors = COLOR_CLASSES[color];
          return (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-transparent',
                isActive
                  ? `${colors.active} bg-${color}-500/10 border-${color}-500/20`
                  : `text-slate-500 ${colors.hover} hover:bg-[#1e293b]`
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {isActive && <span className={cn('w-1.5 h-1.5 rounded-full', colors.dot)} />}
            </button>
          );
        })}
        <div className="ml-auto text-[10px] text-slate-600">
          {mode === 'text-to-screen' && '自然语言 → 大屏'}
          {mode === 'image-to-screen' && '参考图 → 大屏'}
          {mode === 'asset-gen' && '生成组件/素材'}
        </div>
      </div>

      {/* ─── Agent Content ─── */}
      <div className="flex-1 overflow-hidden">
        {mode === 'text-to-screen' && <AIChatPanel />}
        {mode === 'image-to-screen' && <ImageAgentPanel />}
        {mode === 'asset-gen' && <AssetAgentPanel />}
      </div>
    </div>
  );
}
