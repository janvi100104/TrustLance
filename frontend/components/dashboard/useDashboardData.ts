'use client';

import { useMemo } from 'react';
import { useEscrowStore } from '@/store/useEscrowStore';
import { useWallet } from '@/store/useWallet';
import { usePaymentTransferStore } from '@/store/usePaymentTransferStore';
import type {
  DashboardPipelineStats,
  DashboardRecentActivity,
  UnifiedTransactionRow
} from '@/types/dashboard';

export function useDashboardData() {
  const { publicKey, balance, isConnected } = useWallet();
  const { getEscrowsByUser } = useEscrowStore();
  const { transfers } = usePaymentTransferStore();

  const userEscrows = useMemo(
    () => (isConnected && publicKey ? getEscrowsByUser(publicKey) : []),
    [getEscrowsByUser, isConnected, publicKey]
  );

  const paymentTransfers = useMemo(
    () =>
      transfers.filter((transfer) => {
        if (!publicKey) return false;
        return transfer.from === publicKey || transfer.to === publicKey;
      }),
    [publicKey, transfers]
  );

  const pipelineStats = useMemo<DashboardPipelineStats>(
    () => ({
      created: userEscrows.filter((e) => e.status === 'created').length,
      funded: userEscrows.filter((e) => e.status === 'funded').length,
      released: userEscrows.filter((e) => e.status === 'released').length,
      refunded: userEscrows.filter((e) => e.status === 'refunded').length,
      disputed: userEscrows.filter((e) => e.status === 'disputed').length
    }),
    [userEscrows]
  );

  const weeklyEscrowActivity = useMemo(() => {
    const anchor = userEscrows.reduce((max, escrow) => {
      const createdAt = new Date(escrow.createdAt).getTime();
      return Number.isFinite(createdAt) && createdAt > max ? createdAt : max;
    }, 0);

    if (anchor <= 0) {
      return {
        currentWindow: 0,
        previousWindow: 0,
        percentChange: null
      };
    }

    const dayMs = 24 * 60 * 60 * 1000;
    const currentStart = anchor - 7 * dayMs;
    const previousStart = anchor - 14 * dayMs;

    let currentWindow = 0;
    let previousWindow = 0;

    for (const escrow of userEscrows) {
      const createdAt = new Date(escrow.createdAt).getTime();
      if (createdAt >= currentStart && createdAt <= anchor) {
        currentWindow += 1;
      } else if (createdAt >= previousStart && createdAt < currentStart) {
        previousWindow += 1;
      }
    }

    return {
      currentWindow,
      previousWindow,
      percentChange:
        previousWindow > 0
          ? Math.round(((currentWindow - previousWindow) / previousWindow) * 100)
          : null
    };
  }, [userEscrows]);

  const stats = useMemo(() => {
    const active = userEscrows.filter((e) => e.status === 'created' || e.status === 'funded').length;
    const pending = userEscrows.filter((e) => e.status === 'funded').length;
    const completed = userEscrows.filter((e) => e.status === 'released' || e.status === 'refunded').length;
    const totalEscrowVolume = userEscrows.reduce((sum, escrow) => sum + escrow.amount, 0);
    const sentVolume = paymentTransfers
      .filter((transfer) => publicKey && transfer.from === publicKey)
      .reduce((sum, transfer) => sum + transfer.amount, 0);
    const receivedVolume = paymentTransfers
      .filter((transfer) => publicKey && transfer.to === publicKey)
      .reduce((sum, transfer) => sum + transfer.amount, 0);
    const avgEscrowAmount = userEscrows.length > 0 ? totalEscrowVolume / userEscrows.length : 0;
    const netFlow = receivedVolume - sentVolume;

    return {
      active,
      pending,
      completed,
      totalValue: balance || 0,
      totalEscrowVolume,
      sentVolume,
      receivedVolume,
      netFlow,
      avgEscrowAmount,
      completionRate: userEscrows.length > 0 ? Math.round((completed / userEscrows.length) * 100) : 0,
      weeklyEscrowCurrent: weeklyEscrowActivity.currentWindow,
      weeklyEscrowPrevious: weeklyEscrowActivity.previousWindow,
      weeklyEscrowChangePct: weeklyEscrowActivity.percentChange
    };
  }, [balance, paymentTransfers, publicKey, userEscrows, weeklyEscrowActivity]);

  const escrowTransactionRows = useMemo<UnifiedTransactionRow[]>(
    () =>
      userEscrows.map((escrow) => ({
        id: `escrow-${escrow.id}`,
        source: 'escrow',
        eventType: `escrow_${escrow.status}`,
        title: escrow.title,
        amount: escrow.amount,
        currency: escrow.currency,
        status: escrow.status,
        timestamp: new Date(escrow.createdAt),
        counterparty: publicKey === escrow.client ? escrow.freelancer : escrow.client,
        referenceId: escrow.id,
        transactionHash: escrow.transactionHash,
        metadata: escrow.metadata
      })),
    [publicKey, userEscrows]
  );

  const paymentTransactionRows = useMemo<UnifiedTransactionRow[]>(
    () =>
      paymentTransfers.map((transfer) => {
        const isSent = !!publicKey && transfer.from === publicKey;
        return {
          id: `payment-${transfer.id}`,
          source: 'payment',
          eventType: isSent ? 'payment_sent' : 'payment_received',
          title: isSent ? 'Payment sent' : 'Payment received',
          amount: transfer.amount,
          currency: transfer.currency,
          status: transfer.status,
          timestamp: new Date(transfer.createdAt),
          counterparty: isSent ? transfer.to : transfer.from,
          referenceId: transfer.id,
          transactionHash: transfer.transactionHash,
          metadata: transfer.memo
        };
      }),
    [paymentTransfers, publicKey]
  );

  const unifiedTransactions = useMemo<UnifiedTransactionRow[]>(
    () =>
      [...escrowTransactionRows, ...paymentTransactionRows].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    [escrowTransactionRows, paymentTransactionRows]
  );

  const performanceSegments = useMemo(() => {
    const completedCount = pipelineStats.released + pipelineStats.refunded;
    const activeCount = pipelineStats.created + pipelineStats.disputed;
    const pendingCount = pipelineStats.funded;
    const total = completedCount + activeCount + pendingCount;

    const toPct = (value: number) => (total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0);

    return [
      { label: 'Completed', value: toPct(completedCount), color: '#7ac142' },
      { label: 'Active', value: toPct(activeCount), color: '#1f7a46' },
      { label: 'Pending', value: toPct(pendingCount), color: '#f2b544' }
    ];
  }, [pipelineStats.created, pipelineStats.disputed, pipelineStats.funded, pipelineStats.refunded, pipelineStats.released]);

  const donut = useMemo(() => {
    const [completed, active, pending] = performanceSegments;
    const total = completed.value + active.value + pending.value;

    if (total <= 0) {
      return 'conic-gradient(#e5ece8 0 100%)';
    }

    const completedEnd = completed.value;
    const activeEnd = completed.value + active.value;
    return `conic-gradient(${completed.color} 0 ${completedEnd}%, ${active.color} ${completedEnd}% ${activeEnd}%, ${pending.color} ${activeEnd}% 100%)`;
  }, [performanceSegments]);

  const monthlyPaymentSeries = useMemo(() => {
    const now = new Date();
    const months: Array<{
      key: string;
      label: string;
      sent: number;
      received: number;
    }> = [];

    for (let offset = 5; offset >= 0; offset -= 1) {
      const point = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${point.getFullYear()}-${String(point.getMonth() + 1).padStart(2, '0')}`;
      months.push({
        key,
        label: point.toLocaleString('en-US', { month: 'short' }),
        sent: 0,
        received: 0
      });
    }

    const monthIndex = new Map(months.map((item, index) => [item.key, index] as const));

    for (const transfer of paymentTransfers) {
      if (transfer.status !== 'success') {
        continue;
      }

      const createdAt = new Date(transfer.createdAt);
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      const index = monthIndex.get(key);
      if (index === undefined) {
        continue;
      }

      if (publicKey && transfer.from === publicKey) {
        months[index].sent += transfer.amount;
      } else if (publicKey && transfer.to === publicKey) {
        months[index].received += transfer.amount;
      }
    }

    return months;
  }, [paymentTransfers, publicKey]);

  const transactionHistory = unifiedTransactions;

  const totalTransactionVolume = useMemo(
    () => unifiedTransactions.reduce((sum, row) => sum + row.amount, 0),
    [unifiedTransactions]
  );

  const recentActivity = useMemo<DashboardRecentActivity[]>(
    () =>
      unifiedTransactions.slice(0, 8).map((row) => ({
        id: row.id,
        label: row.title,
        source: row.source,
        status: row.status,
        amount: row.amount,
        timestamp: row.timestamp
      })),
    [unifiedTransactions]
  );

  return {
    userEscrows,
    paymentTransfers,
    stats,
    pipelineStats,
    performanceSegments,
    donut,
    monthlyPaymentSeries,
    unifiedTransactions,
    transactionHistory,
    totalTransactionVolume,
    recentActivity
  };
}
