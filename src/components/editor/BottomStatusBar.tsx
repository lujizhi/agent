'use client';

import React from 'react';
import { useEditorStore } from '@/stores/editor-store';

export function BottomStatusBar() {
  const { components, selectedIds, canvasScale, editorMode } = useEditorStore();
  const selected = components.find((c) => c.id === selectedIds[0]);

  return (
    <div className="h-7 bg-[#0a0e1a] border-t border-[#1e293b] flex items-center justify-between px-3 text-[10px] text-slate-600 select-none">
      <div className="flex items-center gap-4">
        {selected && (
          <>
            <span>{selected.name}</span>
            <span>{selected.type}</span>
            <span>({selected.position.x}, {selected.position.y})</span>
            <span>{selected.size.width}×{selected.size.height}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span>{components.length} 个组件</span>
        <span>{Math.round(canvasScale * 100)}%</span>
        <span className={editorMode === 'edit' ? 'text-cyan-500/50' : editorMode === 'preview' ? 'text-amber-500/50' : 'text-emerald-500/50'}>
          {editorMode === 'edit' ? '编辑模式' : editorMode === 'preview' ? '预览模式' : '演播模式'}
        </span>
      </div>
    </div>
  );
}
