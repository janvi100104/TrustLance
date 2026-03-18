'use client';

import { useState } from 'react';
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
  const { userEscrows, stats, performanceSegments, donut } = useDashboardData();
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
  const totalReturn = (stats.totalValue * 0.18 + stats.completed * 3.5).toFixed(2);
  const revenueBars = [58, 82, 45, 76, 64, 88];

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-[#113722] bg-gradient-to-br from-[#0f4a2a] to-[#1f6a3f] text-white">
              <CardHeader className="pb-2">
                <CardDescription className="text-emerald-100">Update</CardDescription>
                <CardTitle className="text-xl">{stats.weeklyChange}%</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-100">Revenue increased this week</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8e0da] bg-white">
              <CardHeader className="pb-2">
                <CardDescription>Net Income</CardDescription>
                <CardTitle className="text-4xl text-[#11291f]">{stats.totalValue.toFixed(2)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-emerald-700">+{Math.max(6, stats.completionRate)}% from last month</p>
              </CardContent>
            </Card>

            <Card className="border-[#d8e0da] bg-white">
              <CardHeader className="pb-2">
                <CardDescription>Total Return</CardDescription>
                <CardTitle className="text-4xl text-[#11291f]">{totalReturn}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[#6d8478]">{stats.pending} pending payment(s)</p>
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
                <CardTitle className="text-[#10281d]">Revenue</CardTitle>
                <CardDescription>Income vs expense trend</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-3xl font-bold text-[#11291f]">{stats.totalValue.toFixed(2)} XLM</p>
                <div className="flex h-36 items-end gap-3">
                  {revenueBars.map((value, index) => (
                    <div key={`${value}-${index}`} className="flex flex-1 items-end gap-1">
                      <div className="w-1/2 rounded-t-md bg-[#1f6a3f]" style={{ height: `${value}%` }} />
                      <div className="w-1/2 rounded-t-md bg-[#b5d651]" style={{ height: `${Math.max(26, value - 20)}%` }} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#d8e0da] bg-white">
            <CardHeader>
              <CardTitle className="text-[#10281d]">Sales Report</CardTitle>
              <CardDescription>Progress from created to released contracts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[#4f675b]">Product launched</span>
                  <span className="font-medium text-[#183124]">{stats.active + stats.completed}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e7efe9]">
                  <div className="h-2 rounded-full bg-[#93c95f]" style={{ width: `${Math.max(18, stats.active * 14)}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[#4f675b]">Ongoing product</span>
                  <span className="font-medium text-[#183124]">{stats.pending}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e7efe9]">
                  <div className="h-2 rounded-full bg-[#7eb14e]" style={{ width: `${Math.max(12, stats.pending * 18)}%` }} />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-[#4f675b]">Product sold</span>
                  <span className="font-medium text-[#183124]">{stats.completed}</span>
                </div>
                <div className="h-2 rounded-full bg-[#e7efe9]">
                  <div className="h-2 rounded-full bg-[#4f8f33]" style={{ width: `${Math.max(10, stats.completed * 18)}%` }} />
                </div>
              </div>
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
                  <p className="text-2xl font-bold text-[#122d21]">{Math.max(1, userEscrows.length)}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                {performanceSegments.map((segment) => (
                  <div key={segment.label} className="rounded-md border border-[#dbe4dd] p-2 text-center">
                    <p className="font-semibold" style={{ color: segment.color }}>{segment.value}%</p>
                    <p className="text-[#58705f]">{segment.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#d8e0da] bg-white">
            <CardHeader>
              <CardTitle className="text-[#10281d]">Guide Views</CardTitle>
              <CardDescription>Improve your score with complete escrow lifecycles.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-[#4d6559]">
              <div className="rounded-md bg-[#f4f8f5] p-2">View Count: {Math.max(1, userEscrows.length) * 12}</div>
              <div className="rounded-md bg-[#f4f8f5] p-2">Percentage: {stats.completionRate}%</div>
              <div className="rounded-md bg-[#f4f8f5] p-2">Sales: {stats.completed}</div>
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
