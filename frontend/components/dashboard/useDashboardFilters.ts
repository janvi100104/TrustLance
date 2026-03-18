'use client';

import { useMemo, useState } from 'react';
import type {
  DashboardEscrowFilterState,
  DashboardTransactionFilterState,
  EscrowTypeFilter,
  UnifiedTransactionRow
} from '@/types/dashboard';
import type { EscrowData } from '@/store/useEscrowStore';

export const defaultTransactionFilters: DashboardTransactionFilterState = {
  search: '',
  status: 'all',
  type: 'all',
  dateRange: 'all',
  sortBy: 'date',
  sortOrder: 'desc'
};

export const defaultEscrowFilters: DashboardEscrowFilterState = {
  search: '',
  status: 'all',
  type: 'all',
  sortBy: 'date',
  sortOrder: 'desc'
};

export function useTransactionFilters(initial?: Partial<DashboardTransactionFilterState>) {
  const [filters, setFilters] = useState<DashboardTransactionFilterState>({
    ...defaultTransactionFilters,
    ...initial
  });

  return {
    filters,
    setFilters,
    updateFilter: <K extends keyof DashboardTransactionFilterState>(key: K, value: DashboardTransactionFilterState[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    resetFilters: () => setFilters({ ...defaultTransactionFilters, ...initial })
  };
}

export function useEscrowFilters(initial?: Partial<DashboardEscrowFilterState>) {
  const [filters, setFilters] = useState<DashboardEscrowFilterState>({
    ...defaultEscrowFilters,
    ...initial
  });

  return {
    filters,
    setFilters,
    updateFilter: <K extends keyof DashboardEscrowFilterState>(key: K, value: DashboardEscrowFilterState[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    resetFilters: () => setFilters({ ...defaultEscrowFilters, ...initial })
  };
}

export function filterAndSortTransactions(
  rows: UnifiedTransactionRow[],
  filters: DashboardTransactionFilterState
): UnifiedTransactionRow[] {
  const now = Date.now();

  const filtered = rows.filter((row) => {
    if (filters.status !== 'all' && row.status !== filters.status) {
      return false;
    }

    if (filters.type !== 'all' && row.source !== filters.type) {
      return false;
    }

    if (filters.dateRange !== 'all') {
      const dayMs = 24 * 60 * 60 * 1000;
      const maxAge =
        filters.dateRange === '7d' ? 7 * dayMs : filters.dateRange === '30d' ? 30 * dayMs : 90 * dayMs;
      if (now - new Date(row.timestamp).getTime() > maxAge) {
        return false;
      }
    }

    const search = filters.search.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return [row.title, row.counterparty || '', row.referenceId || '', row.transactionHash || '']
      .join(' ')
      .toLowerCase()
      .includes(search);
  });

  return [...filtered].sort((a, b) => {
    const direction = filters.sortOrder === 'asc' ? 1 : -1;

    switch (filters.sortBy) {
      case 'amount':
        return (a.amount - b.amount) * direction;
      case 'status':
        return a.status.localeCompare(b.status) * direction;
      case 'type':
        return a.source.localeCompare(b.source) * direction;
      case 'date':
      default:
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * direction;
    }
  });
}

export function filterAndSortEscrows(
  escrows: EscrowData[],
  filters: DashboardEscrowFilterState,
  currentAddress?: string | null
): EscrowData[] {
  const filtered = escrows.filter((escrow) => {
    if (filters.status !== 'all' && escrow.status !== filters.status) {
      return false;
    }

    if (filters.type !== 'all') {
      const roleMatch =
        filters.type === 'as-client'
          ? escrow.client === currentAddress
          : filters.type === 'as-freelancer'
            ? escrow.freelancer === currentAddress
            : true;
      if (!roleMatch) {
        return false;
      }
    }

    const search = filters.search.trim().toLowerCase();
    if (!search) {
      return true;
    }

    return [escrow.title, escrow.id, escrow.client, escrow.freelancer].join(' ').toLowerCase().includes(search);
  });

  return [...filtered].sort((a, b) => {
    const direction = filters.sortOrder === 'asc' ? 1 : -1;
    switch (filters.sortBy) {
      case 'amount':
        return (a.amount - b.amount) * direction;
      case 'status':
        return a.status.localeCompare(b.status) * direction;
      case 'title':
        return a.title.localeCompare(b.title) * direction;
      case 'date':
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    }
  });
}

export function escrowTypeLabel(type: EscrowTypeFilter) {
  if (type === 'as-client') return 'Client';
  if (type === 'as-freelancer') return 'Freelancer';
  return 'All Roles';
}

export function useEscrowKpis(escrows: EscrowData[]) {
  return useMemo(() => {
    const active = escrows.filter((e) => e.status === 'created' || e.status === 'funded').length;
    const completed = escrows.filter((e) => e.status === 'released' || e.status === 'refunded').length;
    const disputed = escrows.filter((e) => e.status === 'disputed').length;
    const volume = escrows.reduce((sum, escrow) => sum + escrow.amount, 0);

    return {
      total: escrows.length,
      active,
      completed,
      disputed,
      volume
    };
  }, [escrows]);
}
