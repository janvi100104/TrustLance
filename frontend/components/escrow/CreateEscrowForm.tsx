'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/store/useWallet';
import { useEscrowStore } from '@/store/useEscrowStore';
import { toast } from 'sonner';
import { isValidStellarAddress, isValidStellarAmount, sanitizeInput } from '@/lib/utils';
import { initializeEscrow, xlmToStroops, ESCROW_CONTRACT_ID } from '@/lib/stellar/contract';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';
import type { CreateEscrowDraft, EscrowCreatedPayload } from '@/types/dashboard';

interface CreateEscrowFormProps {
  onDraftChange?: (draft: CreateEscrowDraft) => void;
  onEscrowCreated?: (payload: EscrowCreatedPayload) => void;
}

export function CreateEscrowForm({ onDraftChange, onEscrowCreated }: CreateEscrowFormProps = {}) {
  const { publicKey, isConnected } = useWallet();
  const { addEscrow } = useEscrowStore();
  const [projectTitle, setProjectTitle] = useState('');
  const [freelancerAddress, setFreelancerAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('7'); // Default 7 days
  const [loading, setLoading] = useState(false);
  const [escrowId, setEscrowId] = useState<string | null>(null);

  useEffect(() => {
    onDraftChange?.({
      projectTitle,
      freelancerAddress,
      amount,
      deadlineDays: Number.parseInt(deadline, 10) || 0
    });
  }, [amount, deadline, freelancerAddress, onDraftChange, projectTitle]);

  const createEscrow = async () => {
    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeInput(projectTitle);
    const sanitizedAddress = sanitizeInput(freelancerAddress);
    const sanitizedAmount = sanitizeInput(amount);
    const deadlineDays = parseInt(deadline);

    if (!sanitizedTitle.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    if (!sanitizedAddress.trim()) {
      toast.error('Please enter freelancer address');
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

    if (isNaN(deadlineDays) || deadlineDays < 1) {
      toast.error('Deadline must be at least 1 day');
      return;
    }

    setLoading(true);
    setEscrowId(null);

    try {
      // Calculate deadline timestamp
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + deadlineDays);
      
      // Convert amount to stroops
      const amountInStroops = xlmToStroops(parseFloat(sanitizedAmount));

      // Try to create escrow with contract
      const result = await initializeEscrow({
        freelancerAddress: sanitizedAddress,
        amount: amountInStroops,
        deadline: BigInt(Math.floor(deadlineDate.getTime() / 1000)),
        metadata: sanitizedTitle,
      });

      if (result.success && result.transactionHash) {
        // Use the escrow ID from contract result
        const newEscrowId = result.result ? result.result.toString() : 'ESC-' + Date.now().toString().slice(-6);
        setEscrowId(newEscrowId);

        // Store escrow in Zustand
        addEscrow({
          id: newEscrowId,
          title: sanitizedTitle,
          client: publicKey,
          freelancer: sanitizedAddress,
          amount: parseFloat(sanitizedAmount),
          currency: 'XLM',
          status: 'created',
          contractAddress: ESCROW_CONTRACT_ID,
          transactionHash: result.transactionHash,
          createdAt: new Date(),
          deadline: deadlineDate,
          metadata: sanitizedTitle,
        });

        toast.success(
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Escrow created successfully!</span>
            </div>
            <p className="text-sm">Project: &quot;{sanitizedTitle}&quot;</p>
            <p className="text-xs font-mono">Escrow ID: {newEscrowId}</p>
            <Link
              href={`https://stellar.expert/explorer/testnet/tx/${result.transactionHash}`}
              target="_blank"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View on Explorer
            </Link>
          </div>
        );

        onEscrowCreated?.({
          id: newEscrowId,
          title: sanitizedTitle,
          freelancer: sanitizedAddress,
          amount: parseFloat(sanitizedAmount),
          deadlineDays,
          transactionHash: result.transactionHash
        });
        
        // Reset form
        setProjectTitle('');
        setFreelancerAddress('');
        setAmount('');
      } else {
        // Handle errors
        if (result.errorCode === 'CONTRACT_NOT_DEPLOYED') {
          toast.error(
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span>Contract not deployed. Please deploy the escrow contract first.</span>
                <Link
                  href="/docs/deployment"
                  className="text-xs text-blue-600 hover:underline"
                >
                  View deployment guide →
                </Link>
              </div>
            </div>
          );
        } else if (result.errorCode === 'USER_CANCELLED') {
          toast.info('Transaction cancelled');
        } else {
          toast.error(
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span>{result.error || 'Escrow creation failed'}</span>
            </div>
          );
        }
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Escrow creation failed:', err);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{err.message || 'Escrow creation failed'}</span>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm text-blue-800">
            Create an escrow to securely hold funds for your freelance project. 
            Funds are released only when you approve the work.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-title">Project Title</Label>
        <Input
          id="project-title"
          placeholder="e.g., Website redesign"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          disabled={!isConnected || loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="freelancer-address">Freelancer Address</Label>
        <Input
          id="freelancer-address"
          placeholder="Enter freelancer's Stellar address (G...)"
          value={freelancerAddress}
          onChange={(e) => setFreelancerAddress(e.target.value)}
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

      <div className="space-y-2">
        <Label htmlFor="deadline">Deadline (Days)</Label>
        <Input
          id="deadline"
          type="number"
          placeholder="7"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          disabled={!isConnected || loading}
          min="1"
        />
        <p className="text-xs text-gray-500">
          If not released or refunded by this time, freelancer can automatically claim funds.
        </p>
      </div>

      <Button
        onClick={createEscrow}
        disabled={!isConnected || loading || !projectTitle || !freelancerAddress || !amount}
        className="w-full"
      >
        {loading ? 'Creating Escrow...' : 'Create Escrow'}
      </Button>

      {/* Success Display */}
      {escrowId && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Escrow Created Successfully</p>
              <p className="text-xs text-green-700 mt-1 font-mono">
                Escrow ID: {escrowId}
              </p>
              <ul className="mt-2 list-disc pl-4 text-xs text-green-700">
                <li>Navigate to Escrow Contracts to view your escrow.</li>
                <li>Funds will be held securely until work is completed.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
