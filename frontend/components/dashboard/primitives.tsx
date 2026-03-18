'use client';

import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardPanelProps {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardPanel({ title, description, rightSlot, children, className }: DashboardPanelProps) {
  return (
    <Card className={cn('border-[#d8e0da] bg-white', className)}>
      {(title || description || rightSlot) && (
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              {title && <CardTitle className="text-[#11291f]">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            {rightSlot}
          </div>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface DashboardKpiCardProps {
  label: string;
  value: string;
  helper?: string;
  highlight?: boolean;
  className?: string;
}

export function DashboardKpiCard({ label, value, helper, highlight, className }: DashboardKpiCardProps) {
  return (
    <Card
      className={cn(
        highlight
          ? 'border-[#113722] bg-gradient-to-br from-[#0f4a2a] to-[#1f6a3f] text-white'
          : 'border-[#d8e0da] bg-white',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardDescription className={cn(highlight ? 'text-emerald-100' : '')}>{label}</CardDescription>
        <CardTitle className={cn('text-3xl', highlight ? 'text-white' : 'text-[#11291f]')}>{value}</CardTitle>
      </CardHeader>
      {helper && (
        <CardContent>
          <p className={cn('text-xs', highlight ? 'text-emerald-100' : 'text-[#4f675b]')}>{helper}</p>
        </CardContent>
      )}
    </Card>
  );
}
