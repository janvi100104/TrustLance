/**
 * Stellar Soroban Contract Interaction Utilities
 * Handles calling escrow contract functions with real RPC calls
 */

import {
  rpc,
  SorobanDataBuilder,
  Networks,
  Contract,
  StrKey,
  Address,
  Asset,
  nativeToScVal,
  TransactionBuilder,
  Transaction,
  BASE_FEE,
  xdr,
  Operation,
} from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';
import { parseEscrowFromScVal, parseEscrowStatus, parseU64 } from './xdr-parser';

// Contract configuration
const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'TESTNET';
const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

// Escrow contract ID
export const ESCROW_CONTRACT_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || '';

// Initialize Soroban RPC client - using rpc namespace (SDK v14+)
const server = new rpc.Server(SOROBAN_RPC_URL);

// Contract types
export interface EscrowData {
  id: bigint;
  client: string;
  freelancer: string;
  amount: bigint;
  token: string | null;
  status: 'Created' | 'Funded' | 'Released' | 'Refunded' | 'Disputed';
  deadline: bigint;
  created_at: bigint;
  metadata: string;
}

export interface EscrowInitializationParams {
  freelancerAddress: string;
  amount: bigint;
  deadline: bigint;
  metadata: string;
}

export interface ContractCallResult {
  success: boolean;
  transactionHash?: string;
  result?: any;
  error?: string;
  errorCode?: string;
}

/**
 * Get contract instance
 */
export function getEscrowContract(contractId?: string): Contract {
  const id = contractId || ESCROW_CONTRACT_ID;

  if (!id) {
    throw new Error('Escrow contract ID not configured. Please set NEXT_PUBLIC_ESCROW_CONTRACT_ID in .env.local');
  }

  if (!StrKey.isValidContract(id)) {
    throw new Error('Invalid contract ID');
  }

  return new Contract(id);
}

/**
 * Convert numeric contract IDs to explicit Soroban u64 ScVal.
 */
function toU64ScVal(value: bigint | number | string): xdr.ScVal {
  return nativeToScVal(value, { type: 'u64' });
}

/**
 * Convert amounts to explicit Soroban i128 ScVal.
 */
function toI128ScVal(value: bigint | number | string): xdr.ScVal {
  return nativeToScVal(value, { type: 'i128' });
}

/**
 * Helper to build and submit Soroban transaction using SDK v14+ patterns
 */
async function buildAndSubmitTransaction(
  contract: Contract,
  method: string,
  args: any[],
  publicKey: string
): Promise<{ hash: string; result?: any }> {
  try {
    console.log('[Contract] Building transaction for method:', method);
    // Use custom JSON stringify replacer to handle BigInt
    console.log('[Contract] Args:', JSON.stringify(args, (key, value) =>
      typeof value === 'bigint' ? value.toString() + 'n' : value
    ));

    // Get account from network
    const account = await server.getAccount(publicKey);
    console.log('[Contract] Account fetched:', account.accountId());

    // Contract.call() expects xdr.ScVal args; normalize native values.
    const operation = contract.call(method, ...args.map(arg => nativeToScVal(arg)));

    console.log('[Contract] Operation built');

    // Build transaction
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: {
        minTime: 0,
        maxTime: Math.floor(Date.now() / 1000) + 30,
      },
    })
      .addOperation(operation)
      .build();

    console.log('[Contract] Transaction built, simulating...');

    // Simulate transaction first to get soroban data
    const simulatedTx = await server.simulateTransaction(tx);
    console.log('[Contract] Simulation complete');

    // Check for simulation error
    if ('error' in simulatedTx && simulatedTx.error) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulatedTx.error)}`);
    }

    // Extract soroban data from simulation result
    const simResponse = simulatedTx as any;
    if (!simResponse.results || !simResponse.results[0]) {
      throw new Error('Simulation returned no results');
    }

    const sorobanData = simResponse.resultData?.sorobanData
      ? new SorobanDataBuilder(simResponse.resultData.sorobanData).build()
      : undefined;

    console.log('[Contract] Soroban data extracted, building final transaction...');

    // Build final transaction with soroban data
    const finalTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: {
        minTime: 0,
        maxTime: Math.floor(Date.now() / 1000) + 30,
      },
      sorobanData,
    })
      .addOperation(operation)
      .build();

    console.log('[Contract] Final transaction built');

    // Sign with Freighter
    const signedTx = await freighter.signTransaction(finalTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    console.log('[Contract] Transaction signed');

    // Parse signed transaction
    const signedTxXDR = typeof signedTx === 'string' ? signedTx : signedTx.signedTxXdr;
    const parsedTx = TransactionBuilder.fromXDR(signedTxXDR, NETWORK_PASSPHRASE) as Transaction;

    // Submit transaction
    console.log('[Contract] Submitting transaction...');
    const sendResponse = await server.sendTransaction(parsedTx);
    console.log('[Contract] Transaction submitted:', sendResponse.hash);

    if (sendResponse.status !== 'PENDING') {
      throw new Error(`Transaction submission failed: ${sendResponse.status}`);
    }

    // Wait for transaction completion
    console.log('[Contract] Waiting for confirmation...');
    let txResponse = await server.getTransaction(sendResponse.hash);

    // Poll until transaction is complete
    while (txResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      txResponse = await server.getTransaction(sendResponse.hash);
    }

    console.log('[Contract] Transaction confirmed:', txResponse.status);

    if (txResponse.status === 'FAILED') {
      const errorCode = 'result' in txResponse ? (txResponse.result as any)?.code : 'Unknown error';
      throw new Error(`Transaction failed: ${errorCode || 'Unknown error'}`);
    }

    // Get result
    const returnValue = txResponse.returnValue;
    console.log('[Contract] Return value:', returnValue);

    return {
      hash: sendResponse.hash,
      result: returnValue,
    };
  } catch (error: any) {
    console.error('[Contract] Transaction error:', error);
    throw error;
  }
}

/**
 * Initialize a new escrow
 * @param params - Escrow initialization parameters
 * @returns Contract call result with escrow ID
 */
export async function initializeEscrow(
  params: EscrowInitializationParams
): Promise<ContractCallResult> {
  try {
    const { freelancerAddress, amount, deadline, metadata } = params;

    // Validate freelancer address
    if (!StrKey.isValidEd25519PublicKey(freelancerAddress)) {
      return {
        success: false,
        error: 'Invalid freelancer address',
        errorCode: 'INVALID_ADDRESS',
      };
    }

    // Validate amount
    if (amount <= BigInt(0)) {
      return {
        success: false,
        error: 'Amount must be positive',
        errorCode: 'INVALID_AMOUNT',
      };
    }

    // Validate deadline
    const now = Math.floor(Date.now() / 1000);
    if (deadline <= BigInt(now)) {
      return {
        success: false,
        error: 'Deadline must be in the future',
        errorCode: 'INVALID_DEADLINE',
      };
    }

    // Check if contract is deployed
    if (!ESCROW_CONTRACT_ID) {
      return {
        success: false,
        error: 'Contract not deployed. Please deploy the escrow contract first.',
        errorCode: 'CONTRACT_NOT_DEPLOYED',
      };
    }

    // Get wallet address
    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    // Build and submit real Soroban transaction
    // Pass Address objects - SDK v14.5.0 requires proper types
    const txResult = await buildAndSubmitTransaction(
      contract,
      'initialize',
      [
        new Address(publicKey),
        new Address(freelancerAddress),
        toI128ScVal(amount),
        toU64ScVal(deadline),
        metadata, // String
      ],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,
    };

  } catch (error: any) {
    console.error('Initialize escrow failed:', error);

    // Handle specific error types
    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction cancelled by user',
        errorCode: 'USER_CANCELLED',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to initialize escrow',
      errorCode: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Fund an escrow with REAL XLM payment
 * Uses Payment operation to transfer XLM to contract, then calls fund()
 * 
 * @param escrowId - Escrow ID to fund
 * @param amount - Amount to fund (in stroops)
 * @returns Contract call result
 */
export async function fundEscrow(
  escrowId: bigint,
  amount: bigint
): Promise<ContractCallResult> {
  return fundEscrowWithPayment(escrowId, amount);
}

/**
 * Fund escrow with XLM payment (REAL implementation)
 * Uses invokeHostFunctionOperation to transfer XLM to contract
 * 
 * Transaction includes:
 * 1. Payment operation (transfer XLM to contract)
 * 2. Contract call (fund function)
 */
export async function fundEscrowWithPayment(
  escrowId: bigint,
  amount: bigint
): Promise<ContractCallResult> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return {
        success: false,
        error: 'Contract not deployed',
        errorCode: 'CONTRACT_NOT_DEPLOYED',
      };
    }

    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    console.log('[Contract] Building fund transaction with payment...');
    console.log('[Contract] Escrow ID:', escrowId.toString());
    console.log('[Contract] Amount:', amount.toString(), 'stroops');
    console.log('[Contract] Contract ID:', ESCROW_CONTRACT_ID);

    // Step 1: Build the fund operation
    const fundOp = contract.call('fund', toU64ScVal(escrowId));

    // Step 2: Build payment operation (transfer XLM to contract)
    // Validate contract ID first
    if (!StrKey.isValidContract(ESCROW_CONTRACT_ID)) {
      throw new Error(`Invalid contract ID: ${ESCROW_CONTRACT_ID}`);
    }

    // For native XLM, we use Operation.payment()
    const paymentOp = Operation.payment({
      destination: ESCROW_CONTRACT_ID,
      asset: Asset.native(),
      amount: amount.toString(),
    });

    // Step 3: Get account
    const account = await server.getAccount(publicKey);

    // Step 4: Build transaction with BOTH operations
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: {
        minTime: 0,
        maxTime: Math.floor(Date.now() / 1000) + 30,
      },
    })
      .addOperation(paymentOp) // Payment operation first
      .addOperation(fundOp) // Contract call second
      .build();

    console.log('[Contract] Transaction built, simulating...');

    // Step 5: Simulate to get soroban data
    const simulatedTx = await server.simulateTransaction(tx);
    
    if ('error' in simulatedTx && simulatedTx.error) {
      throw new Error(`Simulation failed: ${JSON.stringify(simulatedTx.error)}`);
    }

    const simResponse = simulatedTx as any;
    const sorobanData = simResponse.resultData?.sorobanData
      ? new SorobanDataBuilder(simResponse.resultData.sorobanData).build()
      : undefined;

    console.log('[Contract] Simulation complete, building final transaction...');

    // Step 6: Build final transaction with soroban data
    const finalTx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
      timebounds: {
        minTime: 0,
        maxTime: Math.floor(Date.now() / 1000) + 30,
      },
      sorobanData,
    })
      .addOperation(paymentOp)
      .addOperation(fundOp)
      .build();

    console.log('[Contract] Final transaction built, signing with Freighter...');

    // Step 7: Sign with Freighter
    const signedTx = await freighter.signTransaction(finalTx.toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const signedTxXDR = typeof signedTx === 'string' ? signedTx : signedTx.signedTxXdr;
    const parsedTx = TransactionBuilder.fromXDR(signedTxXDR, NETWORK_PASSPHRASE) as Transaction;

    // Step 8: Submit transaction
    console.log('[Contract] Submitting transaction...');
    const sendResponse = await server.sendTransaction(parsedTx);

    if (sendResponse.status !== 'PENDING') {
      throw new Error(`Transaction submission failed: ${sendResponse.status}`);
    }

    console.log('[Contract] Transaction submitted, hash:', sendResponse.hash);

    // Step 9: Wait for confirmation
    console.log('[Contract] Waiting for confirmation...');
    let txResponse = await server.getTransaction(sendResponse.hash);
    while (txResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      txResponse = await server.getTransaction(sendResponse.hash);
    }

    console.log('[Contract] Transaction confirmed:', txResponse.status);

    if (txResponse.status === 'FAILED') {
      const errorCode = 'result' in txResponse ? (txResponse.result as any)?.code : 'Unknown error';
      throw new Error(`Transaction failed: ${errorCode || 'Unknown error'}`);
    }

    return {
      success: true,
      transactionHash: sendResponse.hash,
      result: txResponse.returnValue,
    };
  } catch (error: any) {
    console.error('Fund escrow with payment failed:', error);

    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction cancelled by user',
        errorCode: 'USER_CANCELLED',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to fund escrow',
      errorCode: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Release payment from escrow
 * @param escrowId - Escrow ID
 * @returns Contract call result
 */
export async function releasePayment(escrowId: bigint): Promise<ContractCallResult> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return {
        success: false,
        error: 'Contract not deployed',
        errorCode: 'CONTRACT_NOT_DEPLOYED',
      };
    }

    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    const txResult = await buildAndSubmitTransaction(
      contract,
      'release_payment',
      [toU64ScVal(escrowId)],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,
    };
  } catch (error: any) {
    console.error('Release payment failed:', error);
    
    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction cancelled by user',
        errorCode: 'USER_CANCELLED',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to release payment',
      errorCode: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Request revision for escrow
 * @param escrowId - Escrow ID
 * @param note - Revision note
 * @returns Contract call result
 */
export async function requestRevision(
  escrowId: bigint,
  note: string
): Promise<ContractCallResult> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return {
        success: false,
        error: 'Contract not deployed',
        errorCode: 'CONTRACT_NOT_DEPLOYED',
      };
    }

    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    const txResult = await buildAndSubmitTransaction(
      contract,
      'request_revision',
      [toU64ScVal(escrowId), note],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,
    };
  } catch (error: any) {
    console.error('Request revision failed:', error);
    
    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction cancelled by user',
        errorCode: 'USER_CANCELLED',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to request revision',
      errorCode: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Refund escrow after deadline
 * @param escrowId - Escrow ID
 * @returns Contract call result
 */
export async function refundEscrow(escrowId: bigint): Promise<ContractCallResult> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return {
        success: false,
        error: 'Contract not deployed',
        errorCode: 'CONTRACT_NOT_DEPLOYED',
      };
    }

    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    const txResult = await buildAndSubmitTransaction(
      contract,
      'refund',
      [toU64ScVal(escrowId)],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,
    };
  } catch (error: any) {
    console.error('Refund escrow failed:', error);
    
    if (error.message?.includes('rejected') || error.message?.includes('cancelled')) {
      return {
        success: false,
        error: 'Transaction cancelled by user',
        errorCode: 'USER_CANCELLED',
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to refund escrow',
      errorCode: error.code || 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Get escrow details from contract (REAL implementation with XDR parsing)
 * @param escrowId - Escrow ID
 * @returns Escrow data or null
 */
export async function getEscrowDetails(escrowId: bigint): Promise<EscrowData | null> {
  if (!ESCROW_CONTRACT_ID) {
    throw new Error('Contract not deployed');
  }

  const contract = getEscrowContract();

  try {
    console.log('[Contract] Fetching escrow details for ID:', escrowId.toString());
    
    // Use simulateTransaction for read-only calls
    const tx = new TransactionBuilder(
      await server.getAccount(ESCROW_CONTRACT_ID),
      {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call('get_escrow', toU64ScVal(escrowId)))
      .setTimeout(30)
      .build();

    const response = await server.simulateTransaction(tx);

    // Check for simulation error (SDK v14+ uses different structure)
    if ('error' in response && response.error) {
      console.error('Get escrow simulation error:', response.error);
      return null;
    }

    // Access results using type assertion (SDK v14+ union type workaround)
    const simResponse = response as any;
    if (simResponse.results && simResponse.results[0]) {
      const result = simResponse.results[0].xdr as string;
      // Parse the XDR result
      const xdrResult = xdr.ScVal.fromXDR(result, 'base64');

      // Parse using XDR parser (REAL data from contract)
      const parsedEscrow = parseEscrowFromScVal(xdrResult);
      
      console.log('[Contract] Parsed escrow:', parsedEscrow);

      // Convert to EscrowData interface
      return {
        id: parsedEscrow.id,
        client: parsedEscrow.client,
        freelancer: parsedEscrow.freelancer,
        amount: parsedEscrow.amount,
        token: parsedEscrow.token,
        status: parsedEscrow.status,
        deadline: parsedEscrow.deadline,
        created_at: parsedEscrow.created_at,
        metadata: parsedEscrow.metadata,
      };
    }

    console.warn('[Contract] No escrow data found for ID:', escrowId.toString());
    return null;
  } catch (error: any) {
    console.error('Get escrow details failed:', error);
    return null;
  }
}

/**
 * Get escrow status (REAL implementation with XDR parsing)
 * @param escrowId - Escrow ID
 * @returns Escrow status or null
 */
export async function getEscrowStatus(
  escrowId: bigint
): Promise<'Created' | 'Funded' | 'Released' | 'Refunded' | 'Disputed' | null> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return null;
    }

    const contract = getEscrowContract();

    console.log('[Contract] Fetching escrow status for ID:', escrowId.toString());

    const tx = new TransactionBuilder(
      await server.getAccount(ESCROW_CONTRACT_ID),
      {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call('get_status', toU64ScVal(escrowId)))
      .setTimeout(30)
      .build();

    const response = await server.simulateTransaction(tx);

    if (('error' in response && response.error) || !('results' in response) || !response.results) {
      return null;
    }

    // Parse status from result using XDR parser
    const simResponse = response as any;
    const result = simResponse.results[0].xdr as string;
    const xdrResult = xdr.ScVal.fromXDR(result, 'base64');

    // Use real XDR parser
    const status = parseEscrowStatus(xdrResult);
    console.log('[Contract] Parsed status:', status);
    return status;
  } catch (error: any) {
    console.error('Get escrow status failed:', error);
    return null;
  }
}

/**
 * Get total escrow count (REAL implementation with XDR parsing)
 * @returns Total number of escrows
 */
export async function getEscrowCount(): Promise<bigint> {
  try {
    if (!ESCROW_CONTRACT_ID) {
      return BigInt(0);
    }

    const contract = getEscrowContract();

    console.log('[Contract] Fetching escrow count');

    const tx = new TransactionBuilder(
      await server.getAccount(ESCROW_CONTRACT_ID),
      {
        fee: BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      }
    )
      .addOperation(contract.call('get_escrow_count'))
      .setTimeout(30)
      .build();

    const response = await server.simulateTransaction(tx);

    if (('error' in response && response.error) || !('results' in response) || !response.results) {
      console.warn('[Contract] No escrow count returned');
      return BigInt(0);
    }

    // Parse u64 from result using XDR parser
    const simResponse = response as any;
    const result = simResponse.results[0].xdr as string;
    const xdrResult = xdr.ScVal.fromXDR(result, 'base64');

    // Use real XDR parser
    const count = parseU64(xdrResult);
    console.log('[Contract] Escrow count:', count.toString());
    return count;
  } catch (error: any) {
    console.error('Get escrow count failed:', error);
    return BigInt(0);
  }
}

/**
 * Format contract address for display
 */
export function formatContractAddress(address: string, length: number = 8): string {
  if (!address || address.length <= length * 2) {
    return address;
  }
  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

/**
 * Get Stellar expert contract URL
 */
export function getStellarExpertContractUrl(contractId: string, network: string = NETWORK): string {
  if (network.toUpperCase() === 'PUBLIC') {
    return `https://stellarexpert.net/contract/${contractId}`;
  }
  return `https://stellar.expert/explorer/testnet/contract/${contractId}`;
}

/**
 * Parse deadline timestamp to human-readable format
 */
export function formatDeadline(deadline: bigint | number): string {
  const date = new Date(Number(deadline) * 1000);
  return date.toLocaleString();
}

/**
 * Convert XLM to stroops (1 XLM = 10,000,000 stroops)
 */
export function xlmToStroops(xlm: number): bigint {
  return BigInt(Math.floor(xlm * 10_000_000));
}

/**
 * Convert stroops to XLM
 */
export function stroopsToXlm(stroops: bigint): number {
  return Number(stroops) / 10_000_000;
}

/**
 * Test function - calls simple test contract
 */
export async function testSimpleContract(): Promise<ContractCallResult> {
  try {
    const addressResult = await freighter.getAddress();
    if (addressResult.error) {
      return {
        success: false,
        error: 'Wallet not connected',
        errorCode: 'WALLET_NOT_CONNECTED',
      };
    }

    const publicKey = addressResult.address!;
    const contract = getEscrowContract();

    const txResult = await buildAndSubmitTransaction(
      contract,
      'initialize',
      [
        new Address(publicKey),
        new Address(publicKey),
      ],
      publicKey
    );

    return {
      success: true,
      transactionHash: txResult.hash,
      result: txResult.result,
    };
  } catch (error: any) {
    console.error('Test contract failed:', error);
    return {
      success: false,
      error: error.message || 'Test failed',
      errorCode: 'TEST_ERROR',
    };
  }
}
