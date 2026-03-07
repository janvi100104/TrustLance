'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
import { SUPPORTED_WALLETS, openInstallUrl, isWalletInstalled } from '@/lib/stellar/wallet';
import { cn } from '@/lib/utils';

interface WalletSelectorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWalletSelect: (walletId: string) => Promise<void>;
}

export function WalletSelectorModal({ open, onOpenChange, onWalletSelect }: WalletSelectorModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [installedWallets, setInstalledWallets] = useState<Record<string, boolean>>({});
  const [checkingInstallation, setCheckingInstallation] = useState(true);

  // Check which wallets are installed when modal opens
  useEffect(() => {
    if (open) {
      checkAllWallets();
    }
  }, [open]);

  const checkAllWallets = async () => {
    setCheckingInstallation(true);
    const results: Record<string, boolean> = {};
    
    for (const wallet of SUPPORTED_WALLETS) {
      // Don't log errors during installation check
      results[wallet.id] = await isWalletInstalled(wallet.id);
    }
    
    setInstalledWallets(results);
    setCheckingInstallation(false);
  };

  const handleWalletClick = async (walletId: string) => {
    // If wallet is not installed, open install URL
    if (!installedWallets[walletId]) {
      openInstallUrl(walletId);
      return;
    }

    // Wallet is installed, proceed with connection
    setConnecting(walletId);
    try {
      await onWalletSelect(walletId);
      // Don't close modal here - let the parent handle it based on success
    } catch (error: any) {
      // Don't log or show errors for user cancellation - it's a normal action
      if (error.code === 'USER_CANCELLED' || error.code === 'MODAL_CLOSED') {
        // Keep modal open for retry
        return;
      }

      console.error('Wallet connection failed:', error);
      // Error is handled by the parent component
    } finally {
      setConnecting(null);
    }
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
            {checkingInstallation ? (
              <span className="flex items-center gap-2 mt-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking installed wallets...
              </span>
            ) : (
              <span className="mt-1 text-xs block">
                💡 Installed wallets are highlighted. Click "Install" for wallets you want to add.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          {SUPPORTED_WALLETS.map((wallet) => {
            const isInstalled = installedWallets[wallet.id];
            const isConnecting = connecting === wallet.id;

            return (
              <Card
                key={wallet.id}
                className={cn(
                  'transition-all hover:shadow-md',
                  isConnecting && 'opacity-50 pointer-events-none',
                  isInstalled && 'border-green-300 bg-green-50',
                  !isInstalled && 'border-gray-200'
                )}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Wallet Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 relative">
                      {wallet.iconUrl ? (
                        <img
                          src={wallet.iconUrl}
                          alt={wallet.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <Wallet className="w-6 h-6 text-white" />
                      )}
                      {isInstalled && (
                        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5">
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Wallet Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{wallet.name}</CardTitle>
                        {isInstalled && (
                          <span className="text-xs text-green-600 font-medium">Installed</span>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {wallet.description}
                      </CardDescription>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isInstalled ? (
                        <Button
                          onClick={() => handleWalletClick(wallet.id)}
                          disabled={isConnecting}
                          className="min-w-[100px]"
                          variant="default"
                        >
                          {isConnecting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleWalletClick(wallet.id)}
                          disabled={isConnecting}
                          className="min-w-[100px]"
                          variant="outline"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Install
                        </Button>
                      )}
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
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t pt-4">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">New to Stellar wallets?</p>
            <p>
              We recommend starting with{' '}
              <strong className="text-blue-600">Freighter</strong> - the most popular choice for Stellar.
            </p>
            <p className="text-xs mt-2">
              Make sure to install the wallet extension before connecting.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
