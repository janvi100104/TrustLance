'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/store/useWallet';
import { toast } from 'sonner';
import { isValidStellarAddress, isValidStellarAmount, sanitizeInput, cn } from '@/lib/utils';
import { createAndSubmitPayment } from '@/lib/stellar/transactions';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { PaymentTransferInput } from '@/types/dashboard';

interface SimplePaymentFormProps {
  onSuccess?: (transfer: PaymentTransferInput) => void;
  className?: string;
}

export function SimplePaymentForm({ onSuccess, className }: SimplePaymentFormProps = {}) {
  const { publicKey, isConnected, fetchBalance } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const sendPayment = async () => {
    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Sanitize inputs
    const sanitizedAddress = sanitizeInput(recipientAddress);
    const sanitizedAmount = sanitizeInput(amount);

    if (!sanitizedAddress.trim()) {
      toast.error('Please enter recipient address');
      return;
    }

    if (!isValidStellarAddress(sanitizedAddress)) {
      toast.error('Invalid Stellar address format. Address must start with G and be 56 characters.');
      return;
    }

    if (!isValidStellarAmount(sanitizedAmount)) {
      toast.error('Please enter a valid amount (positive number with up to 7 decimal places)');
      return;
    }

    // Check if sending to self
    if (sanitizedAddress === publicKey) {
      toast.error('Cannot send payment to yourself');
      return;
    }

    setLoading(true);
    setTransactionHash(null);

    try {
      // Create and submit real transaction
      const result = await createAndSubmitPayment({
        sourcePublicKey: publicKey,
        destinationPublicKey: sanitizedAddress,
        amount: sanitizedAmount,
      });

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);

        // Refresh balance after successful transaction
        await fetchBalance();

        const transferPayload: PaymentTransferInput = {
          from: publicKey,
          to: sanitizedAddress,
          amount: parseFloat(sanitizedAmount),
          currency: 'XLM',
          status: 'success',
          transactionHash: result.transactionHash,
          createdAt: new Date()
        };
        onSuccess?.(transferPayload);
        
        toast.success(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Payment sent successfully!</span>
            </div>
            <Link
              href={`https://testnet.stellarchain.io/tx/${result.transactionHash}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        );
        
        // Clear form
        setRecipientAddress('');
        setAmount('');
      } else {
        // Handle specific error codes
        let errorMessage = result.error || 'Payment failed';
        
        switch (result.errorCode) {
          case 'INVALID_SOURCE_ADDRESS':
            errorMessage = 'Your wallet address is invalid. Please reconnect.';
            break;
          case 'INVALID_DESTINATION_ADDRESS':
            errorMessage = 'Invalid recipient address. Please check and try again.';
            break;
          case 'INVALID_AMOUNT':
            errorMessage = 'Invalid amount. Please enter a valid positive number.';
            break;
          case 'OPERATION_FAILED':
            errorMessage = 'Payment operation failed. You may have insufficient balance.';
            break;
          case 'USER_CANCELLED':
            errorMessage = 'Transaction was cancelled in your wallet.';
            break;
          case 'TIMEOUT':
            errorMessage = 'Network timeout. Please try again.';
            break;
        }
        
        toast.error(
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Payment failed';
      console.error('Payment failed:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('w-full max-w-md space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient Address</Label>
        <Input
          id="recipient"
          placeholder="Enter Stellar address (G...)"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          disabled={!isConnected || loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount (XLM)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!isConnected || loading}
          min="0"
          step="0.0000001"
        />
      </div>

      <Button
        onClick={sendPayment}
        disabled={!isConnected || loading || !recipientAddress || !amount}
        className="w-full"
      >
        {loading ? 'Sending...' : 'Send XLM'}
      </Button>

      {/* Transaction Success Display */}
      {transactionHash && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Transaction Successful</p>
              <p className="text-xs text-green-700 mt-1 font-mono">
                {transactionHash.substring(0, 16)}...{transactionHash.substring(transactionHash.length - 8)}
              </p>
              <Link
                href={`https://testnet.stellarchain.io/tx/${transactionHash}`}
                target="_blank"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2"
              >
                View on Stellar Chain <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
