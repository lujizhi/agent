/**
 * DSL Instruction Parser & Executor
 * Parses JSON DSL instructions from AI responses and executes them on the editor store.
 */
import type { CanvasComponent, ComponentType } from '@/types/editor';
import { TEMPLATES } from '@/lib/templates';
import { v4 as uuidv4 } from 'uuid';

export interface DSLInstruction {
  action: string;
  [key: string]: unknown;
}

export interface RecommendTemplatesInstruction extends DSLInstruction {
  action: 'recommend_templates';
  reason: string;
  recommendations: {
    template_id: string;
    match_score: number;
    reason: string;
  }[];
}

export interface ApplyTemplateInstruction extends DSLInstruction {
  action: 'apply_template';
  template_id: string;
  dashboard_name?: string;
}

export interface AddComponentInstruction extends DSLInstruction {
  action: 'add_component';
  component_type: ComponentType;
  name?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  props?: Record<string, unknown>;
}

export interface UpdateComponentInstruction extends DSLInstruction {
  action: 'update_component';
  component_id?: string;
  component_name?: string;
  component_type?: string; // Match by type (e.g., "bar_chart" or "title_text")
  updates: Partial<CanvasComponent> & {
    /** Change component type - e.g. "line_chart" to switch chart type */
    new_type?: ComponentType;
    /** Set text content for title_text / number_flip components */
    text?: string;
  };
}

export interface RemoveComponentInstruction extends DSLInstruction {
  action: 'remove_component';
  component_id?: string;
  component_name?: string;
}

export interface BatchUpdateInstruction extends DSLInstruction {
  action: 'batch_update';
  filter: { type?: string; category?: string };
  updates: Partial<CanvasComponent>;
}

export interface UpdateCanvasInstruction extends DSLInstruction {
  action: 'update_canvas';
  dashboard_name?: string;
}

const COMPONENT_DEFAULTS: Record<string, { name: string; width: number; height: number }> = {
  bar_chart: { name: '柱状图', width: 400, height: 300 },
  line_chart: { name: '折线图', width: 400, height: 300 },
  pie_chart: { name: '饼图', width: 300, height: 300 },
  ring_chart: { name: '环形图', width: 300, height: 300 },
  area_chart: { name: '面积图', width: 400, height: 300 },
  scatter_chart: { name: '散点图', width: 400, height: 300 },
  radar_chart: { name: '雷达图', width: 300, height: 300 },
  funnel_chart: { name: '漏斗图', width: 300, height: 400 },
  gauge_chart: { name: '仪表盘', width: 250, height: 200 },
  liquid_chart: { name: '水球图', width: 250, height: 250 },
  map_chart: { name: '地图', width: 500, height: 400 },
  title_text: { name: '标题文本', width: 300, height: 60 },
  number_flip: { name: '数字翻牌器', width: 200, height: 100 },
  kpi_card: { name: 'KPI卡片', width: 240, height: 140 },
  ranking_list: { name: '排名列表', width: 300, height: 400 },
  progress_bar: { name: '进度条', width: 300, height: 40 },
  table_view: { name: '表格', width: 500, height: 300 },
  border_decoration: { name: '边框装饰', width: 400, height: 300 },
  icon_decoration: { name: '图标装饰', width: 60, height: 60 },
};

/**
 * Parse all DSL JSON blocks from AI response text
 */
export function parseDSLInstructions(text: string): DSLInstruction[] {
  const instructions: DSLInstruction[] = [];
  // Match ```json ... ``` blocks
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/g;
  let match: RegExpExecArray | null;

  while ((match = jsonBlockRegex.exec(text)) !== null) {
    try {
      const jsonStr = match[1].trim();
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && parsed.action) {
        instructions.push(parsed);
      }
    } catch {
      // Skip invalid JSON blocks
    }
  }

  return instructions;
}

/**
 * Extract display text (non-JSON parts) from AI response
 */
export function extractDisplayText(text: string): string {
  return text.replace(/```json\s*\n[\s\S]*?\n```/g, '').trim();
}

/**
 * Find a component by name, ID, or type
 */
function findComponent(components: CanvasComponent[], query: { id?: string; name?: string; type?: string }): CanvasComponent | undefined {
  if (query.id) {
    return components.find((c) => c.id === query.id);
  }
  if (query.name) {
    // Try exact match first, then partial match
    const nameStr = query.name as string;
    return components.find((c) => c.name === nameStr) ||
           components.find((c) => c.name.includes(nameStr)) ||
           components.find((c) => nameStr.includes(c.name));
  }
  if (query.type) {
    return components.find((c) => c.type === query.type);
  }
  return undefined;
}

/**
 * Find multiple components matching a filter
 */
function findComponents(components: CanvasComponent[], filter: { type?: string; name_contains?: string }): CanvasComponent[] {
  return components.filter((c) => {
    if (filter.type && c.type !== filter.type) return false;
    if (filter.name_contains && !c.name.includes(filter.name_contains)) return false;
    return true;
  });
}

/**
 * Execute a single DSL instruction against the store
 * Returns a description of what was done
 */
export function executeInstruction(
  instruction: DSLInstruction,
  getComponents: () => CanvasComponent[],
  actions: {
    addComponent: (type: ComponentType, position?: { x: number; y: number }, name?: string, size?: { width: number; height: number }) => string;
    updateComponent: (id: string, updates: Partial<CanvasComponent>) => void;
    removeComponent: (id: string) => void;
    applyTemplate: (templateId: string) => boolean;
    setDashboardName: (name: string) => void;
    selectComponent: (id: string) => void;
    pushHistory: (action: string) => void;
  }
): { success: boolean; message: string; data?: unknown } {
  switch (instruction.action) {
    case 'recommend_templates': {
      const rec = instruction as RecommendTemplatesInstruction;
      const recommendations = rec.recommendations
        .map((r) => {
          const tpl = TEMPLATES.find((t) => t.id === r.template_id);
          return tpl ? { ...r, template: tpl } : null;
        })
        .filter(Boolean);
      return { success: true, message: '模板推荐已生成', data: { reason: rec.reason, recommendations } };
    }

    case 'apply_template': {
      const inst = instruction as ApplyTemplateInstruction;
      const success = actions.applyTemplate(inst.template_id);
      if (success) {
        if (inst.dashboard_name) {
          actions.setDashboardName(inst.dashboard_name);
        }
        return { success: true, message: `已应用模板${inst.dashboard_name ? '：' + inst.dashboard_name : ''}` };
      }
      return { success: false, message: '未找到对应模板' };
    }

    case 'add_component': {
      const inst = instruction as AddComponentInstruction;
      const defaults = COMPONENT_DEFAULTS[inst.component_type];
      if (!defaults) {
        return { success: false, message: `不支持的组件类型: ${inst.component_type}` };
      }
      const name = inst.name || defaults.name;
      const position = inst.position || { x: 100 + Math.random() * 300, y: 100 + Math.random() * 200 };
      const size = inst.size || { width: defaults.width, height: defaults.height };
      const newId = actions.addComponent(inst.component_type, position, name, size);
      actions.pushHistory(`AI添加${name}`);
      return { success: true, message: `已添加组件：${name}`, data: { componentId: newId } };
    }

    case 'update_component': {
      const inst = instruction as UpdateComponentInstruction;
      const components = getComponents();
      // Try to find by id, name, or type
      let comp = findComponent(components, { id: inst.component_id, name: inst.component_name, type: inst.component_type });

      // If still not found, try fuzzy name matching (e.g. "销售额" matches "月度销售额趋势")
      if (!comp && inst.component_name) {
        comp = components.find((c) => c.name.includes(inst.component_name as string));
      }

      if (!comp) {
        return { success: false, message: `未找到组件: ${inst.component_name || inst.component_id || inst.component_type}` };
      }

      const updates: Partial<CanvasComponent> = {};
      const detailParts: string[] = [];

      // Handle type change (e.g. switching from bar_chart to line_chart)
      if (inst.updates.new_type) {
        const newType = inst.updates.new_type;
        const defaults = COMPONENT_DEFAULTS[newType];
        updates.type = newType;
        if (defaults) {
          updates.name = inst.updates.name || defaults.name;
        }
        detailParts.push(`类型切换为${defaults?.name || newType}`);
      } else {
        if (inst.updates.name) {
          updates.name = inst.updates.name;
          detailParts.push(`名称改为"${inst.updates.name}"`);
        }
      }

      // Handle text content (for title_text, number_flip)
      if (inst.updates.text) {
        updates.props = { ...(comp.props || {}), text: inst.updates.text };
        detailParts.push(`内容改为"${inst.updates.text}"`);
      }

      if (inst.updates.position) {
        updates.position = inst.updates.position;
        detailParts.push('调整位置');
      }
      if (inst.updates.size) {
        updates.size = inst.updates.size;
        detailParts.push('调整大小');
      }
      if (inst.updates.props && !inst.updates.text) {
        updates.props = inst.updates.props;
        detailParts.push('更新配置');
      }
      if (inst.updates.visible !== undefined) {
        updates.visible = inst.updates.visible;
        detailParts.push(inst.updates.visible ? '显示' : '隐藏');
      }
      if (inst.updates.locked !== undefined) {
        updates.locked = inst.updates.locked;
        detailParts.push(inst.updates.locked ? '锁定' : '解锁');
      }

      actions.updateComponent(comp.id, updates);
      actions.pushHistory(`AI修改${comp.name}`);
      const detail = detailParts.length > 0 ? `（${detailParts.join('、')}）` : '';
      return { success: true, message: `已修改组件「${comp.name}」${detail}` };
    }

    case 'remove_component': {
      const inst = instruction as RemoveComponentInstruction;
      const components = getComponents();
      const comp = findComponent(components, { id: inst.component_id, name: inst.component_name });
      if (!comp) {
        return { success: false, message: `未找到组件: ${inst.component_name || inst.component_id}` };
      }
      const compName = comp.name;
      actions.removeComponent(comp.id);
      actions.pushHistory(`AI删除${compName}`);
      return { success: true, message: `已删除组件：${compName}` };
    }

    case 'batch_update': {
      const inst = instruction as BatchUpdateInstruction;
      const components = getComponents();
      let count = 0;
      components.forEach((comp) => {
        let match = true;
        if (inst.filter.type && comp.type !== inst.filter.type) match = false;
        if (match) {
          const updates: Partial<CanvasComponent> = {};
          if (inst.updates.name) updates.name = inst.updates.name;
          if (inst.updates.position) updates.position = inst.updates.position;
          if (inst.updates.size) updates.size = inst.updates.size;
          if (inst.updates.props) updates.props = inst.updates.props;
          actions.updateComponent(comp.id, updates);
          count++;
        }
      });
      if (count > 0) {
        actions.pushHistory(`AI批量修改${count}个组件`);
      }
      return { success: true, message: `已批量修改${count}个组件` };
    }

    case 'update_canvas': {
      const inst = instruction as UpdateCanvasInstruction;
      if (inst.dashboard_name) {
        actions.setDashboardName(inst.dashboard_name);
      }
      return { success: true, message: '画布已更新' };
    }

    default:
      return { success: false, message: `未知的指令类型: ${instruction.action}` };
  }
}

/**
 * Get template info for recommendation cards
 */
export function getTemplateById(templateId: string) {
  return TEMPLATES.find((t) => t.id === templateId);
}
