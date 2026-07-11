/**
 * 图生大屏 — 图片分析预处理管线 (Image Analysis Pipeline)
 * 对应文档 3.1 节：图片预处理全规则
 *
 * 模拟7步预处理流程：
 * 1. 基础处理：降噪、尺寸裁剪、画面矫正
 * 2. 图层语义分割：精准分割主体图表、文字标题、背景图层、装饰元素
 * 3. 页面结构提取：识别标题区、左侧指标栏、中间展示区、右侧指标栏
 * 4. 视觉向量生成：输出行业、视觉风格、布局调性的语义向量
 * 5. 空间结构向量生成：识别画面边缘、深度、分块布局信息
 *
 * 注意：本模块为前端原型模拟实现，实际部署将对接后端的 ViT/SigLIP/SAM 等视觉模型
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ImageAnalysisResult,
  SegmentedLayer,
  PageStructure,
  ColorPalette,
  SemanticJSON,
  SemanticAnalysisResult,
} from '@/types/editor';

// ============================================================
// 行业参考图特征库 — 按行业预设解析参数
// ============================================================

interface IndustryPreset {
  industry: string;
  style: string;
  colors: [string, string, string]; // [背景色, 主色, 警示色]
  layoutType: 'left_right' | 'top_bottom' | 'center_core' | 'grid';
  components: string[];
  materials: string[];
  scene: string;
}

const INDUSTRY_PRESETS: Record<string, IndustryPreset> = {
  '电力': {
    industry: '电力运维',
    style: '深色工业科技大屏',
    colors: ['#0a1629', '#00ccff', '#ff3333'],
    layoutType: 'left_right',
    components: ['lineChart', 'barChart', 'numCard', 'alarmList', 'gauge'],
    materials: ['发光边框', '粒子动态背景', '电力设备图标'],
    scene: '电力7×24小时负荷、故障运维监控',
  },
  '水利': {
    industry: '水利监测',
    style: '深色科技风',
    colors: ['#0a1a2e', '#00b4d8', '#e63946'],
    layoutType: 'left_right',
    components: ['lineChart', 'barChart', 'numCard', 'alarmList', 'pieChart'],
    materials: ['水流粒子', '波纹边框', '水利设备图标'],
    scene: '水利工程、水资源实时监测',
  },
  '气象': {
    industry: '气象监测',
    style: '深色科技风',
    colors: ['#0d1b2a', '#48cae4', '#ff6b35'],
    layoutType: 'left_right',
    components: ['lineChart', 'radarChart', 'numCard', 'barChart'],
    materials: ['天气图标', '渐变边框', '云层粒子'],
    scene: '气象数据实时监测与预警',
  },
  '园区': {
    industry: '智慧园区',
    style: '科技蓝',
    colors: ['#0a1629', '#00a8ff', '#ff4757'],
    layoutType: 'center_core',
    components: ['numCard', 'lineChart', 'barChart', 'pieChart'],
    materials: ['楼宇图标', '网格背景', '路径装饰'],
    scene: '智慧园区综合管理监控',
  },
  '政务': {
    industry: '政务数据',
    style: '政企庄重',
    colors: ['#0f1a2e', '#1a73e8', '#d93025'],
    layoutType: 'left_right',
    components: ['numCard', 'barChart', 'lineChart', 'rankingList', 'pieChart'],
    materials: ['国徽图标', '网格背景', '数据面板'],
    scene: '政务大数据综合展示',
  },
  '安防': {
    industry: '安防监控',
    style: '暗黑科技',
    colors: ['#0a0a14', '#00e5ff', '#ff1744'],
    layoutType: 'center_core',
    components: ['numCard', 'alarmList', 'lineChart', 'barChart'],
    materials: ['警戒边框', '雷达扫描', '摄像头图标'],
    scene: '安防态势实时监控与告警',
  },
  '物流': {
    industry: '物流调度',
    style: '科技蓝',
    colors: ['#0a1629', '#0096c7', '#ef5350'],
    layoutType: 'left_right',
    components: ['numCard', 'lineChart', 'barChart', 'table', 'pieChart'],
    materials: ['路线图标', '车辆图标', '网格背景'],
    scene: '智慧物流调度数据监控',
  },
  'default': {
    industry: '通用数据',
    style: '深色科技风',
    colors: ['#0a0e1a', '#06b6d4', '#f59e0b'],
    layoutType: 'left_right',
    components: ['numCard', 'lineChart', 'barChart', 'pieChart'],
    materials: ['发光边框', '粒子背景', '通用图标'],
    scene: '数据可视化大屏展示',
  },
};

// ============================================================
// 第1步：图片基础预处理（模拟）
// ============================================================

export function simulatePreprocessing(
  imageFile: File
): {
  success: boolean;
  message: string;
  dimensions: { width: number; height: number };
  format: string;
  sizeKB: number;
} {
  // 模拟基础处理结果
  return {
    success: true,
    message: '图片降噪、裁剪、画面矫正完成',
    dimensions: { width: 1920, height: 1080 },
    format: imageFile.type || 'image/png',
    sizeKB: Math.round(imageFile.size / 1024),
  };
}

// ============================================================
// 第2步：图层语义分割（模拟）
// ============================================================

function segmentLayers(layoutType: string): SegmentedLayer[] {
  // 标准左右看板布局
  if (layoutType === 'left_right') {
    return [
      {
        id: uuidv4(),
        name: '顶部标题图层',
        type: 'title',
        bounds: { x: 0, y: 0, width: 1920, height: 120 },
        confidence: 0.98,
      },
      {
        id: uuidv4(),
        name: '左侧图表分区图层',
        type: 'chart_area',
        bounds: { x: 0, y: 120, width: 960, height: 960 },
        confidence: 0.95,
      },
      {
        id: uuidv4(),
        name: '右侧指标告警图层',
        type: 'kpi_area',
        bounds: { x: 960, y: 120, width: 960, height: 960 },
        confidence: 0.94,
      },
      {
        id: uuidv4(),
        name: '背景粒子装饰图层',
        type: 'background',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        confidence: 0.99,
      },
      {
        id: uuidv4(),
        name: '边框装饰图层',
        type: 'decoration',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        confidence: 0.92,
      },
    ];
  }

  // 居中核心布局
  if (layoutType === 'center_core') {
    return [
      {
        id: uuidv4(),
        name: '顶部标题图层',
        type: 'title',
        bounds: { x: 0, y: 0, width: 1920, height: 100 },
        confidence: 0.98,
      },
      {
        id: uuidv4(),
        name: '中央核心展示图层',
        type: 'chart_area',
        bounds: { x: 360, y: 120, width: 1200, height: 680 },
        confidence: 0.93,
      },
      {
        id: uuidv4(),
        name: '四周指标分布图层',
        type: 'kpi_area',
        bounds: { x: 0, y: 120, width: 360, height: 960 },
        confidence: 0.91,
      },
      {
        id: uuidv4(),
        name: '底部数据栏图层',
        type: 'decoration',
        bounds: { x: 0, y: 920, width: 1920, height: 160 },
        confidence: 0.89,
      },
      {
        id: uuidv4(),
        name: '背景底图层',
        type: 'background',
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        confidence: 0.99,
      },
    ];
  }

  // 通用布局
  return [
    {
      id: uuidv4(),
      name: '标题区图层',
      type: 'title',
      bounds: { x: 0, y: 0, width: 1920, height: 100 },
      confidence: 0.97,
    },
    {
      id: uuidv4(),
      name: '主内容区图层',
      type: 'chart_area',
      bounds: { x: 0, y: 100, width: 1920, height: 880 },
      confidence: 0.93,
    },
    {
      id: uuidv4(),
      name: '底部状态栏图层',
      type: 'decoration',
      bounds: { x: 0, y: 980, width: 1920, height: 100 },
      confidence: 0.90,
    },
    {
      id: uuidv4(),
      name: '背景底图层',
      type: 'background',
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
      confidence: 0.99,
    },
  ];
}

// ============================================================
// 第3步：页面结构提取（模拟）
// ============================================================

function extractPageStructure(preset: IndustryPreset): PageStructure {
  if (preset.layoutType === 'left_right') {
    return {
      layoutType: 'left_right',
      gridColumns: 24,
      gridRows: 21,
      areas: [
        { area: 'top', w: 24, h: 3, components: ['title'], label: '顶部标题栏' },
        { area: 'left', w: 12, h: 18, components: ['lineChart', 'barChart'], label: '左侧分析看板' },
        { area: 'right', w: 12, h: 18, components: ['numCard', 'alarmList', 'gauge'], label: '右侧汇总看板' },
      ],
    };
  }

  if (preset.layoutType === 'center_core') {
    return {
      layoutType: 'center_core',
      gridColumns: 24,
      gridRows: 24,
      areas: [
        { area: 'top', w: 24, h: 2, components: ['title'], label: '顶部标题栏' },
        { area: 'left', w: 5, h: 20, components: ['numCard', 'alarmList'], label: '左侧指标栏' },
        { area: 'center', w: 14, h: 20, components: ['mapChart', 'lineChart'], label: '中央主展示区' },
        { area: 'right', w: 5, h: 20, components: ['numCard', 'barChart'], label: '右侧指标栏' },
      ],
    };
  }

  return {
    layoutType: 'grid',
    gridColumns: 24,
    gridRows: 21,
    areas: [
      { area: 'top', w: 24, h: 3, components: ['title'], label: '顶部标题栏' },
      { area: 'left', w: 12, h: 18, components: ['lineChart', 'barChart'], label: '左侧数据区' },
      { area: 'right', w: 12, h: 18, components: ['numCard', 'pieChart'], label: '右侧数据区' },
    ],
  };
}

// ============================================================
// 第4步：色卡提取（模拟）
// ============================================================

function extractColorPalette(preset: IndustryPreset): ColorPalette {
  const [bg, primary, warning] = preset.colors;
  return {
    background: bg,
    primary,
    secondary: lightenColor(primary, 0.7),
    accent: warning,
    warning,
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
  };
}

function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

// ============================================================
// 第5-6步：向量生成（模拟）
// ============================================================

function generateVisualVector(preset: IndustryPreset): number[] {
  // 模拟 128 维视觉语义向量
  const seed = preset.industry.length + preset.style.length;
  return Array.from({ length: 64 }, (_, i) =>
    Math.round(((Math.sin(seed * (i + 1)) * 0.5 + 0.5) * 100)) / 100
  );
}

function generateSpatialVector(preset: IndustryPreset): number[] {
  // 模拟 64 维空间结构向量
  const seed = preset.layoutType.length * 7;
  return Array.from({ length: 32 }, (_, i) =>
    Math.round(((Math.cos(seed * (i + 1)) * 0.5 + 0.5) * 100)) / 100
  );
}

// ============================================================
// 完整图片分析管线（模拟主入口）
// ============================================================

export function detectIndustryFromFileName(fileName: string): string {
  const name = fileName.toLowerCase();
  if (name.includes('电力') || name.includes('power') || name.includes('electric') || name.includes('grid')) return '电力';
  if (name.includes('水利') || name.includes('water') || name.includes('hydraulic')) return '水利';
  if (name.includes('气象') || name.includes('weather') || name.includes('meteo')) return '气象';
  if (name.includes('园区') || name.includes('park') || name.includes('campus')) return '园区';
  if (name.includes('政务') || name.includes('gov') || name.includes('government')) return '政务';
  if (name.includes('安防') || name.includes('security') || name.includes('surveillance')) return '安防';
  if (name.includes('物流') || name.includes('logistics') || name.includes('delivery')) return '物流';
  return 'default';
}

/**
 * 完整的图片分析管线
 * 输入：图片文件
 * 输出：ImageAnalysisResult
 */
export async function analyzeImage(imageFile: File): Promise<ImageAnalysisResult> {
  // 模拟异步处理延时（对应文档中 ≤10s 的性能要求）
  await new Promise((resolve) => setTimeout(resolve, 800));

  const industryKey = detectIndustryFromFileName(imageFile.name);
  const preset = INDUSTRY_PRESETS[industryKey] || INDUSTRY_PRESETS['default'];

  const layers = segmentLayers(preset.layoutType);
  const structure = extractPageStructure(preset);
  const palette = extractColorPalette(preset);
  const visualVec = generateVisualVector(preset);
  const spatialVec = generateSpatialVector(preset);

  return {
    segmentedLayers: layers,
    structureCondition: structure,
    colorPalette: palette,
    visualVector: visualVec,
    spatialVector: spatialVec,
  };
}

// ============================================================
// 多模态语义解析（对应文档 3.2 节）
// ============================================================

/**
 * 将图片分析结果 + 附加文本需求 → 标准化语义 JSON
 */
export function parseSemantics(
  analysis: ImageAnalysisResult,
  industryKey: string,
  supplementaryText: string
): SemanticAnalysisResult {
  const preset = INDUSTRY_PRESETS[industryKey] || INDUSTRY_PRESETS['default'];

  // 构建标准化 JSON（对齐文档格式）
  const semanticJSON: SemanticJSON = {
    industry: preset.industry,
    style: preset.style,
    color: [preset.colors[0], preset.colors[1], preset.colors[2]],
    layout: analysis.structureCondition.areas.map((area) => ({
      area: area.area,
      w: area.w,
      h: area.h,
      component: area.components,
    })),
    material_tags: preset.materials,
  };

  // 如果用户补充了文字需求，适当调整
  if (supplementaryText) {
    if (supplementaryText.includes('新增') || supplementaryText.includes('增加')) {
      // 在适当区域添加组件
      const rightArea = semanticJSON.layout.find((a) => a.area === 'right');
      if (rightArea && !rightArea.component.includes('numCard')) {
        rightArea.component.push('numCard');
      }
    }
  }

  return {
    json: semanticJSON,
    businessScene: preset.scene,
    layoutDescription: `${preset.layoutType === 'left_right' ? '标准左右双侧看板布局' : '居中核心布局'}，${analysis.structureCondition.areas.map((a) => a.label).join('、')}`,
    nativeComponents: preset.components.map((c) => {
      const map: Record<string, string> = {
        lineChart: '趋势折线图',
        barChart: '柱状对比图',
        numCard: '指标数值卡片',
        alarmList: '故障告警列表',
        gauge: '仪表盘',
        pieChart: '饼图',
        radarChart: '雷达图',
        rankingList: '排名列表',
        table: '数据表格',
        mapChart: '地理分布图',
      };
      return map[c] || c;
    }),
    visualMaterials: preset.materials,
    rawAnalysis: `业务场景：${preset.scene}；布局：${preset.layoutType === 'left_right' ? '左右均等双侧看板，顶部通栏标题' : '居中核心布局'}；原生组件：${preset.components.join('、')}；视觉素材：${preset.materials.join('、')}`,
  };
}
