'use client';

import React from 'react';
import {
  BarChart3, TrendingUp, PieChart, CircleDot, AreaChart,
  ScatterChart, Hexagon, Filter, Gauge, Droplets, Map, Type,
  Hash, CreditCard, ListOrdered, Loader, Table, Square, Sparkles,
  Database, Layout, Layers, FolderTree, Package,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3, TrendingUp, PieChart, CircleDot, AreaChart,
  ScatterChart, Hexagon, Filter, Gauge, Droplets, Map, Type,
  Hash, CreditCard, ListOrdered, Loader, Table, Square, Sparkles,
  Database, Layout, Layers, FolderTree, Package,
};

export function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = ICON_MAP[name] || Square;
  return <IconComponent className={className} />;
}
