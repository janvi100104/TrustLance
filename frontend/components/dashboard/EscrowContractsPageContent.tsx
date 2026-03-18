'use client';

import Link from 'next/link';
import { Inbox, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo } from 'react';
import { useWallet } from '@/store/useWallet';
import { EscrowCard } from '@/components/escrow/EscrowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardKpiCard, DashboardPanel } from '@/components/dashboard/primitives';
import { useDashboardData } from './useDashboardData';
import {
  escrowTypeLabel,
  filterAndSortEscrows,
  useEscrowFilters,
  useEscrowKpis
} from './useDashboardFilters';

export function EscrowContractsPageContent() {
  const { userEscrows } = useDashboardData();
  const { publicKey } = useWallet();
  const { filters, updateFilter, resetFilters } = useEscrowFilters();
  const kpis = useEscrowKpis(userEscrows);

  const filteredEscrows = useMemo(
    () => filterAndSortEscrows(userEscrows, filters, publicKey),
    [filters, publicKey, userEscrows]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <DashboardKpiCard label="Total Contracts" value={kpis.total.toString()} />
        <DashboardKpiCard label="Active" value={kpis.active.toString()} />
        <DashboardKpiCard label="Completed" value={kpis.completed.toString()} />
        <DashboardKpiCard label="Disputed" value={kpis.disputed.toString()} />
        <DashboardKpiCard label="Volume" value={`${kpis.volume.toFixed(2)} XLM`} />
      </div>

      <DashboardPanel
        title="Escrow Contracts"
        description="Filter and manage your escrow contracts across statuses and roles."
      >
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#6f8b7c]" />
              <Input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search title, escrow id, or address"
                className="pl-8"
              />
            </div>

            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value as typeof filters.status)}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="created">Created</option>
              <option value="funded">Funded</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
              <option value="disputed">Disputed</option>
            </select>

            <select
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value as typeof filters.type)}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="as-client">As Client</option>
              <option value="as-freelancer">As Freelancer</option>
            </select>

            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':');
                updateFilter('sortBy', sortBy as typeof filters.sortBy);
                updateFilter('sortOrder', sortOrder as typeof filters.sortOrder);
              }}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="date:desc">Newest First</option>
              <option value="date:asc">Oldest First</option>
              <option value="amount:desc">Amount High-Low</option>
              <option value="amount:asc">Amount Low-High</option>
              <option value="title:asc">Title A-Z</option>
            </select>

            <Button variant="outline" onClick={resetFilters} className="h-9">
              <SlidersHorizontal className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[#d8e0da] bg-[#f8fbf8] px-2 py-1 text-[#4d6559]">
              Role: {escrowTypeLabel(filters.type)}
            </span>
            <span className="rounded-full border border-[#d8e0da] bg-[#f8fbf8] px-2 py-1 text-[#4d6559]">
              Status: {filters.status === 'all' ? 'All' : filters.status}
            </span>
            <span className="rounded-full border border-[#d8e0da] bg-[#f8fbf8] px-2 py-1 text-[#4d6559]">
              Showing: {filteredEscrows.length}
            </span>
          </div>
        </div>
      </DashboardPanel>

      {filteredEscrows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredEscrows.map((escrow) => (
            <EscrowCard
              key={escrow.id}
              escrow={{
                id: escrow.id,
                title: escrow.title,
                client: escrow.client,
                freelancer: escrow.freelancer,
                amount: escrow.amount,
                currency: escrow.currency,
                status: escrow.status as 'created' | 'funded' | 'released' | 'refunded',
                contractAddress: escrow.contractAddress || '',
                createdAt: escrow.createdAt
              }}
            />
          ))}
        </div>
      ) : (
        <DashboardPanel title="No Contracts Found" description="Adjust filters or create a new escrow to get started.">
          <div className="py-8 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-[#668677]" />
            <h3 className="text-lg font-semibold text-[#183124]">No escrows match current filters</h3>
            <p className="mb-4 text-[#4e6b5d]">Try reset filters or create your first secure escrow contract.</p>
            <Button asChild className="bg-[#1f6a3f] hover:bg-[#185736]">
              <Link href="/dashboard/escrow">
                <Plus className="mr-2 h-4 w-4" /> Create Escrow
              </Link>
            </Button>
          </div>
        </DashboardPanel>
      )}
    </div>
  );
}
