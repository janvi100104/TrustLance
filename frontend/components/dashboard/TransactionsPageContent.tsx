'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRightLeft, Copy, Download, Filter, Inbox, Search, Send, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardKpiCard, DashboardPanel } from '@/components/dashboard/primitives';
import { useDashboardData } from './useDashboardData';
import { useTransactionFilters, filterAndSortTransactions } from './useDashboardFilters';
import { getStatusColor } from './dashboard-utils';
import { usePaymentTransferStore } from '@/store/usePaymentTransferStore';
import { useWallet } from '@/store/useWallet';
import { useDashboardPreferences } from '@/store/useDashboardPreferences';
import { SimplePaymentForm } from '@/components/wallet/SimplePaymentForm';
import type { PaymentTransferInput } from '@/types/dashboard';

function txUrl(hash: string, explorerPreference: 'stellar-chain' | 'stellar-expert') {
  if (explorerPreference === 'stellar-expert') {
    return `https://stellar.expert/explorer/testnet/tx/${hash}`;
  }
  return `https://testnet.stellarchain.io/tx/${hash}`;
}

export function TransactionsPageContent() {
  const { unifiedTransactions } = useDashboardData();
  const { addTransfer } = usePaymentTransferStore();
  const { publicKey, isConnected } = useWallet();
  const { explorerPreference } = useDashboardPreferences();
  const { filters, updateFilter, resetFilters } = useTransactionFilters();

  const [requestAmount, setRequestAmount] = useState('');
  const [requestMemo, setRequestMemo] = useState('');

  const filteredTransactions = useMemo(
    () => filterAndSortTransactions(unifiedTransactions, filters),
    [filters, unifiedTransactions]
  );

  const summary = useMemo(() => {
    const sent = unifiedTransactions
      .filter((row) => row.source === 'payment' && row.eventType === 'payment_sent')
      .reduce((sum, row) => sum + row.amount, 0);
    const received = unifiedTransactions
      .filter((row) => row.source === 'payment' && row.eventType === 'payment_received')
      .reduce((sum, row) => sum + row.amount, 0);
    const escrowVolume = unifiedTransactions
      .filter((row) => row.source === 'escrow')
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      total: unifiedTransactions.length,
      sent,
      received,
      escrowVolume
    };
  }, [unifiedTransactions]);

  const paymentRequestUri = useMemo(() => {
    if (!publicKey) {
      return '';
    }

    const amountPart = requestAmount ? `&amount=${requestAmount}` : '';
    const memoPart = requestMemo ? `&memo=${encodeURIComponent(requestMemo)}` : '';
    return `web+stellar:pay?destination=${publicKey}${amountPart}${memoPart}`;
  }, [publicKey, requestAmount, requestMemo]);

  const handlePaymentSuccess = (transfer: PaymentTransferInput) => {
    addTransfer(transfer);
  };

  const copyToClipboard = async (value: string, message: string) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error('Unable to copy.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard label="Total Records" value={summary.total.toString()} helper="Escrow + payment events" />
        <DashboardKpiCard label="Total Sent" value={`${summary.sent.toFixed(2)} XLM`} helper="Outgoing wallet payments" />
        <DashboardKpiCard label="Total Received" value={`${summary.received.toFixed(2)} XLM`} helper="Incoming wallet payments" />
        <DashboardKpiCard label="Escrow Volume" value={`${summary.escrowVolume.toFixed(2)} XLM`} helper="Tracked escrow amount" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardPanel
          title="Send Money"
          description="Transfer XLM on Stellar network with your connected wallet."
          rightSlot={<Send className="h-4 w-4 text-[#1f6a3f]" />}
        >
          <SimplePaymentForm onSuccess={handlePaymentSuccess} className="max-w-full" />
        </DashboardPanel>

        <DashboardPanel
          title="Receive Money"
          description="Share your wallet address or payment request link."
          rightSlot={<Download className="h-4 w-4 text-[#1f6a3f]" />}
        >
          <div className="space-y-3">
            <div className="rounded-lg border border-[#d8e0da] bg-[#f8fbf8] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Wallet Address</p>
              <p className="mt-1 break-all font-mono text-xs text-[#143224]">
                {publicKey || 'Connect wallet to receive payments'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={!publicKey}
                onClick={() => copyToClipboard(publicKey || '', 'Wallet address copied.')}
              >
                <Copy className="mr-2 h-3.5 w-3.5" /> Copy Address
              </Button>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs text-[#5c7567]">Request Amount (optional)</p>
                <Input
                  value={requestAmount}
                  onChange={(event) => setRequestAmount(event.target.value)}
                  type="number"
                  min="0"
                  step="0.0000001"
                  placeholder="0.00"
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-[#5c7567]">Memo (optional)</p>
                <Input
                  value={requestMemo}
                  onChange={(event) => setRequestMemo(event.target.value)}
                  placeholder="Invoice #"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#d8e0da] bg-[#f8fbf8] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Payment Request URI</p>
              <p className="mt-1 break-all font-mono text-xs text-[#143224]">
                {paymentRequestUri || 'Connect wallet to generate URI'}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                disabled={!paymentRequestUri}
                onClick={() => copyToClipboard(paymentRequestUri, 'Payment request URI copied.')}
              >
                <ArrowRightLeft className="mr-2 h-3.5 w-3.5" /> Copy Request URI
              </Button>
            </div>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Transaction History"
        description="Combined escrow lifecycle and direct wallet payment activity."
      >
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#6f8b7c]" />
              <Input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search title, hash, or counterparty"
                className="pl-8"
              />
            </div>
            <select
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value as typeof filters.status)}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="created">Created</option>
              <option value="funded">Funded</option>
              <option value="released">Released</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={filters.type}
              onChange={(event) => updateFilter('type', event.target.value as typeof filters.type)}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="escrow">Escrow</option>
              <option value="payment">Payment</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(event) => updateFilter('dateRange', event.target.value as typeof filters.dateRange)}
              className="h-9 rounded-md border border-[#d8e0da] bg-white px-2 text-sm"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
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
            </select>
            <Button variant="outline" onClick={resetFilters} className="h-9">
              <Filter className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-[#dfe7e1]">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e2e9e4] bg-[#f8fbf8] text-left text-[#5b7364]">
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Counterparty</th>
                    <th className="px-3 py-2 font-medium">Amount</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Explorer</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((row) => (
                    <tr key={row.id} className="border-b border-[#edf3ee]">
                      <td className="px-3 py-2">
                        <Badge className={row.source === 'payment' ? 'bg-[#d8f2dc] text-[#175a35]' : 'bg-[#e3ebff] text-[#234389]'}>
                          {row.source}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 font-medium text-[#183124]">{row.title}</td>
                      <td className="px-3 py-2 font-mono text-xs text-[#4e6a5a]">
                        {row.counterparty ? `${row.counterparty.slice(0, 8)}...${row.counterparty.slice(-6)}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-[#183124]">{row.amount.toFixed(2)} {row.currency}</td>
                      <td className="px-3 py-2">
                        <Badge className={getStatusColor(row.status)}>{row.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-[#4e6a5a]">{new Date(row.timestamp).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        {row.transactionHash ? (
                          <Link
                            href={txUrl(row.transactionHash, explorerPreference)}
                            target="_blank"
                            className="text-xs text-[#1d5d3a] hover:underline"
                          >
                            Open
                          </Link>
                        ) : (
                          <span className="text-xs text-[#98a9a0]">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#c9d5cc] p-8 text-center">
              <Inbox className="mx-auto mb-3 h-9 w-9 text-[#739180]" />
              <p className="text-[#355547]">No transaction records match current filters.</p>
            </div>
          )}
        </div>
      </DashboardPanel>

      {!isConnected && (
        <div className="rounded-xl border border-[#d7dfd9] bg-[#f8fbf8] p-4 text-sm text-[#4b6558]">
          <Wallet className="mr-2 inline h-4 w-4" /> Connect your wallet to send and receive money.
        </div>
      )}
    </div>
  );
}
