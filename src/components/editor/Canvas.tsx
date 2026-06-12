'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { getChartOption, generateMockData } from '@/lib/chart-config';
import { cn } from '@/lib/utils';
import type { CanvasComponent, ComponentType } from '@/types/editor';
import dynamic from 'next/dynamic';

const ReactEChartsCore = dynamic(() => import('echarts-for-react'), { ssr: false });

function ChartComponent({ component }: { component: CanvasComponent }) {
  const option = getChartOption(component);
  const { editorMode } = useEditorStore();
  if (!option) return null;
  return (
    <ReactEChartsCore
      option={option}
      style={{ width: '100%', height: '100%', pointerEvents: editorMode === 'edit' ? 'none' : 'auto' }}
      opts={{ renderer: 'canvas' }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

function KpiCard({ component }: { component: CanvasComponent }) {
  const data = generateMockData(component.type, component.id) as { value: number; label: string; unit: string; trend: number; trendLabel: string };
  return (
    <div className="w-full h-full bg-[#1e293b]/50 rounded-lg border border-[#334155] p-3 flex flex-col justify-between">
      <span className="text-xs text-slate-400">{data.label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-cyan-400 font-mono">{data.value.toLocaleString()}</span>
        <span className="text-xs text-slate-500">{data.unit}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className={cn('text-xs font-medium', data.trend >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
          {data.trend >= 0 ? '↑' : '↓'} {Math.abs(data.trend)}%
        </span>
        <span className="text-[10px] text-slate-500">{data.trendLabel}</span>
      </div>
    </div>
  );
}

function NumberFlip({ component }: { component: CanvasComponent }) {
  const overrideText = (component.props as Record<string, unknown>)?.text as string | undefined;
  const data = generateMockData(component.type, component.id) as { value: number; label: string };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
      <span className="text-xs text-slate-500 mb-1">{overrideText || data.label}</span>
      <span className="text-3xl font-bold text-cyan-400 font-mono tracking-wider">{data.value.toLocaleString()}</span>
    </div>
  );
}

function RankingList({ component }: { component: CanvasComponent }) {
  const data = generateMockData(component.type, component.id) as { items: { name: string; value: number }[] };
  const maxVal = Math.max(...data.items.map((i) => i.value));
  return (
    <div className="w-full h-full p-3 space-y-2 overflow-hidden">
      {data.items.slice(0, 6).map((item, idx) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className={cn('w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold',
            idx < 3 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-700/50 text-slate-500'
          )}>{idx + 1}</span>
          <span className="text-xs text-slate-300 w-12 truncate">{item.name}</span>
          <div className="flex-1 h-4 bg-[#0a0e1a] rounded-sm overflow-hidden">
            <div
              className="h-full rounded-sm bg-gradient-to-r from-cyan-600 to-cyan-400"
              style={{ width: `${(item.value / maxVal) * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-400 w-12 text-right font-mono">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressBarComp({ component }: { component: CanvasComponent }) {
  const data = generateMockData(component.type, component.id) as { value: number; label: string };
  return (
    <div className="w-full h-full flex items-center gap-3 px-3">
      <span className="text-xs text-slate-400 whitespace-nowrap">{data.label}</span>
      <div className="flex-1 h-3 bg-[#0a0e1a] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
          style={{ width: `${data.value}%` }}
        />
      </div>
      <span className="text-xs text-cyan-400 font-mono font-semibold">{data.value}%</span>
    </div>
  );
}

function TableView({ component }: { component: CanvasComponent }) {
  const data = generateMockData(component.type, component.id) as { columns: string[]; rows: (string | number)[][] };
  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#1e293b]">
            {data.columns.map((col) => (
              <th key={col} className="px-2 py-1.5 text-left text-slate-400 font-medium">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, idx) => (
            <tr key={idx} className="border-b border-[#1e293b]/50 hover:bg-[#1e293b]/30">
              {row.map((cell, ci) => (
                <td key={ci} className="px-2 py-1.5 text-slate-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TitleText({ component }: { component: CanvasComponent }) {
  const displayText = (component.props as Record<string, unknown>)?.text as string || component.name;
  return (
    <div className="w-full h-full flex items-center justify-center">
      <h2 className="text-lg font-semibold text-slate-100 tracking-wide">{displayText}</h2>
    </div>
  );
}

function BorderDecoration({ component }: { component: CanvasComponent }) {
  return (
    <div className="w-full h-full rounded-lg border border-cyan-500/30 p-3 relative">
      <div className="absolute top-0 left-3 w-8 h-px bg-cyan-400" />
      <div className="absolute bottom-0 right-3 w-8 h-px bg-cyan-400" />
      <div className="absolute top-3 left-0 w-px h-6 bg-cyan-400" />
      <div className="absolute bottom-3 right-0 w-px h-6 bg-cyan-400" />
    </div>
  );
}

function IconDecoration({ component }: { component: CanvasComponent }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
      </div>
    </div>
  );
}

const COMPONENT_RENDERERS: Record<string, React.ComponentType<{ component: CanvasComponent }>> = {
  bar_chart: ChartComponent,
  line_chart: ChartComponent,
  pie_chart: ChartComponent,
  ring_chart: ChartComponent,
  area_chart: ChartComponent,
  scatter_chart: ChartComponent,
  radar_chart: ChartComponent,
  funnel_chart: ChartComponent,
  gauge_chart: ChartComponent,
  liquid_chart: ChartComponent,
  map_chart: ChartComponent,
  title_text: TitleText,
  number_flip: NumberFlip,
  kpi_card: KpiCard,
  ranking_list: RankingList,
  progress_bar: ProgressBarComp,
  table_view: TableView,
  border_decoration: BorderDecoration,
  icon_decoration: IconDecoration,
};

function CanvasItem({ component, isSelected, onSelect, onUpdate }: {
  component: CanvasComponent;
  isSelected: boolean;
  onSelect: (id: string, e: React.MouseEvent) => void;
  onUpdate: (id: string, updates: Partial<CanvasComponent>) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, compX: 0, compY: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const Renderer = COMPONENT_RENDERERS[component.type];

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id, e);

    setIsDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      compX: component.position.x,
      compY: component.position.y,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;
      onUpdate(component.id, {
        position: {
          x: dragStart.current.compX + dx,
          y: dragStart.current.compY + dy,
        },
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [component.id, component.position, onSelect, onUpdate]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      w: component.size.width,
      h: component.size.height,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - resizeStart.current.x;
      const dy = moveEvent.clientY - resizeStart.current.y;
      onUpdate(component.id, {
        size: {
          width: Math.max(100, resizeStart.current.w + dx),
          height: Math.max(50, resizeStart.current.h + dy),
        },
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [component.id, component.size, onUpdate]);

  if (!Renderer) return null;

  return (
    <div
      ref={itemRef}
      className={cn(
        'absolute group cursor-pointer',
        isDragging && 'opacity-80',
        isResizing && 'opacity-80',
      )}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.size.width,
        height: component.size.height,
        zIndex: component.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Selection border */}
      {isSelected && (
        <>
          <div className="absolute inset-0 border-2 border-cyan-400 rounded-lg pointer-events-none z-10"
            style={{ boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
          />
          {/* Selected label */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <span className="bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 text-[10px] px-2 py-0.5 rounded whitespace-nowrap backdrop-blur-sm">
              ✓ 已选中 · {component.name}
            </span>
          </div>
        </>
      )}

      {/* Component content */}
      <div className="w-full h-full overflow-hidden rounded-lg">
        <Renderer component={component} />
      </div>

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-cyan-400 border border-[#111827] rounded-sm cursor-se-resize z-20"
          onMouseDown={handleResizeStart}
        />
      )}

      {/* Hover overlay with name label */}
      {!isSelected && (
        <>
          <div className="absolute inset-0 rounded-lg border border-transparent hover:border-cyan-500/30 transition-colors pointer-events-none" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <span className="bg-[#1e293b] border border-cyan-500/40 text-cyan-400 text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
              {component.name}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export function Canvas() {
  const { components, selectedIds, selectComponent, clearSelection, updateComponent, addComponent, canvasScale, canvasOffset, showGrid, editorMode } = useEditorStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      clearSelection();
    }
  }, [clearSelection]);

  const handleSelect = useCallback((id: string, e: React.MouseEvent) => {
    selectComponent(id, e.ctrlKey || e.metaKey);
  }, [selectComponent]);

  const handleUpdate = useCallback((id: string, updates: Partial<CanvasComponent>) => {
    updateComponent(id, updates);
  }, [updateComponent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    if (!type) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = (e.clientX - rect.left) / canvasScale;
    const y = (e.clientY - rect.top) / canvasScale;
    addComponent(type, { x: Math.max(0, x - 100), y: Math.max(0, y - 75) });
  }, [addComponent, canvasScale]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-[#0a0e1a] overflow-hidden relative"
      onClick={handleCanvasClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid background */}
      {showGrid && editorMode === 'edit' && (
        <div
          className="absolute inset-0 canvas-grid pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(30,41,59,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30,41,59,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            transform: `scale(${canvasScale})`,
            transformOrigin: '0 0',
          }}
        />
      )}

      {/* Canvas area with transform */}
      <div
        className="absolute"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
          transformOrigin: '0 0',
          width: '1920px',
          height: '1080px',
        }}
      >
        {components.map((comp) => (
          <CanvasItem
            key={comp.id}
            component={comp}
            isSelected={selectedIds.includes(comp.id)}
            onSelect={handleSelect}
            onUpdate={handleUpdate}
          />
        ))}

        {components.length === 0 && editorMode === 'edit' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1e293b] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📊</span>
              </div>
              <p className="text-sm text-slate-500 mb-1">从左侧拖拽组件到画布</p>
              <p className="text-xs text-slate-600">或对AI说&ldquo;帮我生成一个大屏&rdquo;</p>
            </div>
          </div>
        )}

        {/* Step 4 hint: click component → modify via chat */}
        {components.length > 0 && editorMode === 'edit' && selectedIds.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-[#1e293b]/90 border border-cyan-500/30 rounded-lg px-4 py-2 text-xs text-slate-400 backdrop-blur-sm">
              💡 点击画布中的组件选中它，然后在右侧AI对话中说「把它换成饼图」「调大一点」即可精准修改
            </div>
          </div>
        )}
      </div>

      {/* Canvas size indicator */}
      <div className="absolute bottom-3 left-3 text-[10px] text-slate-600 select-none">
        1920 × 1080
      </div>
    </div>
  );
}
