'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Wallet, Check, AlertCircle, Loader2 } from 'lucide-react';
import { SUPPORTED_WALLETS, type WalletInfo, openInstallUrl } from '@/lib/stellar/wallet';
import { cn } from '@/lib/utils';

interface WalletSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletSelect: (walletId: string) => Promise<void>;
}

export function WalletSelectorModal({ open, onOpenChange, onWalletSelect }: WalletSelectorModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleWalletClick = async (walletId: string) => {
    setConnecting(walletId);
    try {
      await onWalletSelect(walletId);
      onOpenChange(false);
    } catch (error: any) {
      // Don't log or show errors for user cancellation - it's a normal action
      if (error.code === 'USER_CANCELLED' || error.code === 'MODAL_CLOSED') {
        // Just close the modal silently
        onOpenChange(false);
        return;
      }
      
      console.error('Wallet connection failed:', error);
      // Error is handled by the parent component
    } finally {
      setConnecting(null);
    }
  };

  const handleInstall = (walletId: string) => {
    openInstallUrl(walletId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to TrustLance.
            Select your preferred wallet from the list below.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {SUPPORTED_WALLETS.map((wallet) => (
            <Card
              key={wallet.id}
              className={cn(
                'transition-all hover:shadow-md cursor-pointer',
                !wallet.installUrl && 'opacity-75'
              )}
            >
              <CardHeader className="p-4">
                <div className="flex items-center gap-4">
                  {/* Wallet Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {wallet.iconUrl ? (
                      <img
                        src={wallet.iconUrl}
                        alt={wallet.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Wallet className="w-6 h-6 text-white" />
                    )}
                  </div>

                  {/* Wallet Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{wallet.name}</CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {wallet.description}
                    </CardDescription>
                  </div>

                  {/* Action Button */}
                  <div>
                    <Button
                      onClick={() => handleWalletClick(wallet.id)}
                      disabled={connecting === wallet.id}
                      className="min-w-[100px]"
                      variant={wallet.installUrl ? 'default' : 'outline'}
                    >
                      {connecting === wallet.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Additional Info for wallets without install URL */}
              {!wallet.installUrl && (
                <CardContent className="pt-0 pb-4 px-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {wallet.name} is a web-based wallet. Click "Connect" to use it directly in your browser.
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">New to Stellar wallets?</p>
            <p>
              We recommend starting with{' '}
              <strong className="text-blue-600">Freighter</strong> - the most popular choice for Stellar.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
