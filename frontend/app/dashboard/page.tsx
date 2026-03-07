'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WalletButton } from '@/components/wallet/WalletButton';
import { BalanceCard } from '@/components/wallet/BalanceCard';
import { SimplePaymentForm } from '@/components/wallet/SimplePaymentForm';
import { CreateEscrowForm } from '@/components/escrow/CreateEscrowForm';
import { EscrowCard } from '@/components/escrow/EscrowCard';
import { useWallet } from '@/store/useWallet';
import { useEscrowStore } from '@/store/useEscrowStore';
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Plus,
  ArrowRight,
  Shield,
  Menu,
  X,
  Settings,
  CreditCard,
  FileText,
  Send,
  Inbox
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type DashboardTab = 'overview' | 'create-escrow' | 'send-payment' | 'escrows';

export default function DashboardPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedEscrow, setSelectedEscrow] = useState<{
    id: string;
    title: string;
    client: string;
    freelancer: string;
    amount: number;
    status: string;
    createdAt: string;
  } | null>(null);
  const { publicKey, balance, isConnected } = useWallet();
  const { escrows, getEscrowsByUser } = useEscrowStore();

  // Get user's escrows
  const userEscrows = isConnected && publicKey ? getEscrowsByUser(publicKey) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funded':
        return 'bg-blue-100 text-blue-700';
      case 'created':
        return 'bg-yellow-100 text-yellow-700';
      case 'released':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const stats = [
    {
      label: 'Active Escrows',
      value: userEscrows.filter(e => e.status === 'created' || e.status === 'funded').length.toString(),
      icon: LayoutDashboard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Balance',
      value: `${balance?.toFixed(2) || '0.00'} XLM`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Pending Payments',
      value: userEscrows.filter(e => e.status === 'funded').length.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      label: 'Completed',
      value: userEscrows.filter(e => e.status === 'released' || e.status === 'refunded').length.toString(),
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TrustLance
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-2">
              <Button 
                variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button 
                variant={activeTab === 'escrows' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('escrows')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Escrows
              </Button>
              <Button 
                variant={activeTab === 'send-payment' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setActiveTab('send-payment')}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Payment
              </Button>
              <WalletButton variant="nav" />
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col gap-2">
                <Button 
                  variant={activeTab === 'overview' ? 'default' : 'ghost'} 
                  className="justify-start"
                  onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <Button 
                  variant={activeTab === 'escrows' ? 'default' : 'ghost'} 
                  className="justify-start"
                  onClick={() => { setActiveTab('escrows'); setMobileMenuOpen(false); }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Escrows
                </Button>
                <Button 
                  variant={activeTab === 'send-payment' ? 'default' : 'ghost'} 
                  className="justify-start"
                  onClick={() => { setActiveTab('send-payment'); setMobileMenuOpen(false); }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Payment
                </Button>
                <WalletButton />
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'create-escrow' && 'Create Escrow'}
              {activeTab === 'send-payment' && 'Send Payment'}
              {activeTab === 'escrows' && 'Your Escrows'}
            </h1>
            <p className="text-slate-600">
              {isConnected
                ? `Connected: ${publicKey?.slice(0, 6)}...${publicKey?.slice(-4)}`
                : 'Connect your wallet to get started'}
            </p>
          </div>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => setActiveTab('create-escrow')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Escrow
          </Button>
        </div>

        {/* Stats Grid */}
        {activeTab === 'overview' && (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, index) => (
                <Card key={index} className="border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      </div>
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.bgColor)}>
                        <stat.icon className={cn('w-6 h-6', stat.color)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Recent Escrows */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Recent Escrows</CardTitle>
                        <CardDescription>Your active and recent escrow contracts</CardDescription>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveTab('escrows')}
                      >
                        View All
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {userEscrows.length > 0 ? (
                        userEscrows.slice(0, 3).map((escrow) => (
                          <div
                            key={escrow.id}
                            onClick={() => setSelectedEscrow({
                              id: escrow.id,
                              title: escrow.title,
                              client: escrow.client,
                              freelancer: escrow.freelancer,
                              amount: escrow.amount,
                              status: escrow.status,
                              createdAt: escrow.createdAt instanceof Date ? escrow.createdAt.toISOString().split('T')[0] : new Date(escrow.createdAt).toISOString().split('T')[0]
                            })}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {escrow.title[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{escrow.title}</p>
                                <p className="text-sm text-slate-600">{escrow.id} • {new Date(escrow.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-900">{escrow.amount} XLM</p>
                              <Badge className={getStatusColor(escrow.status)}>
                                {escrow.status}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                          <p className="text-slate-600">No escrows yet. Create your first one!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card className="border-slate-200 mb-6">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common tasks and shortcuts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('create-escrow')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Escrow
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('send-payment')}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Send Payment
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => setActiveTab('escrows')}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View All Escrows
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      disabled
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Payment History
                    </Button>
                  </CardContent>
                </Card>

                {/* Wallet Info */}
                <Card className="border-slate-200 bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="text-white">Your Wallet</CardTitle>
                    <CardDescription className="text-blue-100">
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isConnected ? (
                      <div>
                        <p className="text-3xl font-bold mb-2">
                          {balance?.toFixed(2) || '0.00'} XLM
                        </p>
                        <p className="text-sm text-blue-100 mb-4">
                          ≈ ${((balance || 0) * 0.12).toFixed(2)} USD
                        </p>
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full"
                          onClick={() => setActiveTab('send-payment')}
                        >
                          Send Payment
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-blue-100 mb-4">Connect your wallet to view balance</p>
                        <WalletButton />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Create Escrow Tab */}
        {activeTab === 'create-escrow' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Create New Escrow</CardTitle>
                <CardDescription>Set up a secure escrow for your freelance project</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateEscrowForm />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Send Payment Tab */}
        {activeTab === 'send-payment' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle>Send XLM Payment</CardTitle>
                <CardDescription>Transfer XLM to any Stellar address</CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePaymentForm />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Escrows Tab */}
        {activeTab === 'escrows' && (
          <div className="space-y-6">
            {userEscrows.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userEscrows.map((escrow) => (
                  <EscrowCard 
                    key={escrow.id} 
                    escrow={{
                      id: escrow.id,
                      title: escrow.title,
                      client: escrow.client,
                      freelancer: escrow.freelancer,
                      amount: escrow.amount,
                      currency: escrow.currency,
                      status: escrow.status as 'created' | 'funded' | 'released' | 'refunded',
                      contractAddress: escrow.contractAddress || '',
                      createdAt: escrow.createdAt
                    }} 
                  />
                ))}
              </div>
            ) : (
              <Card className="border-slate-200">
                <CardContent className="py-12 text-center">
                  <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No escrows yet</h3>
                  <p className="text-slate-600 mb-4">Create your first escrow to get started</p>
                  <Button onClick={() => setActiveTab('create-escrow')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Escrow
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Escrow Detail Dialog */}
      <Dialog open={!!selectedEscrow} onOpenChange={() => setSelectedEscrow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedEscrow?.title}</DialogTitle>
            <DialogDescription>
              Escrow ID: {selectedEscrow?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedEscrow && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-mono text-sm">{selectedEscrow.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Freelancer</p>
                  <p className="font-mono text-sm">{selectedEscrow.freelancer}</p>
                </div>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-bold">{selectedEscrow.amount} XLM</p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Status</p>
                <Badge className={getStatusColor(selectedEscrow.status)}>
                  {selectedEscrow.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">{selectedEscrow.createdAt}</p>
              </div>
              <Button onClick={() => setSelectedEscrow(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
