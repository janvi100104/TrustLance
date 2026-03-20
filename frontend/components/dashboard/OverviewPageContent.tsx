'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDashboardData } from './useDashboardData';
import { cn } from '@/lib/utils';
import { getStatusColor } from './dashboard-utils';

export function OverviewPageContent() {
  const { userEscrows, stats, pipelineStats, performanceSegments, donut, monthlyPaymentSeries } = useDashboardData();
  const [selectedEscrow, setSelectedEscrow] = useState<{
    id: string;
    title: string;
    client: string;
    freelancer: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null>(null);
  const recentTransactions = userEscrows.slice(0, 7);
  const maxRevenueBar = useMemo(
    () => monthlyPaymentSeries.reduce((max, item) => Math.max(max, item.received, item.sent), 0),
    [monthlyPaymentSeries]
  );
  const hasRevenueData = maxRevenueBar > 0;
  const lifecycleTotal = userEscrows.length;
  const lifecycleRows = [
    {
      label: 'Created / Disputed',
      count: pipelineStats.created + pipelineStats.disputed,
      color: 'bg-[#93c95f]'
    },
    {
      label: 'Funded',
      count: pipelineStats.funded,
      color: 'bg-[#7eb14e]'
    },
    {
      label: 'Completed',
      count: pipelineStats.released + pipelineStats.refunded,
      color: 'bg-[#4f8f33]'
    }
  ];
  const formatWeeklyChange = (value: number) => (value >= 0 ? `+${value}%` : `${value}%`);

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[#113722] bg-gradient-to-br from-[#0f4a2a] to-[#1f6a3f] text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-100">Escrows Created (7d)</CardDescription>
                <CardTitle className="text-xl">{stats.weeklyEscrowCurrent}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-100">
                  {stats.weeklyEscrowChangePct === null
                    ? `Previous 7d: ${stats.weeklyEscrowPrevious}`
                    : `${formatWeeklyChange(stats.weeklyEscrowChangePct)} vs previous 7d (${stats.weeklyEscrowPrevious})`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#d8e0da] bg-white">
              <CardHeader className="pb-2">
                <CardDescription>Wallet Balance</CardDescription>
                <CardTitle className="text-4xl text-[#11291f]">{stats.totalValue.toFixed(2)} XLM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-700">{stats.completionRate}% escrow completion rate</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8e0da] bg-white">
              <CardHeader className="pb-2">
                <CardDescription>Net Payment Flow</CardDescription>
                <CardTitle className="text-4xl text-[#11291f]">{stats.netFlow.toFixed(2)} XLM</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#6d8478]">
                  Received {stats.receivedVolume.toFixed(2)} / Sent {stats.sentVolume.toFixed(2)} XLM
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-[#d8e0da] bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-[#10281d]">Transaction</CardTitle>
                    <CardDescription>Latest recorded escrow actions</CardDescription>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/dashboard/escrow-contracts">
                      View all <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((escrow) => (
                    <button
                      key={escrow.id}
                      onClick={() =>
                        setSelectedEscrow({
                          id: escrow.id,
                          title: escrow.title,
                          client: escrow.client,
                          freelancer: escrow.freelancer,
                          amount: escrow.amount,
                          status: escrow.status,
                          createdAt:
                            escrow.createdAt instanceof Date
                              ? escrow.createdAt.toISOString().split('T')[0]
                              : new Date(escrow.createdAt).toISOString().split('T')[0]
                        })
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-[#e1e8e3] bg-[#f7faf7] px-3 py-2 text-left transition hover:bg-[#eef5ef]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#183124]">{escrow.title}</p>
                        <p className="text-xs text-[#4f675b]">{new Date(escrow.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#153023]">{escrow.amount} XLM</p>
                        <Badge className={cn('mt-1 text-[10px]', getStatusColor(escrow.status))}>{escrow.status}</Badge>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-[#c9d5cc] p-6 text-center">
                    <Inbox className="mx-auto mb-3 h-9 w-9 text-[#739180]" />
                    <p className="text-sm text-[#355547]">No escrows yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-[#d8e0da] bg-white">
              <CardHeader>
                <CardTitle className="text-[#10281d]">Payment Flow (6M)</CardTitle>
                <CardDescription>Received vs sent XLM across the last six months</CardDescription>
              </CardHeader>
              <CardContent>
                {hasRevenueData ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[#4f675b]">
                      Received {monthlyPaymentSeries.reduce((sum, row) => sum + row.received, 0).toFixed(2)} XLM
                      {' · '}
                      Sent {monthlyPaymentSeries.reduce((sum, row) => sum + row.sent, 0).toFixed(2)} XLM
                    </p>
                    <div className="flex h-40 items-end gap-2">
                      {monthlyPaymentSeries.map((month) => (
                        <div key={month.key} className="flex flex-1 flex-col items-center gap-1">
                          <div className="flex h-32 w-full items-end gap-1">
                            <div
                              className="w-1/2 rounded-t-md bg-[#1f6a3f]"
                              style={{ height: `${(month.received / maxRevenueBar) * 100}%` }}
                              title={`${month.label} received: ${month.received.toFixed(2)} XLM`}
                            />
                            <div
                              className="w-1/2 rounded-t-md bg-[#b5d651]"
                              style={{ height: `${(month.sent / maxRevenueBar) * 100}%` }}
                              title={`${month.label} sent: ${month.sent.toFixed(2)} XLM`}
                            />
                          </div>
                          <p className="text-[10px] uppercase tracking-wide text-[#6f8779]">{month.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[#c9d5cc] p-6 text-center">
                    <p className="text-sm text-[#355547]">No successful payment transfers yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#d8e0da] bg-white">
            <CardHeader>
              <CardTitle className="text-[#10281d]">Escrow Lifecycle Distribution</CardTitle>
              <CardDescription>Current contract distribution by lifecycle status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lifecycleRows.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-[#4f675b]">{row.label}</span>
                    <span className="font-medium text-[#183124]">{row.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#e7efe9]">
                    <div
                      className={`h-2 rounded-full ${row.color}`}
                      style={{ width: `${lifecycleTotal > 0 ? (row.count / lifecycleTotal) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-[#d8e0da] bg-white">
            <CardHeader>
              <CardTitle className="text-[#10281d]">Total View Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full" style={{ background: donut }}>
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
                  <p className="text-xs text-[#5e7868]">Total Count</p>
                  <p className="text-2xl font-bold text-[#122d21]">{userEscrows.length}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {performanceSegments.map((segment) => (
                  <div key={segment.label} className="rounded-md border border-[#dbe4dd] p-2 text-center">
                    <p className="font-semibold" style={{ color: segment.color }}>{segment.value.toFixed(1)}%</p>
                    <p className="text-[#58705f]">{segment.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d8e0da] bg-white">
            <CardHeader>
              <CardTitle className="text-[#10281d]">Performance Snapshot</CardTitle>
              <CardDescription>Direct metrics from your current dashboard records.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-[#4d6559]">
              <div className="rounded-md bg-[#f4f8f5] p-2">Contracts: {userEscrows.length}</div>
              <div className="rounded-md bg-[#f4f8f5] p-2">Completion Rate: {stats.completionRate}%</div>
              <div className="rounded-md bg-[#f4f8f5] p-2">Avg Escrow Amount: {stats.avgEscrowAmount.toFixed(2)} XLM</div>
              <div className="rounded-md bg-[#f4f8f5] p-2">Escrow Volume: {stats.totalEscrowVolume.toFixed(2)} XLM</div>
            </CardContent>
          </Card>

          <Card className="border-[#98b19f] bg-gradient-to-br from-[#d3e9cf] via-[#e6f4de] to-[#c3e3b8]">
            <CardHeader className="pb-2">
              <CardTitle className="text-[#1d3d2d]">Level up your sales next level.</CardTitle>
              <CardDescription className="text-[#2d5a43]">Manage all escrow deals with care and precision.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-[#1f6a3f] hover:bg-[#185736]">
                <Link href="/dashboard/escrow">
                  <Plus className="mr-2 h-4 w-4" /> Create new escrow
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedEscrow} onOpenChange={() => setSelectedEscrow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEscrow?.title}</DialogTitle>
            <DialogDescription>Escrow ID: {selectedEscrow?.id}</DialogDescription>
          </DialogHeader>
          {selectedEscrow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-mono text-sm">{selectedEscrow.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Freelancer</p>
                  <p className="font-mono text-sm">{selectedEscrow.freelancer}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold">{selectedEscrow.amount} XLM</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusColor(selectedEscrow.status)}>{selectedEscrow.status}</Badge>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">{selectedEscrow.createdAt}</p>
              </div>
              <Button onClick={() => setSelectedEscrow(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
