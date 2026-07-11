/**
 * 图生大屏 — 交互逻辑推理引擎 (Interaction Logic Reasoning Engine)
 * 对应文档 3.6 节：交互推理与全局后处理优化规则
 *
 * 自动生成基础交互逻辑存入大屏配置：
 * - 指标卡片点击查看明细
 * - 图表悬浮展示数值
 * - 告警列表点击查看故障详情
 *
 * 所有交互逻辑存入大屏JSON的event字段
 */

import { v4 as uuidv4 } from 'uuid';
import type { InteractionEvent, CanvasComponent } from '@/types/editor';

// ============================================================
// 交互事件类型定义
// ============================================================

interface InteractionRule {
  componentTypes: string[];
  eventType: InteractionEvent['type'];
  triggerEvent: InteractionEvent['triggerEvent'];
  action: InteractionEvent['action'];
  descriptionTemplate: (compName: string) => string;
  configTemplate: (compId: string, compName: string) => Record<string, unknown>;
}

// ============================================================
// 内置交互规则库
// ============================================================

const INTERACTION_RULES: InteractionRule[] = [
  // 指标卡点击查看明细
  {
    componentTypes: ['kpi_card', 'number_flip'],
    eventType: 'card_click_detail',
    triggerEvent: 'click',
    action: 'show_modal',
    descriptionTemplate: (name) => `${name}卡片点击弹窗查看对应时段明细数据`,
    configTemplate: (id, name) => ({
      modalTitle: `${name}明细数据`,
      modalWidth: 800,
      modalHeight: 500,
      dataSource: 'mock_detail',
      fields: ['时间', '数值', '同比变化', '环比变化'],
    }),
  },
  // 图表悬浮展示数值
  {
    componentTypes: ['bar_chart', 'line_chart', 'area_chart', 'scatter_chart', 'pie_chart', 'ring_chart', 'radar_chart', 'funnel_chart'],
    eventType: 'chart_hover_value',
    triggerEvent: 'hover',
    action: 'show_tooltip',
    descriptionTemplate: (name) => `${name}鼠标悬浮展示精准数值`,
    configTemplate: (id, name) => ({
      tooltipTemplate: '${name}: ${value}',
      showMarker: true,
      animationDuration: 200,
    }),
  },
  // 告警列表点击查看详情
  {
    componentTypes: ['ranking_list', 'table_view', 'alarm_list'],
    eventType: 'alert_click_detail',
    triggerEvent: 'click',
    action: 'show_modal',
    descriptionTemplate: (name) => `${name}条目点击查看故障点位、处理进度、紧急等级详情`,
    configTemplate: (id, name) => ({
      modalTitle: '告警详情',
      modalWidth: 900,
      modalHeight: 600,
      fields: ['故障点位', '故障类型', '发生时间', '处理状态', '紧急等级', '处理人员', '预计恢复时间'],
      highlightFields: ['紧急等级'],
    }),
  },
  // 仪表盘点击查看KPI达成详情
  {
    componentTypes: ['gauge_chart'],
    eventType: 'chart_hover_value',
    triggerEvent: 'click',
    action: 'show_modal',
    descriptionTemplate: (name) => `${name}仪表盘点击查看KPI达成率明细`,
    configTemplate: (id, name) => ({
      modalTitle: `${name}KPI详情`,
      modalWidth: 600,
      modalHeight: 400,
      fields: ['指标名称', '目标值', '当前值', '达成率', '趋势'],
    }),
  },
];

// ============================================================
// 交互事件自动生成引擎
// ============================================================

/**
 * 根据画布组件列表，自动生成全套交互事件
 */
export function generateInteractionEvents(
  components: CanvasComponent[]
): InteractionEvent[] {
  const events: InteractionEvent[] = [];

  for (const comp of components) {
    // 跳过装饰类、标题类组件
    if (comp.type === 'border_decoration' || comp.type === 'icon_decoration' || comp.type === 'title_text') {
      continue;
    }

    // 查找匹配的交互规则
    for (const rule of INTERACTION_RULES) {
      if (rule.componentTypes.includes(comp.type)) {
        events.push({
          id: uuidv4(),
          type: rule.eventType,
          triggerComponentId: comp.id,
          triggerEvent: rule.triggerEvent,
          action: rule.action,
          config: rule.configTemplate(comp.id, comp.name),
          description: rule.descriptionTemplate(comp.name),
        });
        break; // 每个组件只匹配第一条规则
      }
    }
  }

  return events;
}

// ============================================================
// 交互事件格式化输出
// ============================================================

/**
 * 将交互事件列表格式化为展示文本
 */
export function formatInteractionEvents(events: InteractionEvent[]): string {
  if (events.length === 0) {
    return '未生成交互事件（画布中无可交互的业务组件）';
  }

  const lines: string[] = [];
  const byType: Record<string, InteractionEvent[]> = {};

  for (const event of events) {
    if (!byType[event.type]) byType[event.type] = [];
    byType[event.type].push(event);
  }

  const typeNames: Record<string, string> = {
    'card_click_detail': '📋 指标卡片点击明细',
    'chart_hover_value': '📊 图表悬浮数值提示',
    'alert_click_detail': '🚨 告警列表详情跳转',
    'custom': '🔧 自定义交互',
  };

  for (const [type, evts] of Object.entries(byType)) {
    lines.push(`### ${typeNames[type] || type}`);
    for (const evt of evts) {
      lines.push(`- ${evt.description}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 生成交互事件的 DSL JSON 字符串（用于存入大屏JSON的event字段）
 */
export function generateEventDSL(events: InteractionEvent[]): string {
  return JSON.stringify(
    events.map((e) => ({
      id: e.id,
      type: e.type,
      trigger: { componentId: e.triggerComponentId, event: e.triggerEvent },
      action: e.action,
      config: e.config,
    })),
    null,
    2
  );
}

// ============================================================
// 全局后处理优化描述
// ============================================================

export interface PostProcessResult {
  layoutOptimizations: string[];
  animationAdaptations: string[];
  layerOptimizations: string[];
}

export function generatePostProcessPlan(
  components: CanvasComponent[]
): PostProcessResult {
  return {
    layoutOptimizations: [
      '自动微调左右看板组件间距，消除视觉拥挤',
      '各组件自动对齐画布网格，保证版面规整',
      '组件尺寸自适应画布比例，避免过大或过小',
    ],
    animationAdaptations: [
      '所有图表添加平滑加载动画（淡入+缓动）',
      '边框装饰添加微光流动动效',
      '数据卡片数值添加上翻动效',
    ],
    layerOptimizations: [
      '底层：粒子动态背景 + 网格底纹',
      '中层：图表 / 卡片 / 列表等数据组件',
      '顶层：标题组件 / 红色告警高亮覆盖层 / 交互热区',
      '全画面图层划分为背景层、动态面板层、标题高亮层',
    ],
  };
}
