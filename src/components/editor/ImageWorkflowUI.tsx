'use client';

/**
 * 图生大屏 — 工作流 UI 组件集
 * 包含：图片上传区、预处理进度、语义解析结果、分支选择面板
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  Upload, Image, FileImage, CheckCircle2, X, Loader2,
  Sparkles, Layers, Palette, LayoutGrid, Tag,
  ChevronRight, Star, Zap, Wand2, Info, AlertTriangle,
  ArrowRight, TrendingUp, Gauge, BarChart3, PieChart,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { cn } from '@/lib/utils';
import type {
  ImageAnalysisResult,
  SemanticAnalysisResult,
  VectorRetrievalResult,
  ImageWorkflowStep,
} from '@/types/editor';

const STEP_LABELS: Record<ImageWorkflowStep, string> = {
  idle: '',
  image_uploaded: '图片已上传，点击分析按钮开始',
  preprocessing: '正在预处理图片...',
  semantic_analysis: '正在进行多模态语义解析...',
  vector_retrieval: '正在检索匹配平台资源...',
  branch_selection: '请选择大屏生成方案',
  layout_generation: '正在生成栅格布局...',
  rendering: '正在渲染大屏...',
  interaction_optimization: '正在优化交互逻辑...',
  completed: '大屏生成完毕',
};

/** 图片上传拖拽区 */
export function ImageUploadArea() {
  const store = useEditorStore();
  const { imageUpload, setImageUpload, setImageMode, setImageWorkflowStep } = store;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    // 验证
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setImageUpload({ error: '不支持的图片格式，请使用 JPG/PNG/WebP' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageUpload({ error: '图片文件过大（最大10MB）' });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImageUpload({
      file,
      previewUrl,
      fileName: file.name,
      fileSize: file.size,
      uploaded: true,
      error: null,
    });
    setImageMode('image');
    setImageWorkflowStep('image_uploaded');
  }, [setImageUpload, setImageMode, setImageWorkflowStep]);

  const handleAnalyze = useCallback(async () => {
    if (!imageUpload.file || isAnalyzing) return;

    setIsAnalyzing(true);
    setImageUpload({ analyzing: true });
    setImageWorkflowStep('preprocessing');

    try {
      const formData = new FormData();
      formData.append('file', imageUpload.file);
      formData.append('supplementaryText', store.imageSupplementaryText);

      const res = await fetch('/api/image-analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '分析失败');
      }

      const data = await res.json();

      // 模拟步骤推进，让用户看到进度
      setImageWorkflowStep('preprocessing');
      await new Promise((r) => setTimeout(r, 400));

      setImageWorkflowStep('semantic_analysis');
      store.setImageAnalysis(data.analysis as ImageAnalysisResult);
      await new Promise((r) => setTimeout(r, 400));

      setImageWorkflowStep('vector_retrieval');
      store.setImageSemantic(data.semantic as SemanticAnalysisResult);
      store.setImageRetrieval(data.retrieval as VectorRetrievalResult);
      await new Promise((r) => setTimeout(r, 300));

      setImageWorkflowStep('branch_selection');

      // 添加分析结果到聊天
      const summary = data.summary;
      const tplInfo = summary.matchedTemplates
        ?.map((t: { name: string; matchScore: number }, i: number) =>
          `  ${i + 1}. ${t.name}（匹配度 ${t.matchScore}%）`)
        .join('\n') || '';

      const analysisMsg = `### 📸 图片分析完成

**识别行业**：${summary.industry}
**视觉风格**：${summary.style}
**提取色卡**：背景色 \`${summary.colors[0]}\` / 主色 \`${summary.colors[1]}\` / 警示色 \`${summary.colors[2]}\`

**布局分区**：
${(summary.layout || []).map((l: Record<string, unknown>) =>
  `- ${l.区域}：宽${l.宽度}格 × 高${l.高度}格，组件：[${(l.组件 as string[]).join('、')}]`
).join('\n')}

**素材标签**：${(summary.materials || []).join('、')}

**匹配模板**：
${tplInfo}

\`\`\`json
${JSON.stringify(data.semantic?.json || {})}
\`\`\`

> 图片语义解析与资源检索全部完成。请选择生成方案：**方案A（匹配模板）**或 **方案B（从零搭建）**`;

      store.addChatMessage('assistant', analysisMsg);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '图片分析失败，请重试';
      setImageUpload({ error: errMsg, analyzing: false });
      setImageWorkflowStep('idle');
    } finally {
      setIsAnalyzing(false);
      setImageUpload({ analyzing: false });
    }
  }, [imageUpload.file, isAnalyzing, setImageUpload, setImageWorkflowStep, store]);

  const handleClear = useCallback(() => {
    if (imageUpload.previewUrl) {
      URL.revokeObjectURL(imageUpload.previewUrl);
    }
    store.resetImageUpload();
    setImageWorkflowStep('idle');
    setImageMode('text');
  }, [imageUpload.previewUrl, store]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  // 如果已上传图片，显示预览
  if (imageUpload.uploaded && imageUpload.previewUrl) {
    return (
      <div className="border border-cyan-500/30 rounded-lg overflow-hidden bg-[#0a0e1a]">
        {/* 图片预览 */}
        <div className="relative h-36 bg-black/40 flex items-center justify-center overflow-hidden">
          <img
            src={imageUpload.previewUrl}
            alt="上传参考图"
            className="max-h-full max-w-full object-contain"
          />
          {/* 文件名覆盖 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-300 truncate max-w-[180px]">
                {imageUpload.fileName}
              </span>
              <span className="text-[9px] text-slate-500">
                {(imageUpload.fileSize / 1024).toFixed(0)}KB
              </span>
            </div>
          </div>
          {/* 删除按钮 */}
          {!isAnalyzing && (
            <button
              onClick={handleClear}
              className="absolute top-1.5 right-1.5 p-1 rounded bg-black/60 text-slate-400 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="p-2.5 flex items-center gap-2">
          {isAnalyzing || imageUpload.analyzing ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-1.5 text-xs text-cyan-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              正在分析图片...
            </div>
          ) : (
            <>
              <button
                onClick={handleAnalyze}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors border border-cyan-500/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                开始分析图片
              </button>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-md text-xs text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors"
              >
                移除
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // 未上传状态：显示上传区域
  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer',
        dragOver
          ? 'border-cyan-400 bg-cyan-500/10'
          : 'border-[#1e293b] hover:border-cyan-500/30 hover:bg-cyan-500/5'
      )}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          e.target.value = '';
        }}
        className="hidden"
      />

      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
          dragOver ? 'bg-cyan-500/20' : 'bg-[#1e293b]'
        )}>
          <Image className={cn(
            'w-5 h-5',
            dragOver ? 'text-cyan-400' : 'text-slate-500'
          )} />
        </div>
        <div>
          <p className="text-xs text-slate-400">
            <span className="text-cyan-400 font-medium">上传参考图片</span> 或拖拽到此处
          </p>
          <p className="text-[10px] text-slate-600 mt-0.5">
            支持 JPG / PNG / WebP，最大 10MB
          </p>
        </div>
      </div>

      {imageUpload.error && (
        <p className="text-[10px] text-red-400 mt-2">{imageUpload.error}</p>
      )}
    </div>
  );
}

/** 分析进度指示器 */
export function AnalysisProgress({ step }: { step: ImageWorkflowStep }) {
  if (step === 'idle' || step === 'image_uploaded' || step === 'completed') return null;

  const steps: { key: ImageWorkflowStep; icon: React.ReactNode; label: string }[] = [
    { key: 'preprocessing', icon: <Layers className="w-3 h-3" />, label: '图片预处理' },
    { key: 'semantic_analysis', icon: <Sparkles className="w-3 h-3" />, label: '语义解析' },
    { key: 'vector_retrieval', icon: <Tag className="w-3 h-3" />, label: '资源检索' },
    { key: 'branch_selection', icon: <CheckCircle2 className="w-3 h-3" />, label: '等待选择' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-cyan-500/5 border-b border-cyan-500/10">
      {steps.map((s, i) => {
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <React.Fragment key={s.key}>
            <div className={cn(
              'flex items-center gap-1 text-[10px]',
              isDone ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-slate-600'
            )}>
              {isDone ? <CheckCircle2 className="w-3 h-3" /> :
               isActive ? <Loader2 className="w-3 h-3 animate-spin" /> : s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className={cn('w-2.5 h-2.5 flex-shrink-0', isDone ? 'text-emerald-500' : 'text-slate-700')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** 语义解析结果卡片 */
export function SemanticResultCard({ semantic, retrieval }: {
  semantic: SemanticAnalysisResult | null;
  retrieval: VectorRetrievalResult | null;
}) {
  if (!semantic) return null;

  return (
    <div className="border border-cyan-500/20 rounded-lg bg-[#0a0e1a] overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] font-medium text-cyan-300">
          {semantic.json.industry} · {semantic.json.style}
        </span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2.5">
        {/* Colors */}
        <div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <Palette className="w-3 h-3" /> 提取色卡
          </span>
          <div className="flex gap-1.5">
            {semantic.json.color.map((c, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-5 h-5 rounded border border-[#334155]" style={{ backgroundColor: c }} />
                <span className="text-[9px] text-slate-500 font-mono">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div>
          <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
            <LayoutGrid className="w-3 h-3" /> 布局分区
          </span>
          <div className="space-y-0.5">
            {semantic.json.layout.map((area, i) => (
              <div key={i} className="flex items-center text-[10px]">
                <span className="w-16 text-slate-400">
                  {area.area === 'top' ? '顶部标题' :
                   area.area === 'left' ? '左侧看板' :
                   area.area === 'right' ? '右侧看板' : '中央'}
                </span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-500">{area.w}×{area.h}格</span>
                <span className="text-slate-600 mx-1">·</span>
                <span className="text-slate-500">{area.component.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Templates */}
        {retrieval && retrieval.templates.length > 0 && (
          <div>
            <span className="text-[10px] text-slate-500 flex items-center gap-1 mb-1">
              <Tag className="w-3 h-3" /> 匹配模板 Top3
            </span>
            <div className="space-y-1">
              {retrieval.templates.map((t, i) => (
                <div key={t.template_id} className="flex items-center gap-2 text-[10px]">
                  <span className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold',
                    i === 0 ? 'bg-amber-500/20 text-amber-400' :
                    i === 1 ? 'bg-slate-500/20 text-slate-400' :
                    'bg-slate-700/30 text-slate-500'
                  )}>
                    {i + 1}
                  </span>
                  <span className="text-slate-300 truncate flex-1">{t.name}</span>
                  <span className="text-cyan-400 font-mono">{t.matchScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** 分支选择面板 */
export function BranchSelectionPanel({ onSelectBranch }: {
  onSelectBranch: (branch: 'template' | 'from_scratch', templateId?: string) => void;
}) {
  const { imageRetrieval } = useEditorStore();
  const templates = imageRetrieval?.templates || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-medium">
        <Zap className="w-3.5 h-3.5" />
        请选择大屏生成方案
      </div>

      {/* 方案 A：模板 */}
      <button
        onClick={() => {
          const tplId = templates[0]?.template_id;
          onSelectBranch('template', tplId);
        }}
        className="w-full text-left border border-amber-500/30 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors p-3 group"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Wand2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-amber-300">方案 A：选用匹配模板生成</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">推荐</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              复用成熟行业模板栅格骨架，仅替换适配组件，渲染速度快、布局规范
            </p>
            {templates.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                <Star className="w-3 h-3 text-amber-400" />
                默认选用「{templates[0]?.name}」({templates[0]?.matchScore}%匹配)
              </div>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-1" />
        </div>
      </button>

      {/* 方案 B：从零搭建 */}
      <button
        onClick={() => onSelectBranch('from_scratch')}
        className="w-full text-left border border-purple-500/30 rounded-lg bg-purple-500/5 hover:bg-purple-500/10 transition-colors p-3 group"
      >
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Zap className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-purple-300">方案 B：从零空白画布搭建</span>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              不使用任何模板，1:1 复刻参考图布局比例与视觉配色，自由度更高、还原度更高
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1" />
        </div>
      </button>

      {/* 提示 */}
      <div className="flex items-start gap-1.5 px-3 py-2 rounded bg-[#1e293b]/50 border border-[#334155]/50">
        <Info className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          也可以在对话框直接输入「方案A」或「方案B」进行选择
        </p>
      </div>
    </div>
  );
}
