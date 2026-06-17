'use client';

import React, { useState, useRef } from 'react';
import {
  Search, Plus, Pencil, Trash2, FileArchive, Image, X,
  AlertTriangle, Check, Upload, Sparkles, ChevronDown,
} from 'lucide-react';
import { useEditorStore } from '@/stores/editor-store';
import { TEMPLATES } from '@/lib/templates';
import { cn } from '@/lib/utils';
import type { AITemplate } from '@/types/editor';
import { v4 as uuidv4 } from 'uuid';

type FormData = {
  name: string;
  coverImage: string;
  templateFile: string | null;
  templateFileName: string | null;
  summary: string;
};

const emptyForm: FormData = {
  name: '',
  coverImage: '',
  templateFile: null,
  templateFileName: null,
  summary: '',
};

// Generate a colored gradient placeholder cover based on template industry
function generateCoverPlaceholder(industry: string, style: string): string {
  const palettes: Record<string, [string, string]> = {
    '电力': ['#0c4a6e', '#1e293b'],
    '政务': ['#1a3a5c', '#0f2744'],
    '智慧城市': ['#0d3b66', '#1a1a2e'],
    '安防': ['#1a0a2e', '#16213e'],
    '物流': ['#0a3d62', '#1e272e'],
    '文旅': ['#2d6a4f', '#1b2838'],
    '零售': ['#6b3a5b', '#1e1e2d'],
    '制造业': ['#3d5a80', '#1e293b'],
    '金融': ['#1a3a5c', '#16213e'],
  };
  const [c1, c2] = palettes[industry] || ['#0c4a6e', '#1e293b'];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

// The list of dashboard applications available for AI template selection
const DASHBOARD_APPS = TEMPLATES.map((tpl) => ({
  templateId: tpl.id,
  name: tpl.name,
  industry: tpl.industry,
  style: tpl.style,
  components: tpl.components,
}));

export function AITemplatePanel() {
  const { aiTemplates, addAITemplate, updateAITemplate, deleteAITemplate } = useEditorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const templateFileRef = useRef<HTMLInputElement>(null);

  const filteredTemplates = aiTemplates.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.summary.toLowerCase().includes(q) ||
      (t.templateFileName && t.templateFileName.toLowerCase().includes(q))
    );
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请选择大屏应用';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectApp = (app: (typeof DASHBOARD_APPS)[number]) => {
    setSelectedAppId(app.templateId);
    setDropdownOpen(false);

    // Auto-fill all fields from selected dashboard app
    const updates: FormData = {
      name: app.name,
      coverImage: generateCoverPlaceholder(app.industry, app.style),
      templateFile: JSON.stringify(app.components, null, 2),
      templateFileName: `${app.name.replace(/\s+/g, '_')}.json`,
      summary: `${app.industry}行业 · ${app.style} · 包含${app.components.length}个组件`,
    };
    setFormData(updates);
    setErrors({});
  };

  const handleAdd = () => {
    setDialogMode('add');
    setFormData({ ...emptyForm });
    setEditingId(null);
    setSelectedAppId('');
    setErrors({});
    setShowDialog(true);
  };

  const handleEdit = (template: AITemplate) => {
    setDialogMode('edit');
    setFormData({
      name: template.name,
      coverImage: template.coverImage,
      templateFile: template.templateFile,
      templateFileName: template.templateFileName,
      summary: template.summary,
    });
    setEditingId(template.id);
    setSelectedAppId('');
    setErrors({});
    setShowDialog(true);
  };

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteAITemplate(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleSave = () => {
    if (!validateForm()) return;

    if (dialogMode === 'add') {
      const newId = `ai-tpl-${uuidv4().slice(0, 8)}`;
      addAITemplate({
        id: newId,
        name: formData.name.trim(),
        coverImage: formData.coverImage,
        templateFile: formData.templateFile,
        templateFileName: formData.templateFileName,
        summary: formData.summary.trim(),
      });
    } else if (editingId) {
      updateAITemplate(editingId, {
        name: formData.name.trim(),
        coverImage: formData.coverImage,
        templateFile: formData.templateFile,
        templateFileName: formData.templateFileName,
        summary: formData.summary.trim(),
      });
    }

    setShowDialog(false);
    setFormData(emptyForm);
    setEditingId(null);
    setSelectedAppId('');
    setErrors({});
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setFormData(emptyForm);
    setEditingId(null);
    setSelectedAppId('');
    setErrors({});
    setDropdownOpen(false);
  };

  const handleTemplateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        // Validate JSON
        JSON.parse(content);
        setFormData((prev) => ({
          ...prev,
          templateFile: content,
          templateFileName: file.name,
        }));
      } catch {
        setErrors((prev) => ({ ...prev, templateFile: '模板文件格式无效，请检查文件内容（需为合法JSON）' }));
      }
    };
    reader.readAsText(file);
  };

  const clearTemplateFile = () => {
    setFormData((prev) => ({ ...prev, templateFile: null, templateFileName: null }));
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // Group dashboard apps by industry for organized dropdown
  const groupedApps = DASHBOARD_APPS.reduce((acc, app) => {
    if (!acc[app.industry]) acc[app.industry] = [];
    acc[app.industry].push(app);
    return acc;
  }, {} as Record<string, typeof DASHBOARD_APPS>);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1e293b]">
        <div className="relative flex-1 max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索AI模板..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-md hover:bg-cyan-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          添加模板
        </button>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTemplates.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-xs text-slate-500">
                {searchQuery ? '未找到匹配的AI模板' : '暂无AI模板，点击"添加模板"创建'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {filteredTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="group rounded-lg border border-[#1e293b] bg-[#0a0e1a] overflow-hidden hover:border-cyan-500/30 transition-colors"
              >
                {/* Cover */}
                <div
                  className="h-20 flex items-center justify-center relative"
                  style={{ background: tpl.coverImage || 'linear-gradient(135deg, #0c4a6e, #1e293b)' }}
                >
                  {tpl.coverImage ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNiwxODIsMjEyLDAuMSkiLz48L3N2Zz4=')] opacity-50" />
                      <Sparkles className="w-8 h-8 text-cyan-400/40 relative z-10" />
                    </>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 z-20">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(tpl); }}
                      className="p-1.5 rounded bg-cyan-500/80 text-white hover:bg-cyan-500 transition-colors"
                      title="编辑"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                      className="p-1.5 rounded bg-red-500/80 text-white hover:bg-red-500 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {/* Template file badge */}
                  {tpl.templateFile && (
                    <div className="absolute top-1.5 right-1.5 z-10">
                      <span className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-purple-500/20 text-[9px] text-purple-400">
                        <FileArchive className="w-3 h-3" />
                      </span>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-2.5">
                  <div className="text-xs font-medium text-slate-200 truncate" title={tpl.name}>
                    {tpl.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={tpl.id}>
                    ID: {tpl.id}
                  </div>
                  {tpl.summary && (
                    <div className="text-[10px] text-slate-500 mt-1 line-clamp-2" title={tpl.summary}>
                      {tpl.summary}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">
                      {formatDate(tpl.updatedAt)}
                    </span>
                    {tpl.templateFileName && (
                      <span className="text-[10px] text-slate-500 truncate max-w-[120px]" title={tpl.templateFileName}>
                        {tpl.templateFileName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog (Modal) */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseDialog} />
          <div className="relative bg-[#111827] border border-[#1e293b] rounded-xl w-[600px] max-h-[85vh] flex flex-col shadow-2xl">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e293b]">
              <h3 className="text-sm font-semibold text-slate-200">
                {dialogMode === 'add' ? '添加AI模板' : '编辑AI模板'}
              </h3>
              <button
                onClick={handleCloseDialog}
                className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-[#1e293b] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dialog body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* AI模板名称 — 下拉选择大屏应用 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  大屏应用名称 <span className="text-red-400">*</span>
                </label>
                {dialogMode === 'add' ? (
                  <div ref={dropdownRef} className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 text-xs bg-[#0a0e1a] border rounded-md text-slate-300 transition-colors',
                        errors.name ? 'border-red-500/50' : 'border-[#1e293b] hover:border-cyan-500/50'
                      )}
                    >
                      <span className={formData.name ? 'text-slate-200' : 'text-slate-600'}>
                        {formData.name || '点击选择大屏应用...'}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-3.5 h-3.5 text-slate-500 transition-transform',
                          dropdownOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 max-h-[300px] overflow-y-auto bg-[#0f172a] border border-[#1e293b] rounded-lg shadow-xl z-30">
                        {Object.entries(groupedApps).map(([industry, apps]) => (
                          <div key={industry}>
                            <div className="px-3 py-1.5 text-[10px] font-medium text-slate-600 uppercase bg-[#0a0e1a] sticky top-0">
                              {industry}
                            </div>
                            {apps.map((app) => (
                              <button
                                key={app.templateId}
                                onClick={() => handleSelectApp(app)}
                                className={cn(
                                  'w-full text-left px-3 py-2 text-xs hover:bg-cyan-500/10 transition-colors flex items-center justify-between',
                                  selectedAppId === app.templateId
                                    ? 'bg-cyan-500/20 text-cyan-400'
                                    : 'text-slate-300'
                                )}
                              >
                                <span className="truncate">{app.name}</span>
                                <span className="text-[10px] text-slate-600 ml-2 flex-shrink-0">{app.style}</span>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formData.name}
                    readOnly
                    className="w-full px-3 py-2 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-400 cursor-not-allowed opacity-60"
                  />
                )}
                {errors.name && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.name}</p>
                )}
                {dialogMode === 'add' && (
                  <p className="text-[10px] text-slate-600 mt-1">选择大屏应用后，封面和模板文件将自动同步</p>
                )}
              </div>

              {/* AI模板封面 — 根据大屏应用同步 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  AI模板封面
                </label>
                <div className="flex items-start gap-3">
                  <div
                    className="w-32 h-20 rounded-md border border-[#1e293b] flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ background: formData.coverImage || '#0a0e1a' }}
                  >
                    {formData.coverImage ? (
                      <div className="w-full h-full flex items-center justify-center relative">
                        <Sparkles className="w-6 h-6 text-cyan-400/30" />
                      </div>
                    ) : (
                      <Image className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.coverImage || ''}
                      readOnly
                      placeholder="选择大屏应用后自动生成封面"
                      className="w-full px-3 py-2 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-500 placeholder:text-slate-600 resize-none"
                    />
                    <p className="text-[10px] text-slate-600 mt-1">
                      {formData.name
                        ? '已根据所选大屏应用自动同步封面'
                        : '封面在选择大屏应用后自动同步'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI模板文件 — 根据大屏应用同步，支持手动上传覆盖 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  AI模板文件
                </label>
                <div className="space-y-2">
                  {formData.templateFileName ? (
                    <div className="flex items-start gap-2 px-3 py-3 rounded-md bg-[#0a0e1a] border border-purple-500/20">
                      <FileArchive className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-300 truncate font-medium">
                            {formData.templateFileName}
                          </span>
                          {!selectedAppId && dialogMode === 'add' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 flex-shrink-0">
                              手动上传
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          {formData.templateFile
                            ? `文件大小约 ${(new Blob([formData.templateFile]).size / 1024).toFixed(1)} KB`
                            : '文件已加载'}
                        </div>
                        <button
                          onClick={clearTemplateFile}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors mt-1"
                        >
                          清除文件
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-4 rounded-md bg-[#0a0e1a] border border-dashed border-[#1e293b] text-center">
                      <p className="text-xs text-slate-600">
                        {formData.name
                          ? '模板文件已根据所选大屏应用同步加载'
                          : '选择大屏应用后自动同步，或手动上传覆盖'}
                      </p>
                    </div>
                  )}

                  <input
                    ref={templateFileRef}
                    type="file"
                    accept=".json,.tpl,.template"
                    onChange={handleTemplateFileUpload}
                    className="hidden"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => templateFileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#1e293b] text-slate-300 rounded-md hover:bg-[#273548] transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      手动上传模板文件
                    </button>
                    <span className="text-[10px] text-slate-600">
                      支持 .json / .tpl / .template 格式
                    </span>
                    {errors.templateFile && (
                      <span className="text-[10px] text-red-400">{errors.templateFile}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 嵌入摘要 — 根据大屏应用同步 */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  嵌入摘要
                </label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  placeholder="选择大屏应用后自动生成摘要，也可手动编辑..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-[#0a0e1a] border border-[#1e293b] rounded-md text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Dialog footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#1e293b]">
              <button
                onClick={handleCloseDialog}
                className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-cyan-500 text-white rounded-md hover:bg-cyan-600 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {dialogMode === 'add' ? '添加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-[#111827] border border-[#1e293b] rounded-xl w-[400px] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-200">确认删除</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  确定要删除此AI模板吗？此操作不可撤销。
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] rounded-md transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
