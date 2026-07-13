export type ComponentType =
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'ring_chart'
  | 'area_chart'
  | 'scatter_chart'
  | 'radar_chart'
  | 'funnel_chart'
  | 'gauge_chart'
  | 'liquid_chart'
  | 'map_chart'
  | 'title_text'
  | 'number_flip'
  | 'kpi_card'
  | 'ranking_list'
  | 'alarm_list'
  | 'progress_bar'
  | 'table_view'
  | 'border_decoration'
  | 'icon_decoration';

export type ComponentCategory = 'chart' | 'text' | 'container' | 'decoration' | 'business';

export interface ComponentDef {
  type: ComponentType;
  name: string;
  category: ComponentCategory;
  icon: string;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface CanvasComponent {
  id: string;
  type: ComponentType;
  name: string;
  position: Position;
  size: Size;
  props: Record<string, unknown>;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  preview?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type LeftPanelType = 'components' | 'datasource' | 'templates' | 'assets' | 'layers' | 'outline' | 'ai-templates';
export type TopNavType = LeftPanelType;
export type RightPanelType = 'properties' | 'ai-chat' | 'animation';
export type EditorMode = 'edit' | 'preview' | 'presentation';

export interface DataSource {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql' | 'api' | 'excel' | 'csv';
  status: 'connected' | 'disconnected' | 'error';
  tables?: DataTable[];
}

export interface DataTable {
  name: string;
  fields: DataField[];
  rowCount: number;
}

export interface DataField {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  semanticType: 'dimension' | 'measure' | 'time';
  semanticName: string;
  confidence: number;
  sampleValue: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  industry: string;
  style: string;
  thumbnail: string;
  components: CanvasComponent[];
}

export interface HistoryEntry {
  id: string;
  action: string;
  timestamp: number;
  snapshot: CanvasComponent[];
}

export interface AITemplate {
  id: string;
  name: string;
  coverImage: string;
  templateFile: string | null;
  templateFileName: string | null;
  summary: string;
  createdAt: number;
  updatedAt: number;
}

// ============================================================
// 图生大屏 — 图片分析相关类型
// ============================================================

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SegmentedLayer {
  id: string;
  name: string;
  type: 'title' | 'chart_area' | 'kpi_area' | 'background' | 'decoration';
  bounds: Bounds;
  confidence: number;
}

export interface PageArea {
  area: string;
  w: number;
  h: number;
  components: string[];
  label: string;
}

export interface PageStructure {
  layoutType: 'left_right' | 'center_core' | 'grid';
  gridColumns: number;
  gridRows: number;
  areas: PageArea[];
}

export interface ColorPalette {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  warning: string;
  textPrimary: string;
  textSecondary: string;
}

export interface ImageAnalysisResult {
  segmentedLayers: SegmentedLayer[];
  structureCondition: PageStructure;
  colorPalette: ColorPalette;
  visualVector: number[];
  spatialVector: number[];
}

export interface SemanticLayoutItem {
  area: string;
  w: number;
  h: number;
  component: string[];
}

export interface SemanticJSON {
  industry: string;
  style: string;
  color: string[];
  layout: SemanticLayoutItem[];
  material_tags: string[];
}

export interface SemanticAnalysisResult {
  json: SemanticJSON;
  businessScene: string;
  layoutDescription: string;
  nativeComponents: string[];
  visualMaterials: string[];
  rawAnalysis: string;
}

// ============================================================
// 向量检索相关类型
// ============================================================

export interface TemplateMatch {
  template_id: string;
  name: string;
  industry: string;
  style: string;
  matchScore: number;
  reason: string;
  layout: string;
  coreComponents: string[];
}

export interface VectorRetrievalResult {
  templates: TemplateMatch[];
  matchedComponents: string[];
  matchedMaterials: string[];
  colorScheme: ColorPalette;
}

export interface GridAdaptation {
  area: string;
  originalComponents: string[];
  adaptedComponents: string[];
  changes: string[];
}

export interface BranchALayout {
  templateId: string;
  templateName: string;
  gridAdaptations: GridAdaptation[];
  colorAdaptations: string[];
}

export interface BranchBArea {
  area: string;
  gridW: number;
  gridH: number;
  components: string[];
  pixelRatio: string;
}

export interface BranchBLayout {
  gridSize: { columns: number; rows: number };
  areas: BranchBArea[];
  layerOrder: string[];
  colorSource: string;
}

// ============================================================
// 交互引擎相关类型
// ============================================================

export interface InteractionEvent {
  id: string;
  type: 'card_click_detail' | 'chart_hover_value' | 'alert_click_detail' | 'custom';
  triggerComponentId: string;
  triggerEvent: 'click' | 'hover';
  action: 'show_modal' | 'show_tooltip';
  config: Record<string, unknown>;
  description: string;
}

// ============================================================
// 图生大屏 — Workflow 步骤
// ============================================================

export type ImageWorkflowStep =
  | 'idle'
  | 'image_uploaded'
  | 'preprocessing'
  | 'semantic_analysis'
  | 'vector_retrieval'
  | 'branch_selection'
  | 'layout_generation'
  | 'rendering'
  | 'interaction_optimization'
  | 'completed';

// ============================================================
// 组件素材生成 — Asset 相关类型
// ============================================================

export type AssetType = 'component' | 'material';

export interface AssetTypeItem {
  type: AssetType;
  subType: string;
  description: string;
}

export interface AssetColorScheme {
  primary: string;
  background: string;
  accent: string;
  warning: string;
}

export interface AssetIntentLabels {
  industry: string;
  style: string;
  assetTypes: AssetTypeItem[];
  colorScheme: AssetColorScheme;
  effects: string[];
  usageScene: string;
}

export interface AssetComponentItem {
  id: string;
  name: string;
  type: AssetType;
  subType: string;
  description: string;
  visualParams: Record<string, string>;
  canvasComponentType?: ComponentType;
}

export interface AssetMaterialItem {
  id: string;
  name: string;
  type: AssetType;
  subType: string;
  description: string;
  visualParams: Record<string, string>;
}

export interface AssetScheme {
  schemeIndex: number;
  schemeName: string;
  schemeStyle: string;
  components: AssetComponentItem[];
  materials: AssetMaterialItem[];
  fitScene: string;
  visualSummary: string;
}

export interface AssetLayer {
  id: string;
  name: string;
  type: AssetType;
  schemeIndex: number;
  canvasComponentId: string;
  position: Position;
  size: Size;
  zIndex: number;
  editable: boolean;
}
