import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  CanvasComponent,
  ChatMessage,
  LeftPanelType,
  RightPanelType,
  EditorMode,
  ComponentType,
  HistoryEntry,
  DataSource,
  TemplateItem,
  AITemplate,
  TopNavType,
  AssetScheme,
  AssetLayer,
  SemanticAnalysisResult,
  VectorRetrievalResult,
  ImageWorkflowStep,
} from '@/types/editor';
import { TEMPLATES } from '@/lib/templates';

interface EditorState {
  // Canvas
  components: CanvasComponent[];
  selectedIds: string[];
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  showGrid: boolean;

  // Panels
  leftPanel: LeftPanelType;
  leftPanelOpen: boolean;
  rightPanel: RightPanelType;
  rightPanelOpen: boolean;
  editorMode: EditorMode;

  // Dashboard info
  dashboardName: string;
  dashboardId: string;

  // AI Chat
  chatMessages: ChatMessage[];
  chatLoading: boolean;
  selectedComponentContext: string | null;

  // Data sources
  dataSources: DataSource[];

  // History
  history: HistoryEntry[];
  historyIndex: number;

  // Templates
  templates: TemplateItem[];

  // AI Templates
  aiTemplates: AITemplate[];
  topNavActive: TopNavType;
  topNavDropdownOpen: boolean;

  // Image Workflow (图生大屏)
  imageUpload: { file?: File; previewUrl?: string; error?: string | null; fileName?: string; fileSize?: number; uploaded?: boolean; analyzing?: boolean } | null;
  imageMode: string;
  imageWorkflowStep: ImageWorkflowStep;
  imageSupplementaryText: string;
  imageAnalysis: import('@/types/editor').ImageAnalysisResult | null;
  imageSemantic: SemanticAnalysisResult | null;
  imageRetrieval: VectorRetrievalResult | null;
  imageBranch: string;
  imageSelectedTemplateId: string;

  // Asset Workflow (组件素材生成)
  assetSchemes: AssetScheme[];
  assetSelectedSchemes: number[];
  assetLayers: AssetLayer[];
  assetWorkflowStep: string;
  previewComponents: CanvasComponent[];

  // Actions
  addComponent: (type: ComponentType, position?: { x: number; y: number }, name?: string, size?: { width: number; height: number }) => string;
  removeComponent: (id: string) => void;
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
  selectComponent: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setCanvasScale: (scale: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  fitCanvas: () => void;
  toggleGrid: () => void;

  setLeftPanel: (panel: LeftPanelType) => void;
  toggleLeftPanel: () => void;
  setRightPanel: (panel: RightPanelType) => void;
  toggleRightPanel: () => void;
  setEditorMode: (mode: EditorMode) => void;

  setDashboardName: (name: string) => void;
  applyTemplateById: (templateId: string) => boolean;
  applyTemplate: (template: TemplateItem) => void;

  addChatMessage: (role: 'user' | 'assistant', content: string) => string;
  setChatLoading: (loading: boolean) => void;
  updateLastAssistantMessage: (content: string) => void;
  updateChatMessage: (id: string, updates: Partial<ChatMessage>) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: (action: string) => void;

  addDataSource: (ds: DataSource) => void;

  // AI Template actions
  addAITemplate: (template: Omit<AITemplate, 'createdAt' | 'updatedAt'>) => void;
  updateAITemplate: (id: string, updates: Partial<Omit<AITemplate, 'id' | 'createdAt'>>) => void;
  deleteAITemplate: (id: string) => void;
  setTopNav: (nav: TopNavType) => void;
  toggleTopNavDropdown: () => void;
  closeTopNavDropdown: () => void;

  // Image Workflow actions
  setImageUpload: (data: Partial<{ file: File; previewUrl: string; error: string | null; fileName: string; fileSize: number; uploaded: boolean; analyzing: boolean }> | null) => void;
  setImageMode: (mode: string) => void;
  setImageWorkflowStep: (step: ImageWorkflowStep) => void;
  setImageSupplementaryText: (text: string) => void;
  setImageAnalysis: (analysis: import('@/types/editor').ImageAnalysisResult | null) => void;
  setImageSemantic: (semantic: SemanticAnalysisResult | null) => void;
  setImageRetrieval: (retrieval: VectorRetrievalResult | null) => void;
  setImageBranch: (branch: string) => void;
  setImageSelectedTemplateId: (id: string) => void;
  resetImageUpload: () => void;
  resetImageWorkflow: () => void;

  // Asset Workflow actions
  setAssetSchemes: (schemes: AssetScheme[]) => void;
  setAssetSelectedSchemes: (indices: number[]) => void;
  addAssetLayer: (layer: AssetLayer) => void;
  clearAssetLayers: () => void;
  setAssetWorkflowStep: (step: string) => void;
  resetAssetWorkflow: () => void;
  setPreviewComponents: (components: CanvasComponent[]) => void;
  clearPreviewComponents: () => void;
}

const COMPONENT_DEFAULTS: Record<ComponentType, { name: string; width: number; height: number; category: string }> = {
  bar_chart: { name: '柱状图', width: 400, height: 300, category: 'chart' },
  line_chart: { name: '折线图', width: 400, height: 300, category: 'chart' },
  pie_chart: { name: '饼图', width: 300, height: 300, category: 'chart' },
  ring_chart: { name: '环形图', width: 300, height: 300, category: 'chart' },
  area_chart: { name: '面积图', width: 400, height: 300, category: 'chart' },
  scatter_chart: { name: '散点图', width: 400, height: 300, category: 'chart' },
  radar_chart: { name: '雷达图', width: 300, height: 300, category: 'chart' },
  funnel_chart: { name: '漏斗图', width: 300, height: 400, category: 'chart' },
  gauge_chart: { name: '仪表盘', width: 250, height: 200, category: 'chart' },
  liquid_chart: { name: '水球图', width: 250, height: 250, category: 'chart' },
  map_chart: { name: '地图', width: 500, height: 400, category: 'chart' },
  title_text: { name: '标题文本', width: 300, height: 60, category: 'text' },
  number_flip: { name: '数字翻牌器', width: 200, height: 100, category: 'text' },
  kpi_card: { name: 'KPI卡片', width: 240, height: 140, category: 'business' },
  ranking_list: { name: '排名列表', width: 300, height: 400, category: 'business' },
  alarm_list: { name: '告警列表', width: 300, height: 400, category: 'business' },
  progress_bar: { name: '进度条', width: 300, height: 40, category: 'business' },
  table_view: { name: '表格', width: 500, height: 300, category: 'business' },
  border_decoration: { name: '边框装饰', width: 400, height: 300, category: 'decoration' },
  icon_decoration: { name: '图标装饰', width: 60, height: 60, category: 'decoration' },
};

export const useEditorStore = create<EditorState>((set, get) => ({
  // Canvas
  components: [],
  selectedIds: [],
  canvasScale: 1,
  canvasOffset: { x: 0, y: 0 },
  showGrid: true,

  // Panels
  leftPanel: 'components',
  leftPanelOpen: true,
  rightPanel: 'ai-chat',
  rightPanelOpen: true,
  editorMode: 'edit',

  // Dashboard info
  dashboardName: '未命名大屏',
  dashboardId: uuidv4(),

  // AI Chat
  chatMessages: [
    {
      id: uuidv4(),
      role: 'assistant',
      content: '你好！我是**可视化大屏AI创作智能体**（对话式BI Agent），专注实现「自然语言对话式大屏零代码创作」。\n\n我会按以下4步为你服务：\n**① 意图解析** → 识别行业场景、风格偏好、布局需求、组件需求\n**② 模板推荐** → 匹配3套最优内置模板供你选择\n**③ 语义渲染** → 基于模板+语义需求，生成可交互初版大屏\n**④ 二次编辑** → 支持组件/布局/配色/图表等所有精细化调整\n\n💬 **完整演示工作流（电力行业）：**\n「帮我做一个电力运维大数据监控大屏，深色科技风，采用左右看板布局，需要电力负荷卡片、负荷趋势折线图、站点供电量柱状图、故障预警列表组件」\n→ 选第一个电力模板 → 点击画布组件 → 「把异常数据做红色高亮」\n\n💬 其他行业：\n「帮我生成一个销售业绩驾驶舱」 | 「创建一个智慧物流调度大屏」',
      timestamp: Date.now(),
    },
  ],
  chatLoading: false,
  selectedComponentContext: null,

  // Data sources
  dataSources: [],

  // History
  history: [],
  historyIndex: -1,

  // Templates
  templates: [],

  // AI Templates
  aiTemplates: [
    {
      id: 'ai-tpl-001',
      name: '电网能耗数据总览大屏',
      coverImage: '',
      templateFile: null,
      templateFileName: null,
      summary: '电力行业 · 深色科技风 · 包含全网总能耗、用电量、节能完成率等核心指标',
      createdAt: Date.now() - 86400000 * 7,
      updatedAt: Date.now() - 86400000 * 2,
    },
    {
      id: 'ai-tpl-002',
      name: '智慧城市数据总览大屏',
      coverImage: '',
      templateFile: null,
      templateFileName: null,
      summary: '智慧城市 · 政企庄重 · 包含城市全域地图、GDP总量、交通指数、环境质量等核心指标',
      createdAt: Date.now() - 86400000 * 14,
      updatedAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'ai-tpl-003',
      name: '安防监控指挥大屏',
      coverImage: '',
      templateFile: null,
      templateFileName: null,
      summary: '安防 · 暗黑科技 · 包含告警总数、安防态势地图、事件类型分布等核心模块',
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 10,
    },
  ],
  topNavActive: 'components',
  topNavDropdownOpen: false,

  // Image Workflow
  imageUpload: null,
  imageMode: 'agent',
  imageWorkflowStep: 'idle',
  imageSupplementaryText: '',
  imageAnalysis: null,
  imageSemantic: null,
  imageRetrieval: null,
  imageBranch: '',
  imageSelectedTemplateId: '',

  // Asset Workflow
  assetSchemes: [],
  assetSelectedSchemes: [],
  assetLayers: [],
  assetWorkflowStep: 'idle',
  previewComponents: [],

  // Actions
  addComponent: (type, position, name, size) => {
    const defaults = COMPONENT_DEFAULTS[type];
    if (!defaults) return '';
    const newId = uuidv4();
    const newComponent: CanvasComponent = {
      id: newId,
      type,
      name: name || defaults.name,
      position: position || { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      size: size || { width: defaults.width, height: defaults.height },
      props: {},
      zIndex: get().components.length,
      locked: false,
      visible: true,
    };
    set((state) => ({
      components: [...state.components, newComponent],
      selectedIds: [newId],
    }));
    get().pushHistory(`添加${name || defaults.name}`);
    return newId;
  },

  removeComponent: (id) => {
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
    get().pushHistory('删除组件');
  },

  updateComponent: (id, updates) => {
    set((state) => ({
      components: state.components.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  selectComponent: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const ids = state.selectedIds.includes(id)
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id];
        return { selectedIds: ids };
      }
      return { selectedIds: [id] };
    });
    const comp = get().components.find((c) => c.id === id);
    if (comp) {
      set({ selectedComponentContext: `${comp.name} (${comp.type})` });
    }
  },

  clearSelection: () => {
    set({ selectedIds: [], selectedComponentContext: null });
  },

  setCanvasScale: (scale) => set({ canvasScale: Math.max(0.1, Math.min(3, scale)) }),
  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  fitCanvas: () => {
    const { components } = get();
    if (components.length === 0) {
      set({ canvasScale: 1, canvasOffset: { x: 0, y: 0 } });
      return;
    }
    // Calculate bounding box of all components
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of components) {
      if (c.position.x < minX) minX = c.position.x;
      if (c.position.y < minY) minY = c.position.y;
      if (c.position.x + c.size.width > maxX) maxX = c.position.x + c.size.width;
      if (c.position.y + c.size.height > maxY) maxY = c.position.y + c.size.height;
    }
    const contentW = maxX - minX + 80; // padding
    const contentH = maxY - minY + 80;
    // Viewport size (browser window - sidebars ≈ 900x650)
    const viewW = 1000;
    const viewH = 700;
    const scaleX = viewW / contentW;
    const scaleY = viewH / contentH;
    const scale = Math.min(scaleX, scaleY, 1.0); // don't zoom in beyond 1:1
    const offsetX = (viewW - contentW * scale) / 2 - minX * scale + 40 * scale;
    const offsetY = (viewH - contentH * scale) / 2 - minY * scale + 40 * scale;
    set({ canvasScale: Math.max(0.15, scale), canvasOffset: { x: offsetX, y: offsetY } });
  },

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  setLeftPanel: (panel) => set({ leftPanel: panel, leftPanelOpen: true }),
  toggleLeftPanel: () => set((state) => ({ leftPanelOpen: !state.leftPanelOpen })),
  setRightPanel: (panel) => set({ rightPanel: panel, rightPanelOpen: true }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setEditorMode: (mode) => set({ editorMode: mode }),

  setDashboardName: (name) => set({ dashboardName: name }),

  applyTemplateById: (templateId) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return false;
    get().applyTemplate(template);
    return true;
  },

  addChatMessage: (role, content) => {
    const id = uuidv4();
    const msg: ChatMessage = {
      id,
      role,
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      chatMessages: [...state.chatMessages, msg],
    }));
    return id;
  },

  setChatLoading: (loading) => set({ chatLoading: loading }),

  updateLastAssistantMessage: (content) => {
    set((state) => {
      const msgs = [...state.chatMessages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], content };
          break;
        }
      }
      return { chatMessages: msgs };
    });
  },

  updateChatMessage: (id, updates) => {
    set((state) => ({
      chatMessages: state.chatMessages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }));
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        components: JSON.parse(JSON.stringify(history[newIndex].snapshot)),
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        components: JSON.parse(JSON.stringify(history[newIndex].snapshot)),
      });
    }
  },

  pushHistory: (action) => {
    const { history, historyIndex, components } = get();
    const newEntry: HistoryEntry = {
      id: uuidv4(),
      action,
      timestamp: Date.now(),
      snapshot: JSON.parse(JSON.stringify(components)),
    };
    const newHistory = history.slice(0, historyIndex + 1).concat(newEntry);
    if (newHistory.length > 50) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  applyTemplate: (template) => {
    set({
      components: JSON.parse(JSON.stringify(template.components)),
      dashboardName: template.name,
    });
    get().pushHistory(`应用模板: ${template.name}`);
    // Auto-fit canvas to show all components
    setTimeout(() => get().fitCanvas(), 100);
  },

  addDataSource: (ds) => {
    set((state) => ({ dataSources: [...state.dataSources, ds] }));
  },

  // AI Template actions
  addAITemplate: (template) => {
    const now = Date.now();
    const newTemplate: AITemplate = {
      ...template,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      aiTemplates: [...state.aiTemplates, newTemplate],
    }));
  },

  updateAITemplate: (id, updates) => {
    set((state) => ({
      aiTemplates: state.aiTemplates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      ),
    }));
  },

  deleteAITemplate: (id) => {
    set((state) => ({
      aiTemplates: state.aiTemplates.filter((t) => t.id !== id),
    }));
  },

  setTopNav: (nav) =>
    set((state) => ({
      topNavActive: nav,
      topNavDropdownOpen: state.topNavActive === nav ? !state.topNavDropdownOpen : true,
    })),

  toggleTopNavDropdown: () =>
    set((state) => ({ topNavDropdownOpen: !state.topNavDropdownOpen })),

  closeTopNavDropdown: () => set({ topNavDropdownOpen: false }),

  // ─── Image Workflow actions ───
  setImageUpload: (data) => set((state) => ({
    imageUpload: data === null ? null : { ...(state.imageUpload || {}), ...data } as typeof state.imageUpload,
  })),
  setImageMode: (mode) => set({ imageMode: mode }),
  setImageWorkflowStep: (step) => set({ imageWorkflowStep: step }),
  setImageSupplementaryText: (text) => set({ imageSupplementaryText: text }),
  setImageAnalysis: (analysis) => set({ imageAnalysis: analysis }),
  setImageSemantic: (semantic) => set({ imageSemantic: semantic }),
  setImageRetrieval: (retrieval) => set({ imageRetrieval: retrieval }),
  setImageBranch: (branch) => set({ imageBranch: branch }),
  setImageSelectedTemplateId: (id) => set({ imageSelectedTemplateId: id }),
  resetImageUpload: () => set({
    imageUpload: null,
    imageMode: 'agent',
    imageWorkflowStep: 'idle',
    imageSupplementaryText: '',
    imageAnalysis: null,
    imageSemantic: null,
    imageRetrieval: null,
    imageBranch: '',
    imageSelectedTemplateId: '',
  }),
  resetImageWorkflow: () => set({
    imageWorkflowStep: 'idle',
    imageAnalysis: null,
    imageSemantic: null,
    imageRetrieval: null,
    imageBranch: '',
    imageSelectedTemplateId: '',
  }),

  // ─── Asset Workflow actions ───
  setAssetSchemes: (schemes) => set({ assetSchemes: schemes }),
  setAssetSelectedSchemes: (indices) => set({ assetSelectedSchemes: indices }),
  addAssetLayer: (layer) => set((state) => ({ assetLayers: [...state.assetLayers, layer] })),
  clearAssetLayers: () => set({ assetLayers: [] }),
  setAssetWorkflowStep: (step) => set({ assetWorkflowStep: step }),
  resetAssetWorkflow: () => set({
    assetSchemes: [],
    assetSelectedSchemes: [],
    assetLayers: [],
    assetWorkflowStep: 'idle',
  }),
  setPreviewComponents: (components) => set({ previewComponents: components }),
  clearPreviewComponents: () => set({ previewComponents: [] }),
}));
