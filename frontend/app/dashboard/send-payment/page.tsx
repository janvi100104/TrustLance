import { redirect } from 'next/navigation';

export default function DashboardSendPaymentPage() {
  redirect('/dashboard/transactions');
}
