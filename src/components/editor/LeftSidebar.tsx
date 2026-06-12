'use client';

import React, { useState } from 'react';
import {
  Layout, Database, Layers, FolderTree, Package, ChevronLeft,
  Search, ChevronRight,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { COMPONENT_LIBRARY, COMPONENT_CATEGORIES } from '@/lib/component-library';
import { TEMPLATES } from '@/lib/templates';
import { DynamicIcon } from './DynamicIcon';
import { cn } from '@/lib/utils';
import type { LeftPanelType, ComponentType } from '@/types/editor';

const NAV_ITEMS: { key: LeftPanelType; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: 'components', icon: Layout, label: '组件库' },
  { key: 'datasource', icon: Database, label: '数据源' },
  { key: 'templates', icon: Package, label: '模板' },
  { key: 'assets', icon: Package, label: '资产' },
  { key: 'layers', icon: Layers, label: '图层' },
  { key: 'outline', icon: FolderTree, label: '大纲' },
];

export function LeftSidebar() {
  const { leftPanel, setLeftPanel, leftPanelOpen, toggleLeftPanel, addComponent, applyTemplate, components } = useEditorStore();
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredComponents = COMPONENT_LIBRARY.filter((c) => {
    const matchCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchSearch = !searchQuery || c.name.includes(searchQuery) || c.description.includes(searchQuery);
    return matchCategory && matchSearch;
  });

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('componentType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderPanelContent = () => {
    switch (leftPanel) {
      case 'components':
        return (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e293b]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索组件..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {COMPONENT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategoryFilter(cat.key)}
                    className={cn(
                      'px-2 py-0.5 rounded text-xs transition-colors',
                      categoryFilter === cat.key
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 gap-2">
                {filteredComponents.map((comp) => (
                  <div
                    key={comp.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp.type)}
                    onDoubleClick={() => addComponent(comp.type)}
                    className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg bg-[#0a0e1a] border border-[#1e293b] cursor-grab hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-colors active:cursor-grabbing group"
                  >
                    <div className="w-10 h-10 rounded-md bg-[#1e293b] flex items-center justify-center group-hover:bg-cyan-500/10 transition-colors">
                      <DynamicIcon name={comp.icon} className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <span className="text-[11px] text-slate-400 group-hover:text-slate-200 text-center leading-tight">{comp.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'templates':
        return (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e293b]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="搜索模板..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => applyTemplate(tpl)}
                  className="group cursor-pointer rounded-lg border border-[#1e293b] overflow-hidden hover:border-cyan-500/40 transition-colors"
                >
                  <div className="h-28 bg-gradient-to-br from-[#0c4a6e] to-[#1e293b] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNiwxODIsMjEyLDAuMSkiLz48L3N2Zz4=')] opacity-50" />
                    <span className="text-lg font-semibold text-cyan-400/80">{tpl.industry}</span>
                  </div>
                  <div className="p-2.5 bg-[#111827]">
                    <div className="text-xs font-medium text-slate-200">{tpl.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500">{tpl.style}</span>
                      <span className="text-[10px] text-slate-500">{tpl.components.length}个组件</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'layers':
        return (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e293b]">
              <span className="text-xs text-slate-400">图层 ({components.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {components.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-xs text-slate-600">
                  画布为空，添加组件开始创作
                </div>
              ) : (
                [...components].reverse().map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#1e293b] cursor-pointer group text-xs"
                    onClick={() => useEditorStore.getState().selectComponent(comp.id)}
                  >
                    <DynamicIcon name="Square" className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-300 flex-1 truncate">{comp.name}</span>
                    <button className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300">
                      {comp.visible ? '👁' : '🚫'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'datasource':
        return (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-[#1e293b]">
              <span className="text-xs text-slate-400">数据源</span>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-xs text-slate-500 mb-3">连接数据源以绑定真实数据</p>
                <button className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-md hover:bg-cyan-500/30 transition-colors">
                  添加数据源
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-slate-600">暂未开放</span>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full">
      {/* Icon rail */}
      <div className="w-12 bg-[#0a0e1a] border-r border-[#1e293b] flex flex-col items-center py-2 gap-1">
        {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setLeftPanel(key)}
            className={cn(
              'w-9 h-9 rounded-md flex items-center justify-center transition-colors',
              leftPanel === key && leftPanelOpen
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#1e293b]'
            )}
            title={label}
          >
            <Icon className="w-4.5 h-4.5" />
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={toggleLeftPanel}
          className="w-9 h-9 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors"
        >
          {leftPanelOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Panel content */}
      {leftPanelOpen && (
        <div className="w-[240px] bg-[#111827] border-r border-[#1e293b] overflow-hidden">
          {renderPanelContent()}
        </div>
      )}
    </div>
  );
}
