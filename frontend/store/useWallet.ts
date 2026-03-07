import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  connectWallet,
  disconnectWallet,
  getWalletAddress,
  isWalletConnected,
  getCurrentWalletInfo,
  validateNetwork,
  getWalletById,
  type WalletInfo,
} from '@/lib/stellar/wallet';

interface WalletState {
  publicKey: string | null;
  balance: number | null;
  isConnected: boolean;
  connecting: boolean;
  loading: boolean;
  network: string | null;
  walletId: string | null;
  walletName: string | null;
  error: string | null;
  connectWallet: (walletId?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  clearError: () => void;
  reconnectWallet: () => Promise<void>;
}

// Get the horizon URL from environment or default to testnet
const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const EXPECTED_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      publicKey: null,
      balance: null,
      isConnected: false,
      connecting: false,
      loading: false,
      network: null,
      walletId: null,
      walletName: null,
      error: null,

      clearError: () => set({ error: null }),

      reconnectWallet: async () => {
        try {
          const isConnected = await isWalletConnected();
          if (isConnected) {
            const walletInfo = await getCurrentWalletInfo();
            if (walletInfo) {
              const wallet = getWalletById(walletInfo.walletId);
              set({
                publicKey: walletInfo.publicKey,
                isConnected: true,
                walletId: walletInfo.walletId,
                walletName: wallet?.name || walletInfo.walletName,
                network: EXPECTED_NETWORK,
                error: null,
              });
              await get().fetchBalance();
            }
          }
        } catch (error) {
          console.error('Error reconnecting wallet:', error);
          set({
            publicKey: null,
            isConnected: false,
            walletId: null,
            walletName: null,
          });
        }
      },

      connectWallet: async (walletId?: string) => {
        set({ connecting: true, error: null });

        try {
          // Connect to wallet using StellarWalletsKit
          const result = await connectWallet(walletId);

          if (!result.publicKey) {
            const error = new Error('Failed to retrieve public key from wallet.');
            (error as any).code = 'WALLET_NO_PUBLIC_KEY';
            throw error;
          }

          // Validate network
          const networkValidation = await validateNetwork();

          if (networkValidation.warning) {
            console.warn(networkValidation.warning);
          }

          // Get wallet info
          const wallet = getWalletById(result.walletId);

          set({
            publicKey: result.publicKey,
            isConnected: true,
            walletId: result.walletId,
            walletName: wallet?.name || result.walletName,
            network: EXPECTED_NETWORK,
            error: null,
          });

          // Fetch balance after connecting
          await get().fetchBalance();

        } catch (error: any) {
          // Don't treat user cancellation as an error
          if (error.code === 'USER_CANCELLED' || error.code === 'MODAL_CLOSED') {
            // Just reset the connecting state, don't show an error
            set({ connecting: false, error: null });
            return;
          }

          console.error('Error connecting wallet:', error);

          // Reset connection state on error
          set({
            publicKey: null,
            isConnected: false,
            walletId: null,
            walletName: null,
            error: error.message || 'Failed to connect wallet',
          });

          // Re-throw for UI handling
          throw error;
        } finally {
          set({ connecting: false });
        }
      },

      disconnectWallet: async () => {
        try {
          await disconnectWallet();
        } catch (error) {
          console.error('Error disconnecting wallet:', error);
          // Continue with local state reset even if disconnect fails
        } finally {
          // Always reset local state completely
          set({
            publicKey: null,
            balance: null,
            isConnected: false,
            connecting: false,
            loading: false,
            network: null,
            walletId: null,
            walletName: null,
            error: null,
          });
        }
      },

      fetchBalance: async () => {
        const publicKey = get().publicKey;
        if (!publicKey) {
          console.warn('Cannot fetch balance: no public key available');
          return;
        }

        set({ loading: true });

        try {
          const response = await fetch(`${HORIZON_URL}/accounts/${publicKey}`);

          if (!response.ok) {
            if (response.status === 404) {
              // Account doesn't exist yet - needs to be funded
              set({ balance: 0, error: null, loading: false });
              return;
            }
            throw new Error(`Failed to fetch account: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();

          if (data && data.balances) {
            const xlmBalance = data.balances.find((balance: any) =>
              balance.asset_type === 'native'
            );

            if (xlmBalance) {
              set({ balance: parseFloat(xlmBalance.balance), error: null });
            } else {
              set({ balance: 0, error: null });
            }
          } else {
            set({ balance: null });
          }
        } catch (error: any) {
          console.error('Error fetching balance:', error);
          set({
            balance: null,
            error: `Failed to fetch balance: ${error.message}`
          });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'trustlance-wallet',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist these fields
        publicKey: state.publicKey,
        walletId: state.walletId,
        walletName: state.walletName,
        isConnected: state.isConnected,
        network: state.network,
      }),
      onRehydrateStorage: () => (state) => {
        // Reconnect wallet on app load
        if (state?.isConnected) {
          state.reconnectWallet();
        }
      },
    }
  )
);
