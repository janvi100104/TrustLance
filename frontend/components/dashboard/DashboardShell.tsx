'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/store/useWallet';
import { Button } from '@/components/ui/button';
import { WalletSelectorModal } from '@/components/wallet/WalletSelectorModal';
import { useDashboardPreferences } from '@/store/useDashboardPreferences';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  User,
  Wallet,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { dashboardPageMeta } from './dashboard-utils';

interface DashboardShellProps {
  children: ReactNode;
}

const menuLinks = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/escrow', label: 'Escrow', icon: Plus },
  { href: '/dashboard/escrow-contracts', label: 'Escrow Contracts', icon: CreditCard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Send }
];

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return localStorage.getItem('trustlance-sidebar-collapsed') === '1';
  });
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { publicKey, isConnected, walletName, connectWallet, disconnectWallet } = useWallet();
  const { density, themeTone } = useDashboardPreferences();

  const activeMeta = useMemo(() => dashboardPageMeta[pathname] || dashboardPageMeta['/dashboard'], [pathname]);
  const walletAddressLabel = isConnected && publicKey ? `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}` : 'Wallet not connected';
  const profileInitial = useMemo(
    () => (walletName?.[0] || publicKey?.[0] || 'U').toUpperCase(),
    [publicKey, walletName]
  );

  useEffect(() => {
    localStorage.setItem('trustlance-sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const handleWalletSelect = async (selectedWalletId: string) => {
    try {
      await connectWallet(selectedWalletId);
      setWalletSelectorOpen(false);
      toast.success('Wallet connected successfully');
    } catch {
      toast.error('Failed to connect wallet');
    }
  };

  const handleDisconnect = async () => {
    await disconnectWallet();
    toast.success('Wallet disconnected');
  };

  const handleChangeWallet = async () => {
    if (isConnected) {
      await disconnectWallet();
    }
    setWalletSelectorOpen(true);
  };

  return (
    <div
      className={cn(
        'min-h-screen',
        themeTone === 'forest' ? 'bg-[#ecefed]' : 'bg-[#eff0f1]',
        density === 'compact' ? 'p-3 md:p-4' : 'p-3 md:p-6',
        sidebarCollapsed ? 'lg:pl-[104px]' : 'lg:pl-[304px]'
      )}
    >
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-[#0f3a22] bg-[#0f3a22] p-4 text-white shadow-xl transition-all duration-300 lg:flex lg:flex-col',
          sidebarCollapsed ? 'lg:w-[92px]' : 'lg:w-[292px]',
          mobileMenuOpen ? 'w-[292px] block' : '',
          mobileMenuOpen ? 'block' : 'hidden lg:flex'
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden border-[#2f6047] bg-[#19452f] text-[#daf0df] hover:bg-[#23553b] lg:inline-flex"
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Link href="/" className="mb-6 flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c5e76f] text-[#10301f]">
            <Shield className="h-5 w-5" />
          </div>
          <div className={cn(sidebarCollapsed && 'hidden')}>
            <p className="text-sm text-[#dbefdf]">TrustLance</p>
            <p className="text-xs text-[#8eb6a0]">Escrow Workspace</p>
          </div>
        </Link>

        <p className={cn('mb-2 text-xs uppercase tracking-[0.12em] text-[#8eb6a0]', sidebarCollapsed && 'hidden')}>Menu</p>
        <div className="space-y-2">
          {menuLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'block w-full rounded-xl border px-3 py-2 text-left transition',
                  isActive
                    ? 'border-[#c7e97a] bg-[#c7e97a] text-[#10301f]'
                    : 'border-white/10 bg-white/0 text-[#bdd9c7] hover:bg-white/5'
                )}
              >
                <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
                  <link.icon className="h-4 w-4" />
                  <p className={cn('text-sm font-medium', sidebarCollapsed && 'hidden')}>{link.label}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <p className={cn('mb-2 mt-6 text-xs uppercase tracking-[0.12em] text-[#8eb6a0]', sidebarCollapsed && 'hidden')}>General</p>
        <Link
          href="/dashboard/settings"
          onClick={() => setMobileMenuOpen(false)}
          className={cn(
            'block w-full rounded-xl border px-3 py-2 text-left transition',
            pathname === '/dashboard/settings'
              ? 'border-[#c7e97a] bg-[#c7e97a] text-[#10301f]'
              : 'border-white/10 bg-white/0 text-[#bdd9c7] hover:bg-white/5'
          )}
        >
          <div className={cn('flex items-center gap-2', sidebarCollapsed && 'justify-center')}>
            <Settings className="h-4 w-4" />
            <p className={cn('text-sm font-medium', sidebarCollapsed && 'hidden')}>Settings</p>
          </div>
        </Link>

        <div className="mt-auto pt-5">
          <div className="rounded-xl border border-[#3f6f55] bg-[#18452e] p-3">
            <p className={cn('text-sm font-medium text-[#e5f4df]', sidebarCollapsed && 'hidden')}>User Profile</p>
            <p className={cn('mt-1 text-xs text-[#9fc2af]', sidebarCollapsed && 'hidden')}>{walletAddressLabel}</p>
            <div className="mt-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full border-[#345f49] bg-[#224f36] text-[#e7f4dc] hover:bg-[#2a5d41]',
                      sidebarCollapsed ? 'justify-center px-2' : 'justify-start'
                    )}
                  >
                    <User className={cn('h-4 w-4', !sidebarCollapsed && 'mr-2')} />
                    <span className={cn(sidebarCollapsed && 'hidden')}>Manage Wallet</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium">{isConnected ? (walletName || 'Wallet') : 'Not connected'}</p>
                    {isConnected && publicKey && (
                      <p className="text-xs font-mono text-muted-foreground">{walletAddressLabel}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isConnected ? (
                    <>
                      <DropdownMenuItem onClick={handleDisconnect}>
                        <LogOut className="mr-2 h-4 w-4" /> Disconnect Wallet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleChangeWallet}>
                        <Wallet className="mr-2 h-4 w-4" /> Change Wallet
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)}>
                      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          'mx-auto max-w-[1400px] rounded-[28px] border border-[#d6ddd8] bg-[#f8faf8] shadow-[0_18px_60px_rgba(18,43,24,0.08)]',
          density === 'compact' ? 'p-3 md:p-4' : 'p-4 md:p-6'
        )}
      >
        <div className="mb-4 rounded-2xl border border-[#dfe5e0] bg-white px-4 py-3 md:px-5">
          <div className="flex flex-wrap items-start gap-3 md:items-center">
            <div className="min-w-[220px]">
              <h1 className="text-2xl font-semibold text-[#10281d]">{activeMeta.title}</h1>
              <p className="mt-1 text-sm text-[#567061]">{activeMeta.description}</p>
            </div>

            <div className="min-w-[240px] flex-1 max-w-xl">
              <div className="flex items-center gap-2 rounded-xl border border-[#d7dfd9] bg-[#f8fbf8] px-3 py-2">
                <Search className="h-4 w-4 text-[#6f8b7c]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search escrow, transaction, wallet..."
                  className="w-full bg-transparent text-sm text-[#163325] outline-none placeholder:text-[#89a091]"
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-[#d7dfd9] bg-[#f8fbf8]"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4 text-[#5d7568]" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-[#d7dfd9] bg-[#f8fbf8] font-semibold text-[#1e3a2c] hover:bg-[#eef4ef]"
                    aria-label="User profile"
                  >
                    {profileInitial}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel>
                    <p className="text-xs text-muted-foreground">Connected Wallet</p>
                    <p className="text-sm font-medium">{isConnected ? (walletName || 'Wallet') : 'Not connected'}</p>
                    {isConnected && publicKey && (
                      <p className="text-xs font-mono text-muted-foreground">{walletAddressLabel}</p>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isConnected ? (
                    <>
                      <DropdownMenuItem onClick={handleDisconnect}>
                        <LogOut className="mr-2 h-4 w-4" /> Disconnect Wallet
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleChangeWallet}>
                        <Wallet className="mr-2 h-4 w-4" /> Change Wallet
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem onClick={() => setWalletSelectorOpen(true)}>
                      <Wallet className="mr-2 h-4 w-4" /> Connect Wallet
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle sidebar"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <main className="space-y-4">{children}</main>
      </div>

      <WalletSelectorModal
        open={walletSelectorOpen}
        onOpenChange={setWalletSelectorOpen}
        onWalletSelect={handleWalletSelect}
      />
    </div>
  );
}
