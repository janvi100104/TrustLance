'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { useWallet } from '@/store/useWallet';
import { useEscrowStore } from '@/store/useEscrowStore';
import { fundEscrowWithPayment, releasePayment, refundEscrow, xlmToStroops } from '@/lib/stellar/contract';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface Escrow {
  id: string;
  title: string;
  client: string;
  freelancer: string;
  amount: number;
  currency: 'XLM' | 'USDC';
  status: 'created' | 'funded' | 'released' | 'refunded';
  contractAddress?: string;
  transactionHash?: string;
  createdAt: Date;
}

export function EscrowCard({ escrow }: { escrow: Escrow }) {
  const { publicKey, isConnected } = useWallet();
  const { updateEscrowStatus, updateEscrowTransaction } = useEscrowStore();
  const [status, setStatus] = useState<Escrow['status']>(escrow.status);
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const isClient = publicKey === escrow.client;
  const isFreelancer = publicKey === escrow.freelancer;

  const fundEscrowAction = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isClient) {
      toast.error('Only the client can fund the escrow');
      return;
    }

    setLoading(true);

    try {
      // Convert amount to stroops
      const amountInStroops = xlmToStroops(escrow.amount);

      // Parse escrow ID - handle both string and numeric IDs
      const escrowId = BigInt(escrow.id.replace(/\D/g, '') || '1');

      // Use fundEscrowWithPayment for REAL XLM transfer
      // This transfers XLM to contract AND calls fund() in one transaction
      const result = await fundEscrowWithPayment(escrowId, amountInStroops);

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);
        setStatus('funded');
        updateEscrowStatus(escrow.id, 'funded');
        if (result.transactionHash) {
          updateEscrowTransaction(escrow.id, result.transactionHash);
        }

        toast.success(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Escrow funded successfully!</span>
            </div>
            <p className="text-xs text-green-700 font-medium">
              {escrow.amount} XLM transferred to contract
            </p>
            <Link
              href={`https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        );
      } else {
        // Handle errors
        if (result.errorCode === 'USER_CANCELLED') {
          toast.info('Transaction cancelled');
        } else {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{result.error || 'Funding failed'}</span>
            </div>
          );
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Funding failed:', err);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{err.message || 'Funding failed'}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const releasePaymentAction = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isClient) {
      toast.error('Only the client can release the payment');
      return;
    }

    if (status !== 'funded') {
      toast.error('Escrow must be funded before releasing payment');
      return;
    }

    setLoading(true);

    try {
      // Parse escrow ID - handle both string and numeric IDs
      const escrowId = BigInt(escrow.id.replace(/\D/g, '') || '1');
      const result = await releasePayment(escrowId);

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);
        setStatus('released');
        updateEscrowStatus(escrow.id, 'released');
        if (result.transactionHash) {
          updateEscrowTransaction(escrow.id, result.transactionHash);
        }
        
        toast.success(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Payment released successfully!</span>
            </div>
            <Link
              href={`https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        );
      } else {
        if (result.errorCode === 'USER_CANCELLED') {
          toast.info('Transaction cancelled');
        } else {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{result.error || 'Release failed'}</span>
            </div>
          );
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Release failed:', err);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{err.message || 'Release failed'}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const refundAction = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isClient) {
      toast.error('Only the client can request refund');
      return;
    }

    setLoading(true);

    try {
      // Parse escrow ID - handle both string and numeric IDs
      const escrowId = BigInt(escrow.id.replace(/\D/g, '') || '1');
      const result = await refundEscrow(escrowId);

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);
        setStatus('refunded');
        updateEscrowStatus(escrow.id, 'refunded');
        if (result.transactionHash) {
          updateEscrowTransaction(escrow.id, result.transactionHash);
        }
        
        toast.success('Refund processed successfully!');
      } else {
        if (result.errorCode === 'USER_CANCELLED') {
          toast.info('Transaction cancelled');
        } else {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{result.error || 'Refund failed'}</span>
            </div>
          );
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Refund failed:', err);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{err.message || 'Refund failed'}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Escrow['status']) => {
    switch (status) {
      case 'created':
        return 'bg-yellow-100 text-yellow-800';
      case 'funded':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{escrow.title}</CardTitle>
            <CardDescription>Escrow ID: {escrow.id.slice(0, 8)}...</CardDescription>
          </div>
          <Badge className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-mono text-sm">{escrow.client?.slice(0, 10)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Freelancer</p>
              <p className="font-mono text-sm">{escrow.freelancer?.slice(0, 10)}...</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Amount</p>
            <p className="font-bold">{escrow.amount} {escrow.currency}</p>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm">{new Date(escrow.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Transaction Hash Display */}
          {transactionHash && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700 font-medium">Transaction Hash:</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs font-mono text-green-600">
                  {transactionHash.substring(0, 16)}...{transactionHash.substring(transactionHash.length - 8)}
                </p>
                <Link
                  href={`https://testnet.stellarchain.io/tx/${transactionHash}`}
                  target="_blank"
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  View <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 space-y-2">
            {status === 'created' && isClient && (
              <Button
                onClick={fundEscrowAction}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Funding...' : 'Fund Escrow'}
              </Button>
            )}

            {status === 'funded' && isClient && (
              <Button
                onClick={releasePaymentAction}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Releasing...' : 'Release Payment'}
              </Button>
            )}

            {status === 'funded' && isFreelancer && (
              <p className="text-center text-sm text-green-600 font-medium">
                Waiting for client to release payment
              </p>
            )}

            {status === 'funded' && isClient && (
              <Button
                onClick={refundAction}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? 'Processing...' : 'Request Refund'}
              </Button>
            )}

            {(status === 'released' || status === 'refunded') && (
              <p className="text-center text-sm text-gray-500">
                Escrow completed
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}