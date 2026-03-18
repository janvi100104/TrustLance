'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Copy, ExternalLink, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CreateEscrowForm } from '@/components/escrow/CreateEscrowForm';
import { DashboardPanel } from '@/components/dashboard/primitives';
import type { CreateEscrowDraft, EscrowCreatedPayload } from '@/types/dashboard';

const defaultDraft: CreateEscrowDraft = {
  projectTitle: '',
  freelancerAddress: '',
  amount: '',
  deadlineDays: 7
};

export function EscrowCreatePageContent() {
  const [draft, setDraft] = useState<CreateEscrowDraft>(defaultDraft);
  const [createdEscrow, setCreatedEscrow] = useState<EscrowCreatedPayload | null>(null);

  const parsedAmount = Number.parseFloat(draft.amount || '0');
  const platformFee = useMemo(() => (Number.isFinite(parsedAmount) ? parsedAmount * 0.01 : 0), [parsedAmount]);
  const releaseAmount = useMemo(() => Math.max(0, parsedAmount - platformFee), [parsedAmount, platformFee]);

  const checklist = [
    { label: 'Project title added', done: draft.projectTitle.trim().length > 0 },
    { label: 'Freelancer Stellar address added', done: draft.freelancerAddress.trim().length > 0 },
    { label: 'Escrow amount set', done: Number.isFinite(parsedAmount) && parsedAmount > 0 },
    { label: 'Deadline selected', done: draft.deadlineDays >= 1 }
  ];

  const copyEscrowId = async () => {
    if (!createdEscrow?.id) return;

    try {
      await navigator.clipboard.writeText(createdEscrow.id);
      toast.success('Escrow ID copied.');
    } catch {
      toast.error('Unable to copy Escrow ID.');
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
      <DashboardPanel
        title="Create New Escrow"
        description="Set terms and lock funds securely on Stellar."
      >
        <CreateEscrowForm onDraftChange={setDraft} onEscrowCreated={setCreatedEscrow} />
      </DashboardPanel>

      <div className="space-y-4">
        <DashboardPanel title="Project Summary" description="Live preview based on your current form values.">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border border-[#dce5de] bg-[#f8fbf8] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Title</p>
              <p className="mt-1 font-medium text-[#183124]">{draft.projectTitle || 'Untitled project'}</p>
            </div>
            <div className="rounded-lg border border-[#dce5de] bg-[#f8fbf8] p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Freelancer</p>
              <p className="mt-1 font-mono text-xs text-[#183124] break-all">
                {draft.freelancerAddress || 'G...'}
              </p>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-[#dce5de] bg-[#f8fbf8] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Amount</p>
                <p className="mt-1 font-semibold text-[#183124]">{parsedAmount > 0 ? parsedAmount.toFixed(2) : '0.00'} XLM</p>
              </div>
              <div className="rounded-lg border border-[#dce5de] bg-[#f8fbf8] p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Deadline</p>
                <p className="mt-1 font-semibold text-[#183124]">{draft.deadlineDays || 0} days</p>
              </div>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Fee & Timeline" description="Derived values before you submit.">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md bg-[#f8fbf8] px-3 py-2">
              <span className="text-[#4b6558]">Platform fee (1%)</span>
              <span className="font-medium text-[#183124]">{platformFee.toFixed(4)} XLM</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-[#f8fbf8] px-3 py-2">
              <span className="text-[#4b6558]">Approx. release amount</span>
              <span className="font-medium text-[#183124]">{releaseAmount.toFixed(4)} XLM</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3 text-xs text-[#587166]">
              <Shield className="h-4 w-4 text-[#1f6a3f]" />
              Funds remain locked in escrow until release/refund conditions are met.
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Pre-submit Checklist" description="Confirm core fields before creating escrow.">
          <div className="space-y-2 text-sm">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 text-[#2f8a4a]" />
                ) : (
                  <Circle className="h-4 w-4 text-[#97aba0]" />
                )}
                <span className={item.done ? 'text-[#1e3b2b]' : 'text-[#667f72]'}>{item.label}</span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        {createdEscrow && (
          <DashboardPanel title="Next Actions" description="Escrow created successfully. Continue your workflow.">
            <div className="space-y-2">
              <div className="rounded-lg border border-[#dce5de] bg-[#f8fbf8] p-3 text-xs text-[#4b6558]">
                Escrow ID: <span className="font-mono text-[#173325]">{createdEscrow.id}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyEscrowId}>
                  <Copy className="mr-2 h-3.5 w-3.5" /> Copy ID
                </Button>
                <Button asChild size="sm" className="bg-[#1f6a3f] hover:bg-[#185736]">
                  <Link href="/dashboard/escrow-contracts">
                    View Contracts <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard/transactions">Go To Transactions</Link>
              </Button>
            </div>
          </DashboardPanel>
        )}
      </div>
    </div>
  );
}
