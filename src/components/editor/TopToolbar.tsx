'use client';

import React from 'react';
import {
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize2,
  Eye, Play, Monitor, Save, Share2, Download,
  ChevronDown, Sparkles, Cpu,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';

export function TopToolbar() {
  const {
    dashboardName, editorMode, setEditorMode,
    canvasScale, setCanvasScale, fitCanvas, undo, redo,
    history, historyIndex, rightPanelOpen, toggleRightPanel,
  } = useEditorStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="h-12 bg-[#111827] border-b border-[#1e293b] flex items-center justify-between px-3 select-none">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-cyan-400">BI Editor</span>
        </div>
        <div className="w-px h-6 bg-[#1e293b]" />
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-300 truncate max-w-[200px]">{dashboardName}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <span className="text-xs text-slate-500">已保存</span>
      </div>

      {/* Center */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'p-1.5 rounded transition-colors',
            canUndo ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]' : 'text-slate-600 cursor-not-allowed'
          )}
          title="撤销 (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'p-1.5 rounded transition-colors',
            canRedo ? 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]' : 'text-slate-600 cursor-not-allowed'
          )}
          title="重做 (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[#1e293b] mx-1" />
        <button
          onClick={() => setCanvasScale(canvasScale - 0.1)}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-400 w-12 text-center">{Math.round(canvasScale * 100)}%</span>
        <button
          onClick={() => setCanvasScale(canvasScale + 0.1)}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={fitCanvas}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors"
          title="适应画布（自适应显示全部组件）"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[#1e293b] mx-1" />
        {/* Mode switches */}
        <div className="flex items-center bg-[#0a0e1a] rounded-md p-0.5">
          {([
            { mode: 'edit' as const, icon: Monitor, label: '编辑' },
            { mode: 'preview' as const, icon: Eye, label: '预览' },
            { mode: 'presentation' as const, icon: Play, label: '演播' },
          ]).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setEditorMode(mode)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors',
                editorMode === mode
                  ? 'bg-[#1e293b] text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleRightPanel}
          className={cn(
            'p-1.5 rounded transition-colors',
            rightPanelOpen ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-400 hover:text-slate-200 hover:bg-[#1e293b]'
          )}
          title="AI助手"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors" title="大屏体检">
          <Sparkles className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors" title="分享">
          <Share2 className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors" title="预览">
          <Eye className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors" title="保存">
          <Save className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-colors" title="导出">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
