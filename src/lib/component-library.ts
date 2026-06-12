import type { ComponentDef } from '@/types/editor';

export const COMPONENT_LIBRARY: ComponentDef[] = [
  // Charts
  { type: 'bar_chart', name: '柱状图', category: 'chart', icon: 'BarChart3', description: '适合对比分类数据', defaultWidth: 400, defaultHeight: 300 },
  { type: 'line_chart', name: '折线图', category: 'chart', icon: 'TrendingUp', description: '适合展示趋势变化', defaultWidth: 400, defaultHeight: 300 },
  { type: 'pie_chart', name: '饼图', category: 'chart', icon: 'PieChart', description: '适合展示占比分布', defaultWidth: 300, defaultHeight: 300 },
  { type: 'ring_chart', name: '环形图', category: 'chart', icon: 'CircleDot', description: '适合展示占比与总数', defaultWidth: 300, defaultHeight: 300 },
  { type: 'area_chart', name: '面积图', category: 'chart', icon: 'AreaChart', description: '适合展示量级趋势', defaultWidth: 400, defaultHeight: 300 },
  { type: 'scatter_chart', name: '散点图', category: 'chart', icon: 'ScatterChart', description: '适合展示相关性', defaultWidth: 400, defaultHeight: 300 },
  { type: 'radar_chart', name: '雷达图', category: 'chart', icon: 'Hexagon', description: '适合多维度评估', defaultWidth: 300, defaultHeight: 300 },
  { type: 'funnel_chart', name: '漏斗图', category: 'chart', icon: 'Filter', description: '适合转化流程分析', defaultWidth: 300, defaultHeight: 400 },
  { type: 'gauge_chart', name: '仪表盘', category: 'chart', icon: 'Gauge', description: '适合KPI达成率展示', defaultWidth: 250, defaultHeight: 200 },
  { type: 'liquid_chart', name: '水球图', category: 'chart', icon: 'Droplets', description: '适合百分比填充展示', defaultWidth: 250, defaultHeight: 250 },
  { type: 'map_chart', name: '地图', category: 'chart', icon: 'Map', description: '适合地域分布展示', defaultWidth: 500, defaultHeight: 400 },
  // Text
  { type: 'title_text', name: '标题文本', category: 'text', icon: 'Type', description: '大屏标题或说明文字', defaultWidth: 300, defaultHeight: 60 },
  { type: 'number_flip', name: '数字翻牌器', category: 'text', icon: 'Hash', description: '核心指标大字展示', defaultWidth: 200, defaultHeight: 100 },
  // Business
  { type: 'kpi_card', name: 'KPI卡片', category: 'business', icon: 'CreditCard', description: '指标+同比环比卡片', defaultWidth: 240, defaultHeight: 140 },
  { type: 'ranking_list', name: '排名列表', category: 'business', icon: 'ListOrdered', description: 'Top N排名展示', defaultWidth: 300, defaultHeight: 400 },
  { type: 'progress_bar', name: '进度条', category: 'business', icon: 'Loader', description: '目标完成度展示', defaultWidth: 300, defaultHeight: 40 },
  { type: 'table_view', name: '表格', category: 'business', icon: 'Table', description: '明细数据表格展示', defaultWidth: 500, defaultHeight: 300 },
  // Decoration
  { type: 'border_decoration', name: '边框装饰', category: 'decoration', icon: 'Square', description: '科技感边框装饰', defaultWidth: 400, defaultHeight: 300 },
  { type: 'icon_decoration', name: '图标装饰', category: 'decoration', icon: 'Sparkles', description: '装饰性图标', defaultWidth: 60, defaultHeight: 60 },
];

export const COMPONENT_CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'chart', label: '图表' },
  { key: 'text', label: '文本' },
  { key: 'business', label: '业务' },
  { key: 'decoration', label: '装饰' },
] as const;
