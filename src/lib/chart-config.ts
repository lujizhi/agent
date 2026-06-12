import type { EChartsOption } from 'echarts';
import type { CanvasComponent } from '@/types/editor';

// Mock data for charts
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const REGIONS = ['华东', '华南', '华北', '华中', '西南', '西北'];
const CITY_NAMES = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安'];

/**
 * Simple seeded pseudo-random based on string hash.
 * Same component ID always produces the same sequence of "random" values,
 * so charts stay stable across re-renders.
 */
function createSeededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h) + seed.charCodeAt(i);
    h |= 0;
  }
  return function (min: number, max: number) {
    h = (h * 1103515245 + 12345) | 0;
    return Math.round(min + ((h >>> 0) / 4294967296) * (max - min));
  };
}

export function getChartOption(component: CanvasComponent): EChartsOption | null {
  const rng = createSeededRandom(component.id + component.type + component.name);
  const darkTheme = {
    textStyle: { color: '#94a3b8' },
    title: { textStyle: { color: '#f1f5f9' } },
  };

  switch (component.type) {
    case 'bar_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
        series: [{ type: 'bar', data: MONTHS.map(() => rng(200, 1200)), itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#06b6d4' }, { offset: 1, color: '#0891b2' }] }, borderRadius: [4, 4, 0, 0] } }],
      };

    case 'line_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
        series: [
          { type: 'line', data: MONTHS.map(() => rng(100, 800)), smooth: true, lineStyle: { color: '#06b6d4', width: 2 }, itemStyle: { color: '#06b6d4' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.3)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } } },
          { type: 'line', data: MONTHS.map(() => rng(80, 600)), smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' } },
        ],
      };

    case 'pie_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: '65%',
          data: REGIONS.map((r) => ({ name: r, value: rng(100, 600) })),
          label: { color: '#94a3b8' },
          itemStyle: { borderColor: '#111827', borderWidth: 2 },
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(6,182,212,0.5)' } },
        }],
        color: ['#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#f97316'],
      };

    case 'ring_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie', radius: ['40%', '70%'],
          data: REGIONS.map((r) => ({ name: r, value: rng(100, 600) })),
          label: { color: '#94a3b8' },
          itemStyle: { borderColor: '#111827', borderWidth: 2 },
        }],
        color: ['#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#f97316'],
      };

    case 'area_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'axis' },
        grid: { left: 50, right: 20, top: 40, bottom: 40 },
        xAxis: { type: 'category', data: MONTHS, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8' }, boundaryGap: false },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
        series: [
          { type: 'line', data: MONTHS.map(() => rng(200, 1000)), smooth: true, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(6,182,212,0.4)' }, { offset: 1, color: 'rgba(6,182,212,0)' }] } }, lineStyle: { color: '#06b6d4' }, itemStyle: { color: '#06b6d4' } },
        ],
      };

    case 'scatter_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'item' },
        grid: { left: 50, right: 20, top: 40, bottom: 40 },
        xAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#334155' } }, splitLine: { lineStyle: { color: '#1e293b' } }, axisLabel: { color: '#94a3b8' } },
        series: [{ type: 'scatter', data: Array.from({ length: 30 }, () => [rng(10, 100), rng(10, 100)]), itemStyle: { color: '#06b6d4' } }],
      };

    case 'radar_chart':
      return {
        ...darkTheme,
        radar: {
          indicator: [
            { name: '销售额', max: 100 },
            { name: '利润率', max: 100 },
            { name: '客户满意度', max: 100 },
            { name: '市场占有率', max: 100 },
            { name: '增长率', max: 100 },
            { name: '回款率', max: 100 },
          ],
          axisName: { color: '#94a3b8' },
          splitArea: { areaStyle: { color: ['rgba(6,182,212,0.02)', 'rgba(6,182,212,0.05)'] } },
          splitLine: { lineStyle: { color: '#1e293b' } },
          axisLine: { lineStyle: { color: '#334155' } },
        },
        series: [{
          type: 'radar',
          data: [{ value: [rng(60, 95), rng(50, 90), rng(70, 95), rng(40, 80), rng(50, 85), rng(60, 90)], name: '当前', areaStyle: { color: 'rgba(6,182,212,0.2)' }, lineStyle: { color: '#06b6d4' }, itemStyle: { color: '#06b6d4' } }],
        }],
      };

    case 'funnel_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'item' },
        series: [{
          type: 'funnel', left: '10%', width: '80%',
          data: [
            { value: 100, name: '访问' },
            { value: 80, name: '咨询' },
            { value: 60, name: '意向' },
            { value: 40, name: '下单' },
            { value: 20, name: '成交' },
          ],
          label: { color: '#94a3b8' },
        }],
        color: ['#06b6d4', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899'],
      };

    case 'gauge_chart':
      return {
        ...darkTheme,
        series: [{
          type: 'gauge', radius: '90%',
          axisLine: { lineStyle: { width: 15, color: [[0.3, '#f59e0b'], [0.7, '#06b6d4'], [1, '#10b981']] } },
          pointer: { itemStyle: { color: '#f1f5f9' } },
          axisTick: { lineStyle: { color: '#334155' } },
          splitLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#94a3b8' },
          detail: { formatter: '{value}%', color: '#f1f5f9', fontSize: 20 },
          data: [{ value: rng(40, 95) }],
        }],
      };

    case 'map_chart':
      return {
        ...darkTheme,
        tooltip: { trigger: 'item' },
        visualMap: { min: 0, max: 1000, left: 10, bottom: 10, text: ['高', '低'], textStyle: { color: '#94a3b8' }, inRange: { color: ['#0c4a6e', '#06b6d4'] } },
        series: [{
          type: 'map', map: 'china',
          data: CITY_NAMES.map((n) => ({ name: n, value: rng(200, 1000) })),
          label: { color: '#94a3b8' },
          itemStyle: { areaColor: '#1e293b', borderColor: '#334155' },
          emphasis: { itemStyle: { areaColor: '#164e63' } },
        }],
      };

    default:
      return null;
  }
}

export function generateMockData(componentType: string, seed?: string): Record<string, unknown> {
  const rng = seed ? createSeededRandom(seed + componentType) : createSeededRandom(componentType);
  switch (componentType) {
    case 'kpi_card':
      return { value: rng(1000, 99999), label: '总销售额', unit: '万元', trend: rng(-15, 25), trendLabel: '同比' };
    case 'number_flip':
      return { value: rng(10000, 999999), label: '累计订单' };
    case 'ranking_list':
      return { items: REGIONS.map((r, i) => ({ name: r, value: 1000 - i * rng(50, 150) })) };
    case 'progress_bar':
      return { value: rng(30, 95), label: '目标完成率' };
    case 'table_view':
      return {
        columns: ['地区', '销售额(万)', '利润率', '订单数'],
        rows: REGIONS.map((r) => [r, rng(100, 999), `${rng(5, 35)}%`, rng(500, 5000)]),
      };
    default:
      return {};
  }
}
