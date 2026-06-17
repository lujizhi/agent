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
