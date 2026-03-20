'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/store/useWallet';
import { cn, truncateAddress } from '@/lib/utils';
import { Loader2, AlertCircle, LayoutDashboard, Wallet, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { WalletSelectorModal } from './WalletSelectorModal';
import { getWalletById } from '@/lib/stellar/wallet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function WalletButton({ variant = 'default' }: { variant?: 'default' | 'nav' }) {
  const [modalOpen, setModalOpen] = useState(false);
  const { 
    publicKey, 
    isConnected, 
    connecting, 
    error, 
    connectWallet, 
    disconnectWallet, 
    clearError,
    walletName 
  } = useWallet();
  const isNavVariant = variant === 'nav';

  const handleWalletSelect = async (selectedWalletId: string) => {
    try {
      await connectWallet(selectedWalletId);
      const wallet = getWalletById(selectedWalletId);
      toast.success(`${wallet?.name || 'Wallet'} connected successfully!`);
      // Close modal on success
      setModalOpen(false);
    } catch (error: unknown) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code?: unknown }).code)
          : undefined;
      const errorMessage =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'Failed to connect wallet';

      // Don't show error toast for user cancellation
      if (errorCode === 'USER_CANCELLED' || errorCode === 'MODAL_CLOSED') {
        console.log('Wallet connection cancelled by user');
        // Keep modal open for retry
        return;
      }

      // Error is handled in the store, but we can add additional context
      console.error('Wallet connection failed:', error);
      toast.error(errorMessage);
      // Keep modal open for retry
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  };

  // Show error state if present
  if (error && isConnected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
        <Button onClick={() => clearError()} variant="outline" size="sm">
          Dismiss
        </Button>
      </div>
    );
  }

  if (isConnected && publicKey) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={isNavVariant ? 'ghost' : 'outline'}
              size="sm"
              className={cn(
                'gap-2',
                isNavVariant
                  ? 'h-9 rounded-full border border-emerald-100/35 bg-white/10 px-3.5 text-emerald-50 shadow-[0_10px_24px_rgba(3,34,28,0.32)] backdrop-blur-md hover:bg-white/20 hover:text-white'
                  : ''
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full',
                  isNavVariant
                    ? 'h-6 w-6 bg-emerald-300/25 ring-1 ring-emerald-100/35'
                    : 'w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600'
                )}
              >
                <Wallet className={cn('w-3.5 h-3.5', isNavVariant ? 'text-emerald-50' : 'text-white')} />
              </div>
              <span
                className={cn(
                  'font-mono',
                  isNavVariant ? 'text-xs tracking-wide text-emerald-50/95' : 'text-sm'
                )}
                title={publicKey}
              >
                {truncateAddress(publicKey)}
              </span>
              {isNavVariant && <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.85)]" />}
              <ChevronDown className={cn('w-4 h-4', isNavVariant ? 'opacity-75' : 'opacity-50')} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Connected Wallet</p>
                <p className="text-xs text-muted-foreground">
                  {walletName || 'Wallet'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDisconnect}>
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {variant === 'nav' && (
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 rounded-full border border-emerald-100/30 bg-emerald-100/10 px-3.5 text-emerald-50 backdrop-blur-sm hover:bg-emerald-100/20 hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden lg:inline">Dashboard</span>
            </Button>
          </Link>
        )}
      </>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setModalOpen(true)} 
        disabled={connecting}
        variant={variant === 'nav' ? 'ghost' : 'default'}
        size="sm"
        className={cn(
          'gap-2',
          isNavVariant
            ? 'h-9 rounded-full border border-emerald-100/35 bg-emerald-100/12 px-3.5 text-emerald-50 shadow-[0_10px_24px_rgba(3,34,28,0.28)] backdrop-blur-sm hover:bg-emerald-100/22 hover:text-white'
            : ''
        )}
      >
        {connecting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Connect Wallet</span>
          </>
        )}
      </Button>

      <WalletSelectorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onWalletSelect={handleWalletSelect}
      />
    </>
  );
}
