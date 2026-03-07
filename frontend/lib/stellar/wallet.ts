/**
 * Stellar Wallet Utilities using StellarWalletsKit
 * Supports: Freighter, xBull, Albedo, LOBSTR, Rabet, Hana, Hot Wallet, Klever, Ledger, Trezor
 */

import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@stellar/stellar-sdk';

// Initialize the kit with testnet by default
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
const networkPassphrase = NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

// Initialize StellarWalletsKit
let kit: StellarWalletsKit | null = null;

export const getKit = (): StellarWalletsKit => {
  if (!kit) {
    kit = new StellarWalletsKit();
    // Initialize with default modules (all supported wallets)
    StellarWalletsKit.init({ 
      modules: defaultModules(),
      network: networkPassphrase,
    });
  }
  return kit;
};

// Supported wallets configuration
export interface WalletInfo {
  id: string;
  name: string;
  iconUrl: string;
  description: string;
  installUrl?: string;
}

export const SUPPORTED_WALLETS: WalletInfo[] = [
  {
    id: 'freighter',
    name: 'Freighter',
    iconUrl: 'https://stellarwalletskit.dev/wallets/freighter.png',
    description: 'The most popular Stellar wallet browser extension',
    installUrl: 'https://www.freighter.app/',
  },
  {
    id: 'xbull',
    name: 'xBull',
    iconUrl: 'https://stellarwalletskit.dev/wallets/xbull.png',
    description: 'Multi-chain wallet with Stellar support',
    installUrl: 'https://xbull.app/',
  },
  {
    id: 'albedo',
    name: 'Albedo',
    iconUrl: 'https://stellarwalletskit.dev/wallets/albedo.png',
    description: 'Non-custodial smart wallet',
    installUrl: 'https://albedo.link/',
  },
  {
    id: 'lobstr',
    name: 'LOBSTR',
    iconUrl: 'https://stellarwalletskit.dev/wallets/lobstr.png',
    description: 'Mobile and web wallet for Stellar',
    installUrl: 'https://lobstr.co/',
  },
  {
    id: 'rabet',
    name: 'Rabet',
    iconUrl: 'https://stellarwalletskit.dev/wallets/rabet.png',
    description: 'Stellar wallet extension',
    installUrl: 'https://rabet.io/',
  },
  {
    id: 'hana',
    name: 'Hana',
    iconUrl: 'https://stellarwalletskit.dev/wallets/hana.png',
    description: 'Mobile wallet for Stellar',
    installUrl: 'https://hanawallet.io/',
  },
  {
    id: 'hotwallet',
    name: 'Hot Wallet',
    iconUrl: 'https://stellarwalletskit.dev/wallets/hotwallet.png',
    description: 'Web-based hot wallet',
  },
  {
    id: 'klever',
    name: 'Klever',
    iconUrl: 'https://stellarwalletskit.dev/wallets/klever.png',
    description: 'Multi-chain crypto wallet',
    installUrl: 'https://klever.io/',
  },
];

/**
 * Connect to a specific wallet using the auth modal
 * The modal will automatically show installed wallets first
 */
export const connectWallet = async (walletId?: string): Promise<{
  publicKey: string;
  walletId: string;
  walletName: string;
}> => {
  try {
    const kitInstance = getKit();

    // If walletId is provided, set it first using static method
    if (walletId) {
      StellarWalletsKit.setWallet(walletId);
    }

    // Show authentication modal to connect
    // This will show the wallet selection UI
    const result = await StellarWalletsKit.authModal();

    // Check if user closed the modal (result will be null/undefined)
    if (!result || !result.address) {
      // User closed the modal without selecting a wallet
      const cancelError = new Error('The user closed the modal.');
      (cancelError as any).code = 'MODAL_CLOSED';
      throw cancelError;
    }

    // Get the current wallet info from the active module
    const currentModule = kitInstance.selectedModule;
    
    if (!currentModule) {
      throw new Error('No wallet module selected');
    }

    const walletInfo = currentModule.getWalletInfo();

    return {
      publicKey: result.address,
      walletId: walletInfo.id,
      walletName: walletInfo.name,
    };
  } catch (error: any) {
    // Don't log modal close as an error - it's a normal user action
    if (error.code !== 'MODAL_CLOSED') {
      console.error('Error connecting wallet:', error);
    }

    // Handle specific error types
    if (error.code === 'MODAL_CLOSED' || 
        error.message?.includes('rejected') || 
        error.message?.includes('cancelled') ||
        error.message?.includes('closed')) {
      // Re-throw with proper code for UI handling
      const userCancelledError = new Error('The user closed the modal.');
      (userCancelledError as any).code = 'USER_CANCELLED';
      throw userCancelledError;
    }

    // Preserve original error message for debugging
    const wrappedError = new Error(error.message || 'Failed to connect wallet');
    (wrappedError as any).code = error.code || 'CONNECTION_FAILED';
    throw wrappedError;
  }
};

/**
 * Disconnect current wallet
 */
export const disconnectWallet = async (): Promise<void> => {
  try {
    await StellarWalletsKit.disconnect();
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
    // Continue with local state reset even if disconnect fails
  }
};

/**
 * Get current wallet address
 */
export const getWalletAddress = async (): Promise<string | null> => {
  try {
    const result = await StellarWalletsKit.getAddress();
    return result.address || null;
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
};

/**
 * Check if wallet is currently connected
 */
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    const address = await getWalletAddress();
    return !!address;
  } catch (error) {
    return false;
  }
};

/**
 * Get current wallet info
 */
export const getCurrentWalletInfo = async (): Promise<{
  walletId: string;
  walletName: string;
  publicKey: string;
} | null> => {
  try {
    const kitInstance = getKit();
    const currentModule = StellarWalletsKit.selectedModule;
    const addressResult = await StellarWalletsKit.getAddress();
    
    if (!currentModule || !addressResult.address) {
      return null;
    }

    const walletInfo = currentModule.getWalletInfo();

    return {
      walletId: walletInfo.id,
      walletName: walletInfo.name,
      publicKey: addressResult.address,
    };
  } catch (error) {
    console.error('Error getting current wallet info:', error);
    return null;
  }
};

/**
 * Sign a transaction with the connected wallet
 */
export const signTransaction = async (transactionXdr: string): Promise<string> => {
  try {
    const result = await StellarWalletsKit.signTransaction(transactionXdr);
    return result.signedTransactionXdr;
  } catch (error: any) {
    console.error('Error signing transaction:', error);
    
    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      throw new Error('Transaction was cancelled');
    }
    
    throw new Error(error.message || 'Failed to sign transaction');
  }
};

/**
 * Validate network configuration
 */
export const validateNetwork = async (): Promise<{
  isValid: boolean;
  currentNetwork?: string;
  expectedNetwork: string;
  warning?: string;
}> => {
  const expectedNetwork = NETWORK;
  
  try {
    const network = StellarWalletsKit.getNetwork();
    
    const networkMap: Record<string, string> = {
      [Networks.PUBLIC]: 'PUBLIC',
      [Networks.TESTNET]: 'TESTNET',
      [Networks.FUTURENET]: 'FUTURENET',
    };
    
    const currentNetwork = networkMap[network] || network;
    const normalizedExpected = networkMap[expectedNetwork] || expectedNetwork;
    
    const isValid = currentNetwork === normalizedExpected;
    
    if (!isValid) {
      return {
        isValid: false,
        currentNetwork: currentNetwork,
        expectedNetwork: normalizedExpected,
        warning: `Wallet is set to ${currentNetwork}, but expected ${normalizedExpected}. Please switch your wallet to the correct network.`,
      };
    }
    
    return {
      isValid: true,
      currentNetwork: currentNetwork,
      expectedNetwork: normalizedExpected,
    };
  } catch (error: any) {
    console.error('Error validating network:', error);
    return {
      isValid: false,
      expectedNetwork,
      warning: error.message || 'Could not verify network',
    };
  }
};

/**
 * Open wallet installation URL
 */
export const openInstallUrl = (walletId: string): void => {
  const wallet = SUPPORTED_WALLETS.find(w => w.id === walletId);
  if (wallet?.installUrl) {
    window.open(wallet.installUrl, '_blank');
  }
};

/**
 * Get wallet by ID
 */
export const getWalletById = (walletId: string): WalletInfo | undefined => {
  return SUPPORTED_WALLETS.find(w => w.id === walletId);
};

/**
 * Check if a specific wallet is installed
 * We'll use a simple approach: try to set the wallet and see if it works
 */
export const isWalletInstalled = async (walletId: string): Promise<boolean> => {
  try {
    // Try to set the wallet
    const currentModule = StellarWalletsKit.selectedModule;
    
    try {
      StellarWalletsKit.setWallet(walletId);
      const module = StellarWalletsKit.selectedModule;
      const isInstalled = await module.isInstalled();
      
      // Restore previous selection if different
      if (currentModule && currentModule.productId !== walletId) {
        // Don't restore, let user keep their choice
      }
      
      return isInstalled;
    } catch {
      return false;
    }
  } catch (error) {
    console.error(`Error checking if ${walletId} is installed:`, error);
    return false;
  }
};

/**
 * Check if any wallet is installed
 */
export const checkAnyWalletInstalled = async (): Promise<{ installed: boolean; walletId?: string }> => {
  try {
    // Try to get address - if it works, a wallet is connected
    const address = await getWalletAddress();
    if (address) {
      const info = await getCurrentWalletInfo();
      return { installed: true, walletId: info?.walletId };
    }
    return { installed: false };
  } catch (error) {
    return { installed: false };
  }
};

/**
 * Get all available wallets with their installation status
 */
export const getAvailableWallets = async (): Promise<
  Array<WalletInfo & { installed: boolean }>
> => {
  const wallets: Array<WalletInfo & { installed: boolean }> = [];
  
  for (const wallet of SUPPORTED_WALLETS) {
    const installed = await isWalletInstalled(wallet.id);
    wallets.push({
      ...wallet,
      installed,
    });
  }
  
  return wallets;
};
