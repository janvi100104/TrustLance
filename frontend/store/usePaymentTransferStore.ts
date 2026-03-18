import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PaymentTransferInput, PaymentTransferRecord } from '@/types/dashboard';

interface PaymentTransferState {
  transfers: PaymentTransferRecord[];
  addTransfer: (transfer: PaymentTransferInput) => void;
  clearTransfers: () => void;
}

const customStorage = {
  getItem: (name: string) => {
    const raw = localStorage.getItem(name);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw, (_key, value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        '__type' in value &&
        'value' in value &&
        (value as { __type: string }).__type === 'date'
      ) {
        return new Date((value as { value: string }).value);
      }
      return value;
    });
  },
  setItem: (name: string, value: unknown) => {
    localStorage.setItem(
      name,
      JSON.stringify(value, (_key, val: unknown) => {
        if (val instanceof Date) {
          return { __type: 'date', value: val.toISOString() };
        }
        return val;
      })
    );
  },
  removeItem: (name: string) => localStorage.removeItem(name)
};

export const usePaymentTransferStore = create<PaymentTransferState>()(
  persist(
    (set) => ({
      transfers: [],

      addTransfer: (transfer) =>
        set((state) => ({
          transfers: [
            {
              ...transfer,
              id: transfer.transactionHash || `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            },
            ...state.transfers
          ]
        })),

      clearTransfers: () => set({ transfers: [] })
    }),
    {
      name: 'trustlance-payment-transfers',
      storage: createJSONStorage(() => customStorage)
    }
  )
);
