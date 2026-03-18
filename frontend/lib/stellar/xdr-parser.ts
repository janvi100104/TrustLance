/**
 * XDR Parser for Soroban Contract Data
 * Handles conversion from ScVal to TypeScript types
 * 
 * @see https://developers.stellar.org/docs/build/smart-contracts/getting-started/using-the-soroban-sdk
 */

import { xdr, scValToNative, Address } from '@stellar/stellar-sdk';

export interface ParsedEscrow {
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

/**
 * Parse Escrow struct from ScVal
 * 
 * The Soroban SDK serializes Rust structs into ScVal format.
 * This function converts it back to a TypeScript-friendly format.
 */
export function parseEscrowFromScVal(scVal: xdr.ScVal): ParsedEscrow {
  try {
    // Use scValToNative for automatic conversion (SDK v14+)
    const native = scValToNative(scVal);
    
    // Parse the escrow structure
    const escrow = native as any;
    
    return {
      id: parseBigInt(escrow.id),
      client: parseAddress(escrow.client),
      freelancer: parseAddress(escrow.freelancer),
      amount: parseBigInt(escrow.amount),
      token: escrow.token ? parseAddress(escrow.token) : null,
      status: parseEscrowStatus(escrow.status),
      deadline: parseBigInt(escrow.deadline),
      created_at: parseBigInt(escrow.created_at),
      metadata: escrow.metadata?.toString() || '',
    };
  } catch (error: any) {
    console.error('[XDR Parser] Failed to parse escrow from ScVal:', error);
    throw new Error(`XDR parsing failed: ${error.message}`);
  }
}

/**
 * Parse EscrowStatus enum from ScVal
 * 
 * Status enum values:
 * 0 = Created
 * 1 = Funded
 * 2 = Released
 * 3 = Refunded
 * 4 = Disputed
 */
export function parseEscrowStatus(
  value: xdr.ScVal | number | bigint | string | undefined | null
): ParsedEscrow['status'] {
  try {
    // Map numeric status to enum
    const statusMap: Record<number, ParsedEscrow['status']> = {
      0: 'Created',
      1: 'Funded',
      2: 'Released',
      3: 'Refunded',
      4: 'Disputed',
    };

    let statusVal = 0;
    if (value instanceof xdr.ScVal) {
      const nativeValue = scValToNative(value);
      statusVal = Number(parseBigInt(nativeValue));
    } else if (typeof value === 'bigint') {
      statusVal = Number(value);
    } else if (typeof value === 'number') {
      statusVal = value;
    } else if (typeof value === 'string') {
      statusVal = Number(value.replace(/n$/, ''));
    }

    const status = statusMap[statusVal] || 'Created';
    console.log('[XDR Parser] Parsed status:', status, 'from value:', statusVal);
    return status;
  } catch (error) {
    console.error('[XDR Parser] Failed to parse status:', error);
    return 'Created';
  }
}

/**
 * Parse Address from ScVal
 * 
 * Addresses in Soroban are represented as ScAddress
 */
export function parseAddress(value: unknown): string {
  try {
    if (typeof value === 'string') {
      return value;
    }

    if (value === undefined || value === null) {
      return '';
    }

    if (value instanceof Address) {
      return value.toString();
    }

    if (!(value instanceof xdr.ScVal)) {
      if (typeof (value as any)?.toString === 'function') {
        return (value as any).toString();
      }
      return '';
    }

    // Check if it's already a string (some SDK versions convert automatically)
    const nativeValue = scValToNative(value);
    if (typeof nativeValue === 'string' && nativeValue.startsWith('G')) {
      return nativeValue;
    }
    
    // Address is ScAddress - try to extract it
    if (value.switch().name === 'scvAddress') {
      const address = Address.fromScAddress(value.address());
      return address.toString();
    }
    
    // Try other possible formats
    if (nativeValue?.toString) {
      const str = nativeValue.toString();
      if (str.startsWith('G') && str.length === 56) {
        return str;
      }
    }
    
    console.warn('[XDR Parser] Could not parse address, got:', nativeValue);
    return '';
  } catch (error) {
    console.error('[XDR Parser] Failed to parse address:', error);
    return '';
  }
}

/**
 * Parse BigInt from various ScVal formats
 */
export function parseBigInt(value: any): bigint {
  try {
    if (value === undefined || value === null) {
      return BigInt(0);
    }
    
    // Already a BigInt
    if (typeof value === 'bigint') {
      return value;
    }
    
    // Number
    if (typeof value === 'number') {
      return BigInt(value);
    }
    
    // String
    if (typeof value === 'string') {
      // Handle potential bigint string format (e.g., "123n")
      const clean = value.replace(/n$/, '');
      return BigInt(clean);
    }
    
    // Object with value property (ScVal structure)
    if (value.value !== undefined) {
      if (typeof value.value === 'bigint') {
        return value.value;
      }
      if (typeof value.value === 'number') {
        return BigInt(value.value);
      }
      if (typeof value.value === 'string') {
        return BigInt(value.value.replace(/n$/, ''));
      }
    }
    
    // Object with hi/lo parts (64-bit integer representation)
    if (value.hi !== undefined && value.lo !== undefined) {
      return BigInt(value.hi) * BigInt(2 ** 32) + BigInt(value.lo);
    }
    
    // Try direct conversion
    return BigInt(value);
  } catch (error) {
    console.error('[XDR Parser] Failed to parse BigInt:', error, 'value:', value);
    return BigInt(0);
  }
}

/**
 * Parse u64 from ScVal
 */
export function parseU64(scVal: xdr.ScVal): bigint {
  try {
    const value = scValToNative(scVal);
    return parseBigInt(value);
  } catch (error) {
    console.error('[XDR Parser] Failed to parse u64:', error);
    return BigInt(0);
  }
}

/**
 * Parse i128 from ScVal (for amounts)
 * 
 * i128 in Soroban is represented as a struct with hi and lo parts
 */
export function parseI128(scVal: xdr.ScVal): bigint {
  try {
    const value = scValToNative(scVal);
    return parseBigInt(value);
  } catch (error) {
    console.error('[XDR Parser] Failed to parse i128:', error);
    return BigInt(0);
  }
}

/**
 * Parse optional value from ScVal
 */
export function parseOptional<T>(scVal: xdr.ScVal | undefined, parser: (val: xdr.ScVal) => T): T | null {
  if (!scVal) {
    return null;
  }
  
  try {
    const value = scValToNative(scVal);
    if (value === null || value === undefined) {
      return null;
    }
    return parser(scVal);
  } catch (error) {
    console.error('[XDR Parser] Failed to parse optional:', error);
    return null;
  }
}

/**
 * Parse String from ScVal
 */
export function parseString(scVal: xdr.ScVal): string {
  try {
    const value = scValToNative(scVal);
    return value?.toString() || '';
  } catch (error) {
    console.error('[XDR Parser] Failed to parse string:', error);
    return '';
  }
}
