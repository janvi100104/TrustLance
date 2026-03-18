'use client';

import { Bell, BellRing, Database, Globe2, LayoutGrid, MoonStar, Sun, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardPanel } from '@/components/dashboard/primitives';
import { useWallet } from '@/store/useWallet';
import { useDashboardPreferences } from '@/store/useDashboardPreferences';
import { usePaymentTransferStore } from '@/store/usePaymentTransferStore';

export function SettingsPageContent() {
  const { isConnected, publicKey, network, walletName } = useWallet();
  const { transfers, clearTransfers } = usePaymentTransferStore();
  const {
    inAppNotifications,
    emailNotifications,
    explorerPreference,
    density,
    themeTone,
    setInAppNotifications,
    setEmailNotifications,
    setExplorerPreference,
    setDensity,
    setThemeTone
  } = useDashboardPreferences();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <DashboardPanel
        title="Wallet & Network"
        description="Current wallet and Stellar network connection status."
        rightSlot={<Wallet className="h-4 w-4 text-[#1f6a3f]" />}
      >
        <div className="space-y-2 text-sm">
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Wallet Status</p>
            <p className="mt-1 font-medium text-[#183124]">{isConnected ? 'Connected' : 'Not connected'}</p>
          </div>
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Wallet Name</p>
            <p className="mt-1 font-medium text-[#183124]">{walletName || 'N/A'}</p>
          </div>
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Network</p>
            <p className="mt-1 font-medium text-[#183124]">{network || 'TESTNET'}</p>
          </div>
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="text-xs uppercase tracking-[0.08em] text-[#6a8376]">Address</p>
            <p className="mt-1 break-all font-mono text-xs text-[#183124]">{publicKey || 'Not connected'}</p>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Notification Preferences"
        description="Choose how dashboard updates should be shown."
        rightSlot={inAppNotifications ? <BellRing className="h-4 w-4 text-[#1f6a3f]" /> : <Bell className="h-4 w-4 text-[#6b8476]" />}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <span className="text-sm text-[#234435]">In-app notifications</span>
            <Button
              variant={inAppNotifications ? 'default' : 'outline'}
              size="sm"
              className={inAppNotifications ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
              onClick={() => setInAppNotifications(!inAppNotifications)}
            >
              {inAppNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <span className="text-sm text-[#234435]">Email notifications</span>
            <Button
              variant={emailNotifications ? 'default' : 'outline'}
              size="sm"
              className={emailNotifications ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              {emailNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Explorer & Density"
        description="UI-level preferences for links and spacing."
        rightSlot={<LayoutGrid className="h-4 w-4 text-[#1f6a3f]" />}
      >
        <div className="space-y-3">
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="mb-2 text-sm text-[#234435]">Preferred Explorer</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={explorerPreference === 'stellar-chain' ? 'default' : 'outline'}
                className={explorerPreference === 'stellar-chain' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setExplorerPreference('stellar-chain')}
              >
                <Globe2 className="mr-2 h-3.5 w-3.5" /> StellarChain
              </Button>
              <Button
                size="sm"
                variant={explorerPreference === 'stellar-expert' ? 'default' : 'outline'}
                className={explorerPreference === 'stellar-expert' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setExplorerPreference('stellar-expert')}
              >
                <Globe2 className="mr-2 h-3.5 w-3.5" /> StellarExpert
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="mb-2 text-sm text-[#234435]">Dashboard Density</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={density === 'comfortable' ? 'default' : 'outline'}
                className={density === 'comfortable' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setDensity('comfortable')}
              >
                Comfortable
              </Button>
              <Button
                size="sm"
                variant={density === 'compact' ? 'default' : 'outline'}
                className={density === 'compact' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setDensity('compact')}
              >
                Compact
              </Button>
            </div>
          </div>
        </div>
      </DashboardPanel>

      <DashboardPanel
        title="Theme & Local Data"
        description="UI theme tone and local dashboard records."
        rightSlot={themeTone === 'forest' ? <Sun className="h-4 w-4 text-[#1f6a3f]" /> : <MoonStar className="h-4 w-4 text-[#6b8476]" />}
      >
        <div className="space-y-3">
          <div className="rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <p className="mb-2 text-sm text-[#234435]">Theme Tone</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={themeTone === 'forest' ? 'default' : 'outline'}
                className={themeTone === 'forest' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setThemeTone('forest')}
              >
                Forest
              </Button>
              <Button
                size="sm"
                variant={themeTone === 'neutral' ? 'default' : 'outline'}
                className={themeTone === 'neutral' ? 'bg-[#1f6a3f] hover:bg-[#185736]' : ''}
                onClick={() => setThemeTone('neutral')}
              >
                Neutral
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-[#dce5de] bg-[#f8fbf8] p-3">
            <div className="text-sm text-[#234435]">
              <p className="font-medium">Local payment transfer records</p>
              <p className="text-xs text-[#5b7467]">{transfers.length} stored records</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearTransfers}>
              <Database className="mr-2 h-3.5 w-3.5" /> Clear
            </Button>
          </div>
        </div>
      </DashboardPanel>
    </div>
  );
}
