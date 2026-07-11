/**
 * 图生大屏 — 向量检索引擎 (Vector Retrieval Engine)
 * 对应文档 3.3 节：向量检索引擎完整规则
 *
 * 三大资源库同步检索，优先级强制锁定：
 * 1. 大屏模板库匹配：同行业、同布局、同色系
 * 2. 可视化组件库匹配：同风格图表、卡片
 * 3. 素材库匹配：背景图、粒子动效、分割装饰线
 *
 * 核心匹配权重：行业 > 布局 > 风格 > 配色 > 组件
 */

import { TEMPLATES } from '@/lib/templates';
import type {
  SemanticAnalysisResult,
  VectorRetrievalResult,
  TemplateMatch,
  BranchALayout,
  BranchBLayout,
} from '@/types/editor';

// ============================================================
// 模板匹配引擎
// ============================================================

/**
 * 计算模板与语义分析的匹配度
 * 权重：行业 40% > 布局 25% > 风格 20% > 配色 10% > 组件 5%
 */
function calculateTemplateMatchScore(
  template: (typeof TEMPLATES)[number],
  semantic: SemanticAnalysisResult
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  // 1. 行业匹配 (40%)
  const templateIndustry = template.industry;
  const targetIndustry = semantic.json.industry;
  if (templateIndustry === targetIndustry) {
    score += 40;
    reasons.push('行业完全匹配');
  } else if (targetIndustry.includes(templateIndustry) || templateIndustry.includes(targetIndustry)) {
    score += 30;
    reasons.push('行业部分匹配');
  } else {
    score += 10;
    reasons.push('跨行业通用模板');
  }

  // 2. 布局匹配 (25%)
  const hasLeftRightLayout = semantic.json.layout.some((a) => a.area === 'left') &&
    semantic.json.layout.some((a) => a.area === 'right');
  const templateComponents = template.components.map((c) => c.position);

  // 判断模板是否左右看板布局（组件分布在左右两侧）
  const leftComponents = template.components.filter((c) => c.position.x < 500);
  const rightComponents = template.components.filter((c) => c.position.x > 900);
  const hasTemplateLeftRight = leftComponents.length > 0 && rightComponents.length > 0;

  if (hasLeftRightLayout && hasTemplateLeftRight) {
    score += 25;
    reasons.push('左右看板布局完全匹配');
  } else if (hasLeftRightLayout || hasTemplateLeftRight) {
    score += 15;
    reasons.push('布局结构部分匹配');
  } else {
    score += 8;
    reasons.push('布局结构通用适配');
  }

  // 3. 风格匹配 (20%)
  const targetStyle = semantic.json.style;
  const templateStyle = template.style;
  if (templateStyle === targetStyle) {
    score += 20;
    reasons.push('视觉风格完全一致');
  } else if (
    (targetStyle.includes('科技') && templateStyle.includes('科技')) ||
    (targetStyle.includes('工业') && templateStyle.includes('工业')) ||
    (targetStyle.includes('政企') && templateStyle.includes('庄重'))
  ) {
    score += 14;
    reasons.push('视觉风格相近');
  } else {
    score += 6;
    reasons.push('风格可适配');
  }

  // 4. 配色匹配 (10%)
  const targetColor = semantic.json.color[0]; // 背景色
  if (targetColor.startsWith('#0a')) {
    // 深色系背景
    if (template.style.includes('深色') || template.style.includes('暗黑') || template.style.includes('科技')) {
      score += 10;
      reasons.push('深色系配色方案匹配');
    } else {
      score += 5;
    }
  } else {
    score += 7;
    reasons.push('配色方案通用');
  }

  // 5. 组件匹配 (5%)
  const targetComps = semantic.json.layout.flatMap((a) => a.component);
  const templateComps = template.components.map((c) => c.type);
  const compOverlap = targetComps.filter((tc) =>
    templateComps.some((tempC) => componentTypeOverlap(tc, tempC))
  ).length;
  if (compOverlap >= targetComps.length * 0.7) {
    score += 5;
    reasons.push('组件配置高度匹配');
  } else if (compOverlap > 0) {
    score += 3;
    reasons.push('组件配置部分匹配');
  } else {
    score += 1;
  }

  return { score: Math.min(maxScore, Math.round(score)), reasons };
}

function componentTypeOverlap(semanticComp: string, templateComp: string): boolean {
  const semanticLower = semanticComp.toLowerCase();
  const templateLower = templateComp.toLowerCase();
  if (semanticLower.includes('chart') && templateLower.includes('chart')) return true;
  if (semanticLower.includes('card') && (templateLower.includes('kpi') || templateLower.includes('card'))) return true;
  if (semanticLower.includes('alarm') && templateLower.includes('ranking')) return true;
  if (semanticLower === templateLower) return true;
  return false;
}

// ============================================================
// 组件匹配引擎
// ============================================================

function matchComponents(semantic: SemanticAnalysisResult): string[] {
  const componentMap: Record<string, string> = {
    'lineChart': '折线图 / 趋势曲线图',
    'barChart': '柱状图 / 对比图',
    'numCard': '指标数值卡片 / KPI卡片',
    'alarmList': '告警列表 / 预警列表',
    'gauge': '仪表盘',
    'pieChart': '饼图 / 环形图',
    'radarChart': '雷达图',
    'rankingList': '排名列表',
    'table': '数据表格',
    'mapChart': '地理分布图（仅底图）',
  };

  const comps = semantic.json.layout.flatMap((a) => a.component);
  const matched = [...new Set(comps)].map((c) => componentMap[c] || c);
  return matched.filter(Boolean);
}

// ============================================================
// 素材匹配引擎
// ============================================================

function matchMaterials(semantic: SemanticAnalysisResult): string[] {
  const style = semantic.json.style;
  const materials: string[] = [];

  // 粒子背景
  if (style.includes('科技') || style.includes('工业')) {
    materials.push('深色粒子动态背景');
    materials.push('科技网格底纹');
  } else if (style.includes('庄重') || style.includes('政企')) {
    materials.push('网格底纹背景');
    materials.push('渐变背景');
  } else {
    materials.push('通用粒子背景');
  }

  // 边框装饰
  if (style.includes('科技') || style.includes('暗黑')) {
    materials.push('发光边框装饰');
    materials.push('科技角度标');
  } else {
    materials.push('标准边框装饰');
  }

  // 行业图标
  const industryIcons: Record<string, string> = {
    '电力运维': '电力设备专属图标包',
    '水利监测': '水利设施图标包',
    '气象监测': '气象天气图标包',
    '智慧园区': '园区楼宇图标包',
    '政务数据': '政务数据图标包',
    '安防监控': '安防摄像头图标包',
    '物流调度': '物流车辆图标包',
  };
  const iconSet = industryIcons[semantic.json.industry] || '通用行业图标包';
  materials.push(iconSet);

  // 装饰分割线
  materials.push('区域分割装饰线');
  materials.push('标题下划线装饰');

  // 素材标签（对齐文档）
  if (semantic.json.material_tags && semantic.json.material_tags.length > 0) {
    semantic.json.material_tags.forEach((tag) => {
      if (!materials.includes(tag)) materials.push(tag);
    });
  }

  return materials;
}

// ============================================================
// 完整检索管线（模拟主入口）
// ============================================================

/**
 * 向量检索引擎主入口
 * 输入：语义分析结果
 * 输出：匹配的模板、组件、素材
 */
export async function retrieveResources(
  semantic: SemanticAnalysisResult
): Promise<VectorRetrievalResult> {
  // 模拟检索延时
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 1. 模板匹配 — 计算所有模板的匹配度并排序
  const allMatches = TEMPLATES.map((tpl) => {
    const { score, reasons } = calculateTemplateMatchScore(tpl, semantic);
    return {
      template_id: tpl.id,
      name: tpl.name,
      industry: tpl.industry,
      style: tpl.style,
      matchScore: score,
      reason: reasons.join('；'),
      layout: tpl.style.includes('左右') ? '左右双侧看板' : '多模块分区布局',
      coreComponents: tpl.components.slice(0, 5).map((c) => c.name),
    };
  });

  // 排序取前3
  const top3 = allMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);

  // 2. 组件匹配
  const matchedComponents = matchComponents(semantic);

  // 3. 素材匹配
  const matchedMaterials = matchMaterials(semantic);

  return {
    templates: top3,
    matchedComponents,
    matchedMaterials,
    colorScheme: {
      background: semantic.json.color[0],
      primary: semantic.json.color[1],
      secondary: semantic.json.color[1], // 复用主色
      accent: semantic.json.color[2],
      warning: semantic.json.color[2],
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
    },
  };
}

// ============================================================
// 分支A（模板）布局生成
// ============================================================

export function generateBranchALayout(
  templateId: string,
  semantic: SemanticAnalysisResult,
  supplementaryText: string
): BranchALayout {
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`未找到模板: ${templateId}`);
  }

  // 分析模板结构，生成适配方案
  const leftComps = template.components.filter((c) => c.position.x < 500).map((c) => c.name);
  const rightComps = template.components.filter((c) => c.position.x > 900).map((c) => c.name);
  const topComps = template.components.filter((c) => c.position.y < 80 && c.type === 'title_text').map((c) => c.name);

  const targetLeftComps = semantic.json.layout.find((a) => a.area === 'left')?.component || [];
  const targetRightComps = semantic.json.layout.find((a) => a.area === 'right')?.component || [];

  const adaptations = [
    {
      area: '顶部标题区',
      originalComponents: topComps.length > 0 ? topComps : ['通用标题'],
      adaptedComponents: [`${semantic.json.industry}大数据监控大屏标题`],
      changes: ['复用模板标题组件，更新为图片语义标题文案'],
    },
    {
      area: '左侧分析看板',
      originalComponents: leftComps,
      adaptedComponents: ['负荷趋势曲线图', '数据对比柱状图'],
      changes: [
        '复用模板左侧分区结构',
        `将模板原有${leftComps.length}个组件替换为图片语义对应组件`,
        supplementaryText ? '根据用户附加需求微调组件' : '',
      ].filter(Boolean),
    },
    {
      area: '右侧汇总看板',
      originalComponents: rightComps,
      adaptedComponents: ['核心指标卡片', '故障告警预警列表'],
      changes: [
        '复用模板右侧分区结构',
        `在模板基础上新增${Math.max(0, targetRightComps.length - rightComps.length)}个图片需求组件`,
        '保持模板底层栅格骨架不变',
      ].filter(Boolean),
    },
  ];

  return {
    templateId: template.id,
    templateName: template.name,
    gridAdaptations: adaptations,
    colorAdaptations: [
      `全局底色使用图片提取色 ${semantic.json.color[0]}`,
      `常规数据使用图片主色 ${semantic.json.color[1]}`,
      `过载、故障、异常数据统一使用警示色 ${semantic.json.color[2]} 红色高亮`,
    ],
  };
}

// ============================================================
// 分支B（从零搭建）布局生成
// ============================================================

export function generateBranchBLayout(
  semantic: SemanticAnalysisResult,
  supplementaryText: string
): BranchBLayout {
  const areas = semantic.json.layout;
  const gridCols = 24;
  const gridRows = 21;

  return {
    gridSize: { columns: gridCols, rows: gridRows },
    areas: areas.map((area) => ({
      area: area.area,
      gridW: area.w,
      gridH: area.h,
      components: area.component.map((c) => {
        const map: Record<string, string> = {
          lineChart: '趋势曲线图',
          barChart: '对比柱状图',
          numCard: '指标数值卡片',
          alarmList: '故障告警列表',
          gauge: '仪表盘',
          pieChart: '饼图',
          radarChart: '雷达图',
          rankingList: '排名列表',
          title: '大屏标题',
          table: '数据表格',
        };
        return map[c] || c;
      }),
      pixelRatio: `${area.w}:${area.h}（宽${((area.w / gridCols) * 100).toFixed(0)}% × 高${((area.h / gridRows) * 100).toFixed(0)}%）`,
    })),
    layerOrder: [
      '底层：粒子动态背景',
      '中层：图表 / 卡片 / 列表数据组件',
      '顶层：标题文字 / 红色告警高亮覆盖层',
    ],
    colorSource: 'image_extracted',
  };
}
