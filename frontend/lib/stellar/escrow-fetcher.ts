/**
 * Escrow Fetcher - Fetch escrows from contract events
 * 
 * Uses Soroban RPC getEvents method to fetch escrow-related events
 * and reconstruct user's escrow history from the blockchain.
 */

import { rpc, Networks, scValToNative } from '@stellar/stellar-sdk';
import { parseAddress, parseBigInt } from './xdr-parser';

const SOROBAN_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;
const ESCROW_CONTRACT_ID = process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID || '';

export interface EscrowEvent {
  escrowId: bigint;
  eventType: 'EscrowCreated' | 'EscrowFunded' | 'PaymentReleased' | 'Refund' | 'Dispute' | 'RevisionRequested';
  ledger: number;
  ledgerTimestamp: string;
  transactionHash: string;
  data: any;
}

export interface UserEscrow {
  escrowId: bigint;
  role: 'client' | 'freelancer';
  status: 'Created' | 'Funded' | 'Released' | 'Refunded' | 'Disputed';
  client: string;
  freelancer: string;
  amount: bigint;
  createdAt: number;
}

/**
 * Fetch escrow events for a contract
 */
export async function fetchEscrowEvents(
  contractId: string = ESCROW_CONTRACT_ID,
  startLedger?: number
): Promise<EscrowEvent[]> {
  if (!contractId) {
    console.warn('[Escrow Fetcher] Contract ID not configured');
    return [];
  }

  const server = new rpc.Server(SOROBAN_RPC_URL);

  try {
    console.log('[Escrow Fetcher] Fetching events for contract:', contractId);
    
    // Get events using getEvents RPC method
    const response = await server.getEvents({
      startLedger: startLedger || 1,
      filters: [
        {
          type: 'contract',
          contractIds: [contractId],
        },
      ],
      limit: 100,
    });

    console.log('[Escrow Fetcher] Raw events:', response.events.length);

    // Parse events
    const events: EscrowEvent[] = response.events.map(event => {
      // Extract event type from topic
      const topic = event.topic?.[0];
      let eventType: EscrowEvent['eventType'] = 'EscrowCreated';
      
      if (topic) {
        const topicStr = String(scValToNative(topic));
        if (topicStr.includes('EscrowCreated')) eventType = 'EscrowCreated';
        else if (topicStr.includes('EscrowFunded')) eventType = 'EscrowFunded';
        else if (topicStr.includes('PaymentReleased')) eventType = 'PaymentReleased';
        else if (topicStr.includes('Refund')) eventType = 'Refund';
        else if (topicStr.includes('Dispute')) eventType = 'Dispute';
        else if (topicStr.includes('RevisionRequested')) eventType = 'RevisionRequested';
      }

      const eventData = scValToNative(event.value) as any;

      // Extract escrow ID from event data
      const escrowId = parseBigInt(
        eventData?.escrow_id ??
        eventData?.escrowId ??
        eventData?.id
      );
      
      return {
        escrowId,
        eventType,
        ledger: event.ledger,
        ledgerTimestamp: event.ledgerClosedAt,
        transactionHash: event.txHash,
        data: eventData,
      };
    });

    console.log('[Escrow Fetcher] Parsed events:', events.length);
    return events;
  } catch (error: any) {
    console.error('[Escrow Fetcher] Failed to fetch events:', error);
    
    // Handle case where getEvents is not supported
    if (error.message?.includes('method not found') || 
        error.message?.includes('unknown method')) {
      console.warn('[Escrow Fetcher] getEvents not supported by this RPC endpoint');
    }
    
    return [];
  }
}

/**
 * Get all escrows for a specific user by analyzing contract events
 */
export async function getEscrowsByUser(
  userAddress: string,
  contractId: string = ESCROW_CONTRACT_ID
): Promise<UserEscrow[]> {
  if (!contractId) {
    console.warn('[Escrow Fetcher] Contract ID not configured');
    return [];
  }

  console.log('[Escrow Fetcher] Getting escrows for user:', userAddress);

  const events = await fetchEscrowEvents(contractId);
  
  if (events.length === 0) {
    console.log('[Escrow Fetcher] No events found');
    return [];
  }
  
  // Group events by escrow ID
  const escrowMap = new Map<bigint, UserEscrow>();
  
  for (const event of events) {
    if (event.eventType === 'EscrowCreated') {
      const client = parseAddress(event.data?.client);
      const freelancer = parseAddress(event.data?.freelancer);
      const amount = parseBigInt(event.data?.amount);
      
      const isClient = client === userAddress;
      const isFreelancer = freelancer === userAddress;
      
      if (isClient || isFreelancer) {
        escrowMap.set(event.escrowId, {
          escrowId: event.escrowId,
          role: isClient ? 'client' : 'freelancer',
          status: 'Created',
          client,
          freelancer,
          amount,
          createdAt: Math.floor(new Date(event.ledgerTimestamp).getTime() / 1000),
        });
      }
    } else if (event.eventType === 'EscrowFunded') {
      const escrow = escrowMap.get(event.escrowId);
      if (escrow) {
        escrow.status = 'Funded';
      }
    } else if (event.eventType === 'PaymentReleased') {
      const escrow = escrowMap.get(event.escrowId);
      if (escrow) {
        escrow.status = 'Released';
      }
    } else if (event.eventType === 'Refund') {
      const escrow = escrowMap.get(event.escrowId);
      if (escrow) {
        escrow.status = 'Refunded';
      }
    } else if (event.eventType === 'Dispute') {
      const escrow = escrowMap.get(event.escrowId);
      if (escrow) {
        escrow.status = 'Disputed';
      }
    }
  }
  
  const userEscrows = Array.from(escrowMap.values());
  console.log('[Escrow Fetcher] Found', userEscrows.length, 'escrows for user');
  return userEscrows;
}

/**
 * Get a single escrow by ID from events
 */
export async function getEscrowById(
  escrowId: bigint,
  contractId: string = ESCROW_CONTRACT_ID
): Promise<UserEscrow | null> {
  const events = await fetchEscrowEvents(contractId);
  
  if (events.length === 0) {
    return null;
  }
  
  // Filter events for this escrow ID
  const escrowEvents = events.filter(e => e.escrowId === escrowId);
  
  if (escrowEvents.length === 0) {
    return null;
  }
  
  // Find the creation event
  const createEvent = escrowEvents.find(e => e.eventType === 'EscrowCreated');
  if (!createEvent) {
    return null;
  }
  
  // Determine current status from latest event
  const statusOrder: EscrowEvent['eventType'][] = [
    'EscrowCreated',
    'EscrowFunded',
    'PaymentReleased',
    'Refund',
    'Dispute',
  ];
  
  let currentStatus: UserEscrow['status'] = 'Created';
  for (const eventType of statusOrder) {
    if (escrowEvents.some(e => e.eventType === eventType)) {
      if (eventType === 'EscrowFunded') currentStatus = 'Funded';
      else if (eventType === 'PaymentReleased') currentStatus = 'Released';
      else if (eventType === 'Refund') currentStatus = 'Refunded';
      else if (eventType === 'Dispute') currentStatus = 'Disputed';
    }
  }
  
  return {
    escrowId,
    role: 'client', // Will be determined by caller
    status: currentStatus,
    client: parseAddress(createEvent.data?.client),
    freelancer: parseAddress(createEvent.data?.freelancer),
    amount: parseBigInt(createEvent.data?.amount),
    createdAt: Math.floor(new Date(createEvent.ledgerTimestamp).getTime() / 1000),
  };
}

/**
 * Get recent escrow activity
 */
export async function getRecentActivity(
  contractId: string = ESCROW_CONTRACT_ID,
  limit: number = 10
): Promise<EscrowEvent[]> {
  const events = await fetchEscrowEvents(contractId);
  
  // Sort by ledger (descending - most recent first)
  events.sort((a, b) => b.ledger - a.ledger);
  
  // Return most recent events
  return events.slice(0, limit);
}
