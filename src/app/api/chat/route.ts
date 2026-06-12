import { NextRequest } from 'next/server';

// ============================================================
// 对话式BI智能体Agent — 内置4步工作流模拟引擎
// 严格对齐《对话式BI智能体Agent创作交互文档》(2026/06)
// 核心演示场景：电力运维大数据监控大屏（左右两侧看板布局）
// ============================================================

const ALL_TEMPLATES: Record<string, {
  name: string; industry: string; style: string; layout: string;
  features: string; components: string;
}> = {
  // ─── 电力行业（文档核心演示场景）───
  'tpl-power-monitor': {
    name: '电力全域运维监控大屏', industry: '电力', style: '深色科技风',
    layout: '经典左右双侧看板布局（左：运维分析图表 / 右：核心指标+告警列表）',
    features: '适配区域电网综合运维场景，左右分区独立承载各类数据组件，内置电力负荷、供电量、故障预警核心图表与卡片组件，适配7×24小时运维监控',
    components: '标题、全网电力负荷趋势折线图、各站点供电量对比柱状图、KPI卡片(实时总负荷/最大峰值/供电总量/线路完好率/异常告警数)x5、故障预警列表',
  },
  'tpl-power-energy': {
    name: '电网能耗数据总览大屏', industry: '电力', style: '深色科技风',
    layout: '轻量化左右看板布局（左：核心指标卡片组 / 右：多维度能耗趋势图表）',
    features: '侧重电力能耗统计、各站点数据对比，分区清晰，适配电力数据分析、报表展示场景',
    components: '标题、KPI卡片(全网总能耗/今日用电量/节能完成率)x3、数字翻牌器(碳排放指标)、年度节能进度条、站点能耗趋势折线图、各区域用电统计柱状图、站点能耗明细表',
  },
  'tpl-power-alert': {
    name: '电力负荷监测预警大屏', industry: '电力', style: '深色科技风',
    layout: '左右对称看板布局（左：趋势数据分析 / 右：告警信息汇总）',
    features: '聚焦电网负荷动态监测、过载异常预警，适配调度中心实时监控场景',
    components: '标题、实时负荷曲线折线图、负荷预测趋势面积图、仪表盘(当前负荷率/线路安全指数)x2、KPI卡片(过载线路数)、告警信息汇总列表',
  },
  // ─── 政务/智慧城市 ───
  'tpl-gov-monitor': {
    name: '政务全域监控标准大屏', industry: '政务', style: '科技蓝',
    layout: '上标题+中地图+下双分区数据统计',
    features: '适配城市综合政务监控场景，内置政务通用数据卡片、趋势图表，科技蓝基础风格',
    components: '标题、KPI卡片x4、城市地图、人口趋势折线图、政务办理柱状图、区域排名、分类占比饼图',
  },
  'tpl-smart-city-ov': {
    name: '智慧城市数据总览大屏', industry: '智慧城市', style: '政企庄重',
    layout: '左右分区布局（左地图总览+右细分统计）',
    features: '侧重城市全域数据整合，支持多维度政务数据展示，风格庄重政企风',
    components: '标题、城市全域地图、KPI卡片x4、实时预警列表、各区GDP柱状图、人口趋势折线图、产业占比饼图',
  },
  'tpl-gov-indicators': {
    name: '政务指标监测大屏', industry: '政务', style: '暗黑科技',
    layout: '模块化平铺布局',
    features: '聚焦政务核心指标监控，重点突出数据趋势、办理效率指标',
    components: '标题、数字翻牌器x4、政务办理柱状图、月度趋势折线图、预警列表、KPI卡片x2、进度条',
  },
  // ─── 其他行业 ───
  'tpl-sales-dashboard': {
    name: '销售业绩驾驶舱', industry: '零售', style: '商务简约',
    layout: '上KPI+中趋势图表+下排名漏斗',
    features: '适配零售销售监控，全面展示销售核心指标、趋势分析、产品对比',
    components: '标题、KPI卡片x4、销售趋势折线图、产品线对比柱状图、区域占比饼图、销售排行、转化漏斗',
  },
  'tpl-production-monitor': {
    name: '生产监控大屏', industry: '工业智造', style: '工业风',
    layout: '仪表盘核心+产线对比+质量评估',
    features: '适配制造业生产监控，实时展示设备状态、产能趋势、质量指标',
    components: '标题、仪表盘x2、KPI卡片x2、产量趋势面积图、产线对比柱状图、质量评估雷达图、设备状态表格',
  },
  'tpl-finance-overview': {
    name: '财务经营概览', industry: '金融', style: '商务简约',
    layout: '上翻牌器+中双图表+下三模块',
    features: '适配金融财务经营分析，全面展示营收、利润、资产等核心指标',
    components: '标题、数字翻牌器x4、营收趋势折线图、费用结构柱状图、收入构成环形图、经营评分雷达图、预算执行进度条',
  },
  'tpl-security-center': {
    name: '安防监控指挥大屏', industry: '安防', style: '暗黑科技',
    layout: '中地图核心+四周数据卡片环绕',
    features: '适配安防监控指挥，实时展示告警态势、事件分布、设备状态',
    components: '标题、KPI卡片x4、安防态势地图、实时告警列表、告警趋势折线图、事件分布柱状图、辖区排名、设备状态表格',
  },
  'tpl-logistics-dashboard': {
    name: '物流调度数据大屏', industry: '物流', style: '科技蓝',
    layout: '上KPI+中地图核心+下趋势分析',
    features: '适配智慧物流调度，实时展示运力、路线效率、车辆状态',
    components: '标题、KPI卡片x4、物流轨迹地图、运力趋势折线图、区域对比柱状图、路线效率饼图、车辆状态表格',
  },
  'tpl-cultural-travel': {
    name: '文旅综合展示大屏', industry: '文旅', style: '清新亮色',
    layout: '上标题+中核心热力图+下多模块',
    features: '适配文旅综合数据展示，呈现游客趋势、景点热度、收入构成',
    components: '标题、KPI卡片x4、景区热力图、游客趋势折线图、景点热度柱状图、收入构成环形图、客流排名',
  },
};

// ============================================================
// 意图检测 — 对齐文档三、核心能力定义
// ============================================================

function detectIndustry(msg: string): { industry: string; scene: string; usage: string; templates: string[] } {
  // ── 电力行业（核心演示）──
  if (msg.includes('电力') || msg.includes('电网') || msg.includes('供电') || msg.includes('负荷') || msg.includes('能耗')) {
    return {
      industry: '电力', scene: '电力行业全域运维、供电负荷、能耗数据实时监控',
      usage: '电力日常运维监控、供电能耗统计、电网运行异常监测',
      templates: ['tpl-power-monitor', 'tpl-power-energy', 'tpl-power-alert'],
    };
  }
  // ── 政务 ──
  if (msg.includes('政务') || (msg.includes('城市') && (msg.includes('监控') || msg.includes('管理')))) {
    return {
      industry: '政务', scene: '城市政务大数据实时监控',
      usage: '日常政务数据实时监控、数据可视化展示',
      templates: ['tpl-gov-monitor', 'tpl-smart-city-ov', 'tpl-gov-indicators'],
    };
  }
  // ── 销售/零售 ──
  if (msg.includes('销售') || msg.includes('零售') || msg.includes('业绩')) {
    return {
      industry: '零售', scene: '零售销售业绩监控分析',
      usage: '销售数据实时监控、业绩趋势分析',
      templates: ['tpl-sales-dashboard', 'tpl-gov-monitor', 'tpl-finance-overview'],
    };
  }
  // ── 工业/生产 ──
  if (msg.includes('生产') || msg.includes('制造') || msg.includes('产线') || msg.includes('工业')) {
    return {
      industry: '工业智造', scene: '工业生产制造实时监控',
      usage: '生产数据实时监控、产能趋势分析',
      templates: ['tpl-production-monitor', 'tpl-gov-indicators', 'tpl-finance-overview'],
    };
  }
  // ── 金融/财务 ──
  if (msg.includes('财务') || msg.includes('金融') || msg.includes('营收') || msg.includes('利润')) {
    return {
      industry: '金融', scene: '企业财务经营数据分析',
      usage: '财务数据实时展示、经营指标分析',
      templates: ['tpl-finance-overview', 'tpl-sales-dashboard', 'tpl-production-monitor'],
    };
  }
  // ── 安防 ──
  if (msg.includes('安防') || (msg.includes('监控') && msg.includes('告警'))) {
    return {
      industry: '安防', scene: '安防监控指挥调度',
      usage: '安防态势实时监控、告警事件处置',
      templates: ['tpl-security-center', 'tpl-gov-monitor', 'tpl-smart-city-ov'],
    };
  }
  // ── 物流 ──
  if (msg.includes('物流') || msg.includes('运单') || msg.includes('配送')) {
    return {
      industry: '物流', scene: '智慧物流调度监控',
      usage: '物流数据实时监控、运力调度分析',
      templates: ['tpl-logistics-dashboard', 'tpl-gov-monitor', 'tpl-production-monitor'],
    };
  }
  // ── 文旅 ──
  if (msg.includes('文旅') || msg.includes('旅游') || msg.includes('景区') || msg.includes('游客')) {
    return {
      industry: '文旅', scene: '文旅综合数据展示',
      usage: '文旅数据展示、游客趋势分析',
      templates: ['tpl-cultural-travel', 'tpl-smart-city-ov', 'tpl-gov-monitor'],
    };
  }
  // ── 智慧城市 ──
  if (msg.includes('智慧城市') || msg.includes('城市数据')) {
    return {
      industry: '智慧城市', scene: '智慧城市全域数据总览',
      usage: '城市数据实时监控、全域数据展示',
      templates: ['tpl-smart-city-ov', 'tpl-gov-monitor', 'tpl-gov-indicators'],
    };
  }
  // ── 默认 ──
  return {
    industry: '通用', scene: '数据可视化大屏展示',
    usage: '数据实时监控、数据可视化展示',
    templates: ['tpl-power-monitor', 'tpl-sales-dashboard', 'tpl-finance-overview'],
  };
}

function detectStyle(msg: string): string {
  if (msg.includes('深色') || msg.includes('科技风') || msg.includes('暗黑')) return '深色科技风';
  if (msg.includes('科技蓝') || msg.includes('蓝色')) return '科技蓝';
  if (msg.includes('庄重') || msg.includes('政企')) return '政企庄重';
  if (msg.includes('清新') || msg.includes('亮色') || msg.includes('明亮')) return '清新亮色';
  if (msg.includes('赛博') || msg.includes('科幻')) return '赛博科技';
  if (msg.includes('商务') || msg.includes('简约')) return '商务简约';
  if (msg.includes('工业')) return '工业风';
  return '深色科技风';
}

function detectLayout(msg: string): string {
  if (msg.includes('左右') || msg.includes('双侧') || msg.includes('看板')) return '标准左右两侧看板布局，双侧模块化分区展示，版面规整对称、主次分明';
  if (msg.includes('上下')) return '上下分区布局';
  if (msg.includes('居中') || msg.includes('中心')) return '居中核心布局';
  if (msg.includes('平铺')) return '多模块平铺布局';
  if (msg.includes('紧凑') || msg.includes('极简')) return '极简紧凑布局';
  if (msg.includes('大气') || msg.includes('清晰') || msg.includes('规整') || msg.includes('专业')) return '标准左右两侧看板布局，双侧模块化分区展示，版面规整对称、主次分明';
  return '经典大屏分区布局';
}

function detectComponents(msg: string): string[] {
  const comps: string[] = [];
  if (msg.includes('负荷') || (msg.includes('数据') && msg.includes('卡片'))) comps.push('电力核心负荷数据卡片');
  if (msg.includes('地图') || msg.includes('地理')) comps.push('城市地理地图');
  if (msg.includes('折线图') || msg.includes('趋势图') || msg.includes('趋势')) comps.push('负荷趋势折线图');
  if (msg.includes('柱状图') || msg.includes('柱形图') || msg.includes('供电量') || msg.includes('站点')) comps.push('站点供电量柱状图');
  if (msg.includes('饼图') || msg.includes('占比') || msg.includes('构成')) comps.push('饼图');
  if (msg.includes('预警') || msg.includes('告警') || msg.includes('故障') || msg.includes('列表')) comps.push('故障预警列表组件');
  if (msg.includes('卡片') || msg.includes('KPI') || msg.includes('指标卡') || msg.includes('统计卡片')) comps.push('核心数据卡片');
  if (msg.includes('进度') || msg.includes('完成')) comps.push('进度条');
  if (msg.includes('数字翻牌') || msg.includes('翻牌器') || msg.includes('大字')) comps.push('数字翻牌器');
  if (msg.includes('表格')) comps.push('数据表格');
  return comps;
}

// ============================================================
// 4步工作流响应 — 严格对齐文档第四章演示样例
// ============================================================

/** Step 1 + Step 2：意图解析 + 3模板推荐 */
function buildCreateResponse(msg: string): string {
  const { industry, scene, usage, templates } = detectIndustry(msg);
  const style = detectStyle(msg);
  const layout = detectLayout(msg);
  const comps = detectComponents(msg);
  const compStr = comps.length > 0 ? comps.join('、') : '图表模块+数据卡片+业务组件';

  const t1 = ALL_TEMPLATES[templates[0]];
  const t2 = ALL_TEMPLATES[templates[1]];
  const t3 = ALL_TEMPLATES[templates[2]];

  return `### 第一步：用户意图解析完成
核心场景：${scene}
风格需求：${style}，专业沉稳、数据高亮突出
布局需求：${layout}
必备组件：${compStr}
核心用途：${usage}

### 第二步：匹配内置模板（3套优选）
1. **${t1.name}**：${t1.features}，采用${t1.layout}，内置${t1.components.split('、').slice(0, 4).join('、')}等组件，深色科技基底，适配${industry === '电力' ? '7×24小时运维监控' : '日常常态化监控'}；
2. **${t2.name}**：${t2.features}，采用${t2.layout}，内置${t2.components.split('、').slice(0, 4).join('、')}等组件，分区清晰，适配${t2.industry === '电力' ? '电力数据分析、报表展示场景' : '数据分析展示场景'}；
3. **${t3.name}**：${t3.features}，采用${t3.layout}，内置${t3.components.split('、').slice(0, 4).join('、')}等组件，适配${t3.industry === '电力' ? '调度中心实时监控场景' : '实时监控场景'}。

\`\`\`json
{"action":"recommend_templates","reason":"基于您描述的${scene}场景","recommendations":[{"template_id":"${templates[0]}","match_score":0.95,"reason":"${t1.features}"},{"template_id":"${templates[1]}","match_score":0.88,"reason":"${t2.features}"},{"template_id":"${templates[2]}","match_score":0.82,"reason":"${t3.features}"}]}
\`\`\`

请你选择需要使用的模板（回复序号/名称即可），我将基于你的风格与组件需求，语义化渲染生成专属初版大屏。`;
}

/** Step 3 + Step 4：模板应用 + 二次编辑开放 */
function buildApplyResponse(templateId: string): string {
  const tpl = ALL_TEMPLATES[templateId];
  if (!tpl) {
    return `已为大屏应用模板。\n\n\`\`\`json\n{"action":"apply_template","template_id":"tpl-power-monitor","dashboard_name":"电力运维大数据监控大屏"}\n\`\`\``;
  }

  const isPower = tpl.industry === '电力';
  const compList = tpl.components.split('、');
  const chartComps = compList.filter(c => c.includes('图') || c.includes('曲线'));
  const kpiComps = compList.filter(c => c.includes('卡片') || c.includes('翻牌') || c.includes('KPI'));
  const alertComps = compList.filter(c => c.includes('预警') || c.includes('告警') || c.includes('列表'));
  const otherComps = compList.filter(c => !chartComps.includes(c) && !kpiComps.includes(c) && !alertComps.includes(c) && !c.includes('标题') && !c.includes('分割'));

  // Power-specific response matching the document's demo
  if (isPower) {
    return `### 第三步：模板语义转化&大屏生成完成
已基于【${tpl.name}】模板，结合你的${tpl.layout.includes('左右') ? '左右两侧看板布局' : ''}需求完成全量语义适配，**初版电力运维大数据监控大屏已生成**，具体配置如下：

1. **全局风格**：采用电力行业标准深色科技风，主色调为电力深蓝+科技青高亮配色，搭配哑光深色底纹、微光科技边框，工业专业感强，适配长时间监控观影场景
2. **整体布局**：采用电力大屏通用**顶部标题栏+左右双侧看板**标准布局，左右分区独立展示不同维度数据组件，版面对称规整、数据分类清晰、阅读层级明确
3. **组件语义落地**：
- 顶部：电力运维大数据监控大屏标题+系统时间+电网运行状态全局提示组件
${chartComps.length ? `- 左侧数据看板：承载核心运维分析组件，包含${chartComps.join('、')}，用于展示电力数据变化趋势与站点数据差异\n` : ''}${kpiComps.length || alertComps.length ? `- 右侧数据看板：承载核心指标与告警组件，包含${[...kpiComps, ...alertComps].join('、')}，集中展示关键运维指标与异常信息\n` : ''}4. **适配能力**：大屏所有组件支持数据实时刷新、状态动态联动、异常数据高亮，完全适配电力运维监控业务场景

\`\`\`json
{"action":"apply_template","template_id":"${templateId}","dashboard_name":"${tpl.name}"}
\`\`\`

### 第四步：开放二次编辑能力
当前初版左右看板结构的电力运维大屏已生成，你可随时告诉我修改需求，支持**单组件修改、左右看板布局调整、配色更换、图表替换、数据更新、模块增删**等所有精细化调整。

示例修改指令：「把左侧负荷趋势图换成曲线图」「高亮右侧看板异常数据颜色」「新增电力统计组件到左侧看板」「调整左右看板宽度比例」`;
  }

  // Generic response for other industries
  return `### 第三步：模板语义转化&大屏生成完成
已基于【${tpl.name}】模板，结合你的需求完成全量语义适配，**初版${tpl.industry}大屏已生成**，具体配置如下：

1. **全局风格**：统一${tpl.style}主色调，搭配哑光底纹、科技边框，符合${tpl.industry}大屏视觉规范，大气简洁
2. **整体布局**：采用${tpl.layout}，分区清晰、层级分明
3. **组件语义落地**：
${chartComps.length ? `- 图表模块：${chartComps.join('、')}\n` : ''}${kpiComps.length ? `- 数据卡片：${kpiComps.join('、')}\n` : ''}${alertComps.length ? `- 预警告警：${alertComps.join('、')}\n` : ''}${otherComps.length ? `- 业务组件：${otherComps.join('、')}\n` : ''}4. **适配能力**：大屏支持全屏展示、数据实时刷新，适配${tpl.industry}场景使用需求

\`\`\`json
{"action":"apply_template","template_id":"${templateId}","dashboard_name":"${tpl.name}"}
\`\`\`

### 第四步：开放二次编辑能力
当前初版大屏已生成，你可以通过以下方式精准修改任意组件：

**📌 操作步骤：**
1. **点击画布中的组件**（图表/卡片/标题），组件边框高亮即为选中
2. 右侧对话框顶部提示「当前选中：组件名」
3. **在对话框输入修改指令**，我会精准修改你选中的组件

**💬 试试这些指令：**
- 选中图表后：「把它换成饼图」
- 选中卡片后：「调大一点」
- 选中标题后：「改成 2025年度XX数据报告」
- 不选组件：「整体色调调深一点」
- 不选组件：「新增预警数据列表」`;
}

/** Step 4：用户修改指令响应 — 支持选中组件精准定位 */
function buildModifyResponse(msg: string, selectedContext: string | null): string {
  const selName = selectedContext ? selectedContext.replace(/\s*\(.*\)\s*$/, '').trim() : '';
  const selType = selectedContext ? (selectedContext.match(/\(([^)]+)\)/) || [])[1] || '' : '';

  // ─── 电力行业专属：异常数据高亮 ───
  if (msg.includes('高亮') || msg.includes('异常') || msg.includes('红色')) {
    if (msg.includes('故障') || msg.includes('告警') || msg.includes('列表')) {
      return `已完成故障告警列表组件优化升级：
1. **数据高亮优化**：对负荷过载、数据异常、站点离线等异常数据配置红色动态高亮效果，正常数据保持青蓝色常态展示，运维数据状态一目了然
2. **组件优化升级**：优化告警列表组件，新增故障站点、故障类型、发生时间、处理状态、紧急等级等展示字段，适配电力运维告警统计需求
3. **布局自适应适配**：基于左右双侧看板结构，自动微调左右板块占比、各组件间距，平衡双侧版面视觉效果

\`\`\`json
{"action":"batch_update","filter":{"type":"ranking_list"},"updates":{"props":{"highlight_alert":true,"accent_color":"#ef4444"}}}
\`\`\``;
    }
    return `已对异常数据配置红色动态高亮效果，正常数据保持青蓝色常态展示，数据状态一目了然。\n\n\`\`\`json\n{"action":"batch_update","filter":{},"updates":{"props":{"accent_color":"#ef4444","highlight_mode":"dynamic"}}}\n\`\`\``;
  }

  // ─── 电力行业专属：左右看板调整 ───
  if (msg.includes('看板') && (msg.includes('宽') || msg.includes('比例') || msg.includes('调整'))) {
    return `已调整左右看板宽度比例，双侧版面视觉效果已重新平衡，各组件间距自动适配，无重叠、无留白失衡问题。`;
  }

  // ─── 选中组件精准修改 ───
  if (selName && (msg.includes('它') || msg.includes('这个') || msg.includes('改') || msg.includes('换') || msg.includes('样式') || msg.includes('颜色') || msg.includes('大小') || msg.includes('优化'))) {
    if (msg.includes('颜色') || msg.includes('色调') || msg.includes('样式') || msg.includes('高亮')) {
      return `已修改「${selName}」的配色样式，视觉效果已更新。\n\n\`\`\`json\n{"action":"update_component","component_name":"${selName}","updates":{"props":{"accent_color":"#f59e0b"}}}\n\`\`\``;
    }
    if (msg.includes('大') || msg.includes('小') || msg.includes('尺寸') || msg.includes('宽') || msg.includes('高')) {
      return `已调整「${selName}」的尺寸，布局已自动适配。\n\n\`\`\`json\n{"action":"update_component","component_name":"${selName}","updates":{"size":{"width":360,"height":280}}}\n\`\`\``;
    }
    if (msg.includes('换成') || msg.includes('切换') || msg.includes('改成')) {
      if (msg.includes('饼图') || msg.includes('饼')) {
        return `已将「${selName}」切换为饼图。\n\n\`\`\`json\n{"action":"update_component","component_name":"${selName}","updates":{"new_type":"pie_chart"}}\n\`\`\``;
      }
      if (msg.includes('折线') || msg.includes('曲线')) {
        return `已将「${selName}」切换为折线图（曲线图）。\n\n\`\`\`json\n{"action":"update_component","component_name":"${selName}","updates":{"new_type":"line_chart"}}\n\`\`\``;
      }
      if (msg.includes('柱状')) {
        return `已将「${selName}」切换为柱状图。\n\n\`\`\`json\n{"action":"update_component","component_name":"${selName}","updates":{"new_type":"bar_chart"}}\n\`\`\``;
      }
    }
    if (msg.includes('优化') || msg.includes('样式')) {
      return `已完成「${selName}」组件的样式优化升级，视觉效果已更新。`;
    }
    if (msg.includes('删除') || msg.includes('去掉') || msg.includes('移除')) {
      return `已删除组件「${selName}」，周边组件布局已自动适配调整。\n\n\`\`\`json\n{"action":"remove_component","component_name":"${selName}"}\n\`\`\``;
    }
  }

  // ─── 未选中组件时的通用修改 ───
  // 标题
  if (msg.includes('标题') && (msg.includes('改') || msg.includes('换') || msg.includes('修改'))) {
    const qm = msg.match(/["""「]([^""」"]+)[""」"]/);
    const title = qm ? qm[1] : '数据大屏';
    return `已将标题更新为「${title}」。\n\n\`\`\`json\n{"action":"update_component","component_type":"title_text","updates":{"text":"${title}"}}\n\`\`\``;
  }
  // 图表类型切换
  if (msg.includes('饼图') || (msg.includes('换成') && msg.includes('饼'))) {
    return `已将对应图表切换为饼图。\n\n\`\`\`json\n{"action":"update_component","component_name":"趋势","updates":{"new_type":"pie_chart"}}\n\`\`\``;
  }
  if (msg.includes('折线图') || msg.includes('曲线图') || (msg.includes('换成') && msg.includes('折线'))) {
    return `已将对应图表切换为折线图。\n\n\`\`\`json\n{"action":"update_component","component_name":"对比","updates":{"new_type":"line_chart"}}\n\`\`\``;
  }
  if (msg.includes('柱状图') || (msg.includes('换成') && msg.includes('柱状'))) {
    return `已将对应图表切换为柱状图。\n\n\`\`\`json\n{"action":"update_component","component_name":"趋势","updates":{"new_type":"bar_chart"}}\n\`\`\``;
  }
  // 全局配色
  if (msg.includes('颜色') || msg.includes('色调') || msg.includes('配色') || msg.includes('风格')) {
    const style = detectStyle(msg);
    return `已完成大屏配色优化调整：\n1. 全局优化：主色调已调整，适配${style}视觉场景\n2. 组件适配：所有图表、卡片组件颜色已同步更新\n3. 布局适配：自动微调各模块间距，保证整体均衡规整\n\n\`\`\`json\n{"action":"batch_update","filter":{},"updates":{"props":{"accent_color":"#0a4b8a"}}}\n\`\`\``;
  }
  // 新增组件
  if (msg.includes('新增') || msg.includes('添加') || msg.includes('增加')) {
    if (msg.includes('预警') || msg.includes('告警') || msg.includes('故障') || msg.includes('列表')) {
      return `已在${msg.includes('左侧') ? '左侧看板' : msg.includes('右侧') ? '右侧看板' : '大屏右侧'}新增「故障预警列表」组件，展示故障站点、故障类型、发生时间、处理状态、紧急等级等字段。布局已自动微调。\n\n\`\`\`json\n{"action":"add_component","component_type":"ranking_list","name":"故障预警列表","position":{"x":970,"y":600},"size":{"width":930,"height":250},"props":{}}\n\`\`\``;
    }
    if (msg.includes('电力统计') || msg.includes('统计组件')) {
      return `已在${msg.includes('左侧') ? '左侧看板' : '大屏中'}新增电力统计组件，布局已自动适配。\n\n\`\`\`json\n{"action":"add_component","component_type":"bar_chart","name":"电力统计","position":{"x":400,"y":600},"size":{"width":400,"height":300},"props":{}}\n\`\`\``;
    }
    if (msg.includes('进度')) {
      return `已新增「目标完成进度条」组件。\n\n\`\`\`json\n{"action":"add_component","component_type":"progress_bar","name":"目标进度","position":{"x":340,"y":680},"size":{"width":600,"height":40},"props":{}}\n\`\`\``;
    }
    return `已按你的要求在大屏中新增组件，布局已自动调整适配。\n\n\`\`\`json\n{"action":"add_component","component_type":"bar_chart","name":"新增图表","position":{"x":400,"y":600},"size":{"width":400,"height":300},"props":{}}\n\`\`\``;
  }
  // 删除
  if (msg.includes('删除') || msg.includes('去掉') || msg.includes('移除')) {
    return `已按你的要求移除对应组件，周边组件布局已自动适配调整。`;
  }
  // 尺寸调整
  if (msg.includes('调整') && (msg.includes('大小') || msg.includes('尺寸'))) {
    return `已按你的要求调整组件尺寸，整体布局已自动重新适配。\n\n\`\`\`json\n{"action":"update_component","component_name":"KPI卡片","updates":{"size":{"width":280,"height":160}}}\n\`\`\``;
  }
  // 布局优化
  if (msg.includes('布局') && msg.includes('优化')) {
    return `已完成大屏布局优化：\n1. 组件间距统一调整，消除视觉拥挤\n2. 模块对齐优化，保证整体规整\n3. 层次关系梳理，主次分明\n\n当前大屏布局已优化完成，你可以继续提出修改需求。`;
  }
  // 兜底
  return `已根据你的需求完成大屏调整优化。你可以继续提出修改需求，或确认完成最终大屏。`;
}

// ============================================================
// 会话状态判断
// ============================================================

function isCreateIntent(msg: string): boolean {
  return /生成|创建|做一个|帮我做|搭建|建一个|做一个|帮我生成|帮我创建/.test(msg);
}

function isSelectIntent(msg: string): boolean {
  return /第一个|第二个|第三个|第1|第2|第3|选第|就这个|应用|确认/.test(msg) && !isCreateIntent(msg);
}

function isModifyIntent(msg: string): boolean {
  return /改|换成|替换|调整|修改|新增|添加|增加|删除|去掉|移除|换一个|颜色|色调|配色|风格|标题|布局|大小|尺寸|优化|高亮|看板/.test(msg);
}

// ============================================================
// 从历史消息中提取模板推荐
// ============================================================

function findRecommendedTemplate(index: number, allMessages: { role: string; content: string }[]): string | null {
  for (let i = allMessages.length - 1; i >= 0; i--) {
    const c = allMessages[i].content;
    const m = c.match(/"recommendations"\s*:\s*\[([\s\S]*?)\]/);
    if (m) {
      const ids = m[1].match(/"template_id"\s*:\s*"([^"]+)"/g);
      if (ids && ids.length > index) {
        const id = ids[index].match(/"([^"]+)"/)?.[1];
        if (id) return id;
      }
    }
  }
  return null;
}

function detectTemplateSelection(msg: string, allMessages: { role: string; content: string }[]): string | null {
  if (msg.includes('第一个') || msg.includes('第1个')) return findRecommendedTemplate(0, allMessages);
  if (msg.includes('第二个') || msg.includes('第2个')) return findRecommendedTemplate(1, allMessages);
  if (msg.includes('第三个') || msg.includes('第3个')) return findRecommendedTemplate(2, allMessages);
  for (const [id, tpl] of Object.entries(ALL_TEMPLATES)) {
    if (msg.includes(tpl.name)) return id;
  }
  if ((msg.includes('应用') || msg.includes('就这个') || msg.includes('确认') || msg.includes('生成')) && !isCreateIntent(msg)) {
    return findRecommendedTemplate(0, allMessages);
  }
  return null;
}

// ============================================================
// 主路由调度
// ============================================================

function generateResponse(
  userMessage: string,
  allMessages: { role: string; content: string }[],
  hasCanvasComponents: boolean,
  selectedContext: string | null,
): string {
  const msg = userMessage.trim();

  // 阶段A：创建大屏 → Step 1+2
  if (isCreateIntent(msg)) {
    return buildCreateResponse(msg);
  }

  // 阶段B：选择模板 → Step 3+4
  if (isSelectIntent(msg)) {
    const templateId = detectTemplateSelection(msg, allMessages);
    if (templateId) {
      return buildApplyResponse(templateId);
    }
    return buildCreateResponse(msg);
  }

  // 阶段C：画布有组件 + 修改指令 → Step 4
  if (hasCanvasComponents && isModifyIntent(msg)) {
    return buildModifyResponse(msg, selectedContext);
  }

  // 阶段D：无组件 + 非创建意图 → 引导
  if (!hasCanvasComponents && !isCreateIntent(msg) && !isSelectIntent(msg)) {
    return `你好！我是**可视化大屏AI创作智能体**（对话式BI Agent），专注实现「自然语言对话式大屏零代码创作」。

我会按以下4步为你服务：
**① 意图解析** → 识别行业场景、风格偏好、布局需求、组件需求
**② 模板推荐** → 匹配3套最优内置模板供你选择
**③ 语义渲染** → 基于模板+你的语义需求，生成可交互初版大屏
**④ 二次编辑** → 支持组件/布局/配色/图表等所有精细化调整

💬 **试试完整工作流：**
「帮我做一个电力运维大数据监控大屏，整体用深色科技风电，采用标准左右两侧看板布局，需要包含电力负荷数据卡片、负荷趋势折线图、各站点供电量柱状图、故障预警列表组件，用于电力日常运维监控」

💬 其他行业：
「帮我生成一个销售业绩驾驶舱」
「创建一个智慧物流调度数据大屏」
「帮我做一个城市政务大数据监控大屏」`;
  }

  return `收到你的需求！请告诉我更具体的大屏创作需求，我来为你解析意图并推荐最合适的模板。`;
}

// ============================================================
// SSE 流式输出
// ============================================================

async function* streamText(text: string, chunkSize: number = 3): AsyncGenerator<string> {
  const chars = [...text];
  for (let i = 0; i < chars.length; i += chunkSize) {
    yield chars.slice(i, i + chunkSize).join('');
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 20));
  }
}

// ============================================================
// API 入口
// ============================================================

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  let messages: { role: string; content: string }[] = [];
  let canvasComponents: unknown[] = [];
  let selectedContext: string | null = null;

  try {
    const body = await request.json();
    messages = body.messages || [];
    canvasComponents = body.canvasComponents || [];
    selectedContext = body.selectedContext || null;
  } catch {
    // Invalid body
  }

  if (!messages || messages.length === 0) {
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: '请发送消息' }) + '\n\n'));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    });
  }

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userMessage = lastUserMsg?.content || '';
  const hasComponents = canvasComponents && canvasComponents.length > 0;

  const responseText = generateResponse(userMessage, messages, hasComponents, selectedContext);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamText(responseText)) {
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: chunk }) + '\n\n'));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ error: errMsg }) + '\n\n'));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
