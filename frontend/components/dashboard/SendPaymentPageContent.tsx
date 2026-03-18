'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimplePaymentForm } from '@/components/wallet/SimplePaymentForm';

export function SendPaymentPageContent() {
  return (
    <Card className="border-[#d8e0da] bg-white">
      <CardHeader>
        <CardTitle className="text-[#11291f]">Send XLM Payment</CardTitle>
        <CardDescription>Transfer funds to any Stellar address instantly.</CardDescription>
      </CardHeader>
      <CardContent>
        <SimplePaymentForm />
      </CardContent>
    </Card>
  );
}
