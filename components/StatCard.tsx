
import React from 'react';
import { KPI } from '../types';
import { Card } from './Card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const StatCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'teal': return 'text-teal-600';
      case 'orange': return 'text-orange-500';
      case 'red': return 'text-red-500';
      default: return 'text-slate-600';
    }
  };

  const getBgClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-600';
      case 'teal': return 'bg-teal-50 text-teal-600';
      case 'orange': return 'bg-orange-50 text-orange-600';
      case 'red': return 'bg-red-50 text-red-600';
      default: return 'bg-slate-50 text-slate-600';
    }
  };

  // Mock Sparkline Data based on color (just for visual effect)
  const getSparkline = (color: string) => {
    if (color === 'red') return (
      <svg className="w-16 h-8 text-red-400 opacity-50" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M0 30 L20 25 L40 35 L60 10 L80 20 L100 5" />
      </svg>
    );
    return (
      <svg className="w-16 h-8 text-teal-400 opacity-50" viewBox="0 0 100 40" fill="none" stroke="currentColor" strokeWidth="3">
        <path d="M0 35 L20 30 L40 32 L60 15 L80 20 L100 5" />
      </svg>
    );
  };

  return (
    <Card className="p-5 flex flex-col justify-between h-full group">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${getBgClass(kpi.color)}`}>
          {/* Icon placeholder or actual icon if passed */}
          <div className="w-5 h-5 flex items-center justify-center font-bold">
            {kpi.label.charAt(0)}
          </div>
        </div>
        {getSparkline(kpi.color)}
      </div>

      <div>
        <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{kpi.value}</h3>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{kpi.label}</p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-400">{kpi.subtext}</span>
        <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          <ArrowUpRight size={12} className="mr-1" /> 12%
        </span>
      </div>
    </Card>
  );
};
