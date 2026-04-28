'use client';

import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  change,
  icon,
  description,
  className = '',
}: MetricCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          </div>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
        {icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {change && (
        <div className="flex items-center gap-1 mt-4">
          {change.type === 'increase' ? (
            <>
              <ArrowUp className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">
                {change.value}% increase
              </span>
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4 text-green-600 dark:text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-500">
                {change.value}% decrease
              </span>
            </>
          )}
          <span className="text-xs text-muted-foreground ml-1">vs {change.period}</span>
        </div>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  footer,
  className = '',
}: ChartCardProps) {
  return (
    <div className={`rounded-lg border border-border bg-card p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="w-full">{children}</div>
      {footer && <div className="mt-6 pt-4 border-t border-border">{footer}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  status?: 'healthy' | 'warning' | 'critical';
  subtext?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  status = 'healthy',
  subtext,
  className = '',
}: StatCardProps) {
  const statusColors = {
    healthy: 'border-l-green-500 bg-green-50 dark:bg-green-950/20',
    warning: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    critical: 'border-l-destructive bg-destructive/10 dark:bg-destructive/20',
  };

  return (
    <div className={`rounded-lg border border-border border-l-4 bg-card p-4 ${statusColors[status]} ${className}`}>
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-2">{subtext}</p>}
    </div>
  );
}
