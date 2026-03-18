export type DashboardTransactionSource = 'escrow' | 'payment';

export type DashboardTransactionStatus =
  | 'created'
  | 'funded'
  | 'released'
  | 'refunded'
  | 'disputed'
  | 'success'
  | 'failed'
  | 'pending';

export interface DashboardKpiItem {
  id: string;
  label: string;
  value: string;
  helper?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface PaymentTransferInput {
  from: string;
  to: string;
  amount: number;
  currency: 'XLM';
  status: 'success' | 'failed' | 'pending';
  transactionHash?: string;
  createdAt: Date;
  memo?: string;
}

export interface PaymentTransferRecord extends PaymentTransferInput {
  id: string;
}

export interface UnifiedTransactionRow {
  id: string;
  source: DashboardTransactionSource;
  eventType: string;
  title: string;
  amount: number;
  currency: 'XLM' | 'USDC';
  status: DashboardTransactionStatus;
  timestamp: Date;
  counterparty?: string;
  referenceId?: string;
  transactionHash?: string;
  metadata?: string;
}

export type TransactionFilterType = 'all' | 'escrow' | 'payment';
export type TransactionFilterDateRange = 'all' | '7d' | '30d' | '90d';
export type TransactionSortBy = 'date' | 'amount' | 'status' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface DashboardTransactionFilterState {
  search: string;
  status: 'all' | DashboardTransactionStatus;
  type: TransactionFilterType;
  dateRange: TransactionFilterDateRange;
  sortBy: TransactionSortBy;
  sortOrder: SortOrder;
}

export type EscrowStatusFilter = 'all' | 'created' | 'funded' | 'released' | 'refunded' | 'disputed';
export type EscrowTypeFilter = 'all' | 'as-client' | 'as-freelancer';
export type EscrowSortBy = 'date' | 'amount' | 'status' | 'title';

export interface DashboardEscrowFilterState {
  search: string;
  status: EscrowStatusFilter;
  type: EscrowTypeFilter;
  sortBy: EscrowSortBy;
  sortOrder: SortOrder;
}

export interface DashboardPipelineStats {
  created: number;
  funded: number;
  released: number;
  refunded: number;
  disputed: number;
}

export interface DashboardRecentActivity {
  id: string;
  label: string;
  source: DashboardTransactionSource;
  status: DashboardTransactionStatus;
  amount: number;
  timestamp: Date;
}

export interface CreateEscrowDraft {
  projectTitle: string;
  freelancerAddress: string;
  amount: string;
  deadlineDays: number;
}

export interface EscrowCreatedPayload {
  id: string;
  title: string;
  freelancer: string;
  amount: number;
  deadlineDays: number;
  transactionHash?: string;
}
