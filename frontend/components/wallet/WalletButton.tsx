'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/store/useWallet';
import { truncateAddress } from '@/lib/utils';
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
    walletId,
    walletName 
  } = useWallet();

  const handleWalletSelect = async (selectedWalletId: string) => {
    try {
      await connectWallet(selectedWalletId);
      const wallet = getWalletById(selectedWalletId);
      toast.success(`${wallet?.name || 'Wallet'} connected successfully!`);
    } catch (error: any) {
      // Don't show error toast for user cancellation
      if (error.code === 'USER_CANCELLED' || error.code === 'MODAL_CLOSED') {
        console.log('Wallet connection cancelled by user');
        return;
      }
      
      // Error is handled in the store, but we can add additional context
      console.error('Wallet connection failed:', error);
      toast.error(error.message || 'Failed to connect wallet');
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
            <Button variant="outline" size="sm" className="gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-mono" title={publicKey}>
                {truncateAddress(publicKey)}
              </span>
              <ChevronDown className="w-4 h-4 opacity-50" />
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
            <Button variant="ghost" size="sm" className="gap-2">
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
        className="gap-2"
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
