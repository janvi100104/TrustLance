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

    return {
      active,
      pending,
      completed,
      totalValue: balance || 0,
      totalEscrowVolume,
      sentVolume,
      receivedVolume,
      avgEscrowAmount,
      completionRate: userEscrows.length > 0 ? Math.round((completed / userEscrows.length) * 100) : 0,
      weeklyChange: active > 0 ? Math.min(40, 12 + active * 4) : 0
    };
  }, [balance, paymentTransfers, publicKey, userEscrows]);

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

  const performanceSegments = useMemo(
    () => [
      { label: 'Completed', value: Math.max(8, stats.completionRate), color: '#7ac142' },
      { label: 'Active', value: Math.max(8, Math.min(30, stats.active * 8)), color: '#1f7a46' },
      { label: 'Pending', value: Math.max(8, Math.min(20, stats.pending * 8)), color: '#f2b544' }
    ],
    [stats.active, stats.completionRate, stats.pending]
  );

  const donut = useMemo(
    () =>
      `conic-gradient(${performanceSegments[0].color} 0 ${performanceSegments[0].value}%, ${performanceSegments[1].color} ${performanceSegments[0].value}% ${performanceSegments[0].value + performanceSegments[1].value}%, ${performanceSegments[2].color} ${performanceSegments[0].value + performanceSegments[1].value}% 100%)`,
    [performanceSegments]
  );

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
    unifiedTransactions,
    transactionHistory,
    totalTransactionVolume,
    recentActivity
  };
}
