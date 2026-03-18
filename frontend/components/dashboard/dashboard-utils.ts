export function getStatusColor(status: string) {
  switch (status) {
    case 'funded':
      return 'bg-sky-100 text-sky-700';
    case 'created':
      return 'bg-amber-100 text-amber-700';
    case 'released':
      return 'bg-emerald-100 text-emerald-700';
    case 'refunded':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

export const dashboardPageMeta: Record<string, { title: string; description: string }> = {
  '/dashboard': {
    title: 'Dashboard',
    description: 'An easy way to manage escrow contracts with care and precision.'
  },
  '/dashboard/escrow': {
    title: 'Escrow',
    description: 'Create and configure new escrow contracts.'
  },
  '/dashboard/escrow-contracts': {
    title: 'Escrow Contracts',
    description: 'Track and manage all escrow contracts from one place.'
  },
  '/dashboard/transactions': {
    title: 'Transaction History & Stats',
    description: 'Send and receive XLM while tracking complete transaction activity.'
  },
  '/dashboard/send-payment': {
    title: 'Transaction History & Stats',
    description: 'Send and receive XLM while tracking complete transaction activity.'
  },
  '/dashboard/settings': {
    title: 'Settings',
    description: 'Manage your dashboard preferences and account controls.'
  }
};
