/**
 * Stellar Wallet Utilities using StellarWalletsKit
 * Supports: Freighter, xBull, Albedo, LOBSTR, Rabet, Hana, Hot Wallet, Klever
 */

import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { Networks } from '@stellar/stellar-sdk';

// Initialize the kit with testnet by default
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
const networkPassphrase = NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

// Track initialization
let isInitialized = false;

/**
 * Initialize StellarWalletsKit if not already done
 */
const ensureInitialized = () => {
  if (!isInitialized) {
    StellarWalletsKit.init({
      modules: defaultModules(),
      network: networkPassphrase,
    });
    isInitialized = true;
    console.log('[Wallet] Kit initialized');
  }
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
 * Get wallet by ID
 */
export const getWalletById = (walletId: string): WalletInfo | undefined => {
  return SUPPORTED_WALLETS.find(w => w.id === walletId);
};

/**
 * Connect to a specific wallet
 * This directly connects without using the authModal
 */
export const connectWallet = async (walletId?: string): Promise<{
  publicKey: string;
  walletId: string;
  walletName: string;
}> => {
  try {
    console.log('[Wallet] Starting connection...', { walletId });
    
    if (!walletId) {
      throw new Error('No wallet selected');
    }

    // Ensure kit is initialized
    ensureInitialized();

    // Set the wallet using static method
    console.log('[Wallet] Setting wallet:', walletId);
    StellarWalletsKit.setWallet(walletId);

    // Get the module for this wallet
    const currentModule = StellarWalletsKit.selectedModule;
    console.log('[Wallet] Selected module:', currentModule?.productId);

    if (!currentModule) {
      throw new Error('Wallet module not found');
    }

    // Check if wallet is available
    const isAvailable = await currentModule.isAvailable();
    if (!isAvailable) {
      const wallet = getWalletById(walletId);
      throw new Error(`${wallet?.name} is not installed. Please install it first.`);
    }

    // Get the public key directly from the wallet
    console.log('[Wallet] Getting address...');
    const result = await currentModule.getAddress();
    console.log('[Wallet] Address result:', result);

    if (!result || !result.address) {
      throw new Error('Failed to get wallet address');
    }

    // Build wallet info from module properties
    const walletInfo = {
      id: currentModule.productId,
      name: currentModule.productName,
      iconUrl: currentModule.productIcon,
    };
    
    console.log('[Wallet] Connected:', walletInfo);

    return {
      publicKey: result.address,
      walletId: walletInfo.id,
      walletName: walletInfo.name,
    };
  } catch (error: any) {
    console.error('[Wallet] Connection error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    
    // Handle specific error types
    if (error.message?.includes('rejected') || 
        error.message?.includes('cancelled') ||
        error.message?.includes('closed') ||
        error.code === -1) {
      // User cancelled
      const userCancelledError = new Error('Wallet connection cancelled');
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
  }
};

/**
 * Get current wallet address
 */
export const getWalletAddress = async (): Promise<string | null> => {
  try {
    const result = await StellarWalletsKit.getAddress();
    return result.address || null;
  } catch (error: any) {
    // Don't log error if wallet not connected - this is expected
    if (error.code !== -1 && !error.message?.includes('No wallet')) {
      console.error('Error getting wallet address:', error);
    }
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
    const currentModule = StellarWalletsKit.selectedModule;
    const addressResult = await StellarWalletsKit.getAddress();

    if (!currentModule || !addressResult.address) {
      return null;
    }

    return {
      walletId: currentModule.productId,
      walletName: currentModule.productName,
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
 * Check if a specific wallet is installed
 */
export const isWalletInstalled = async (walletId: string): Promise<boolean> => {
  try {
    // Ensure kit is initialized
    ensureInitialized();
    
    try {
      // Try setting the wallet
      StellarWalletsKit.setWallet(walletId);
      const module = StellarWalletsKit.selectedModule;
      
      if (!module) {
        return false;
      }
      
      // Check if available
      const isInstalled = await module.isAvailable();
      return isInstalled;
    } catch (err: any) {
      // If setWallet throws or module unavailable
      return false;
    }
  } catch {
    // Silently fail - don't show error to user during installation check
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
