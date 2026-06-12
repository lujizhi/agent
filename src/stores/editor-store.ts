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
}));
