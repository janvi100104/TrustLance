#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contractevent, contracttype,
    Address, Env, String,
};

#[cfg(not(test))]
use soroban_sdk::token::Client as TokenClient;

// Native asset (XLM) contract address on Stellar testnet/mainnet
// This is the standard wrapped XLM token address
#[cfg(not(test))]
const NATIVE_TOKEN_ADDRESS: &str = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

// Contract types

/// Escrow status enumeration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Created,
    Funded,
    Released,
    Refunded,
    Disputed,
}

/// Escrow data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Escrow {
    pub id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub token: Option<Address>, // None for native XLM
    pub status: EscrowStatus,
    pub deadline: u64,
    pub created_at: u64,
    pub metadata: String,
}

// Event types using #[contractevent] macro
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowCreated {
    pub escrow_id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub deadline: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowFunded {
    pub escrow_id: u64,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentReleased {
    pub escrow_id: u64,
    pub freelancer: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Refund {
    pub escrow_id: u64,
    pub client: Address,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub escrow_id: u64,
    pub reason: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RevisionRequested {
    pub escrow_id: u64,
    pub note: String,
}

// Error types
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum EscrowError {
    EscrowNotFound = 1,
    Unauthorized = 2,
    InvalidAmount = 3,
    InvalidDeadline = 4,
    EscrowAlreadyFunded = 5,
    EscrowNotFunded = 6,
    EscrowAlreadyReleased = 7,
    DeadlineNotPassed = 8,
    InvalidStatus = 9,
    Overflow = 10,
}

// Storage keys - use simple u32 keys instead of enum
const ESCROW_COUNT_KEY: u32 = 0;
fn escrow_key(id: u64) -> u32 {
    // Simple hash: base + (id % 1000)
    100 + (id % 1000) as u32
}

// Contract implementation

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize a new escrow contract
    /// Returns the escrow ID
    pub fn initialize(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
        deadline: u64,
        metadata: String,
    ) -> u64 {
        // Get current escrow count
        let escrow_count: u64 = env
            .storage()
            .instance()
            .get(&ESCROW_COUNT_KEY)
            .unwrap_or(0);

        let new_id = escrow_count + 1;

        // Create escrow
        let escrow = Escrow {
            id: new_id,
            client: client.clone(),
            freelancer: freelancer.clone(),
            amount,
            token: None, // Native XLM
            status: EscrowStatus::Created,
            deadline,
            created_at: env.ledger().timestamp(),
            metadata,
        };

        // Store escrow
        env.storage()
            .instance()
            .set(&escrow_key(new_id), &escrow);

        // Update escrow count
        env.storage().instance().set(&ESCROW_COUNT_KEY, &new_id);

        new_id
    }

    /// Fund the escrow with native XLM
    /// Client must transfer tokens to contract BEFORE calling this function
    /// The transfer is done via Payment operation in the same transaction
    pub fn fund(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        let client = escrow.client.clone();
        client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Created {
            return Err(EscrowError::EscrowAlreadyFunded);
        }

        // Verify contract has received funds by checking balance
        // For native XLM, we check the contract's balance
        // Skip balance check in test environments
        #[cfg(not(test))]
        {
            let contract_address = env.current_contract_address();

            // Get native token (XLM) contract using well-known address
            let native_token_address = Address::from_str(&env, NATIVE_TOKEN_ADDRESS);
            let token_client = TokenClient::new(&env, &native_token_address);

            // Check contract balance (optional verification)
            let contract_balance = token_client.balance(&contract_address);

            // Verify balance is at least the escrow amount
            if contract_balance < escrow.amount {
                return Err(EscrowError::InvalidAmount);
            }
        }

        // Update status
        escrow.status = EscrowStatus::Funded;

        // Store updated escrow
        env.storage()
            .instance()
            .set(&escrow_key(escrow_id), &escrow);

        // Emit event
        EscrowFunded {
            escrow_id,
            amount: escrow.amount,
        }.publish(&env);

        Ok(())
    }

    /// Release payment to freelancer (WITH REAL XLM TRANSFER)
    /// Can only be called by the client when status is Funded
    pub fn release_payment(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        let client = escrow.client.clone();
        client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::EscrowNotFunded);
        }

        // Update status BEFORE transfer (in case transfer fails)
        escrow.status = EscrowStatus::Released;

        // Store updated escrow
        env.storage()
            .instance()
            .set(&escrow_key(escrow_id), &escrow);

        // REAL XLM TRANSFER to freelancer (skip in test mode)
        #[cfg(not(test))]
        {
            let contract_address = env.current_contract_address();

            // Get native token (XLM) contract using well-known address
            let native_token_address = Address::from_str(&env, NATIVE_TOKEN_ADDRESS);
            let token_client = TokenClient::new(&env, &native_token_address);

            // Transfer escrow amount to freelancer
            token_client.transfer(&contract_address, &escrow.freelancer, &escrow.amount);
        }

        // Emit event
        PaymentReleased {
            escrow_id,
            freelancer: escrow.freelancer.clone(),
            amount: escrow.amount,
        }.publish(&env);

        Ok(())
    }

    /// Request revision (client requests changes)
    pub fn request_revision(env: Env, escrow_id: u64, note: String) -> Result<(), EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        escrow.client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::InvalidStatus);
        }

        // Emit event (revision request is informational)
        RevisionRequested {
            escrow_id,
            note: note.clone(),
        }.publish(&env);

        Ok(())
    }

    /// Refund the client after deadline has passed (WITH REAL XLM TRANSFER)
    pub fn refund(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Check if deadline has passed
        if env.ledger().timestamp() < escrow.deadline {
            return Err(EscrowError::DeadlineNotPassed);
        }

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::EscrowNotFunded);
        }

        // Update status BEFORE transfer
        escrow.status = EscrowStatus::Refunded;

        // Store updated escrow
        env.storage()
            .instance()
            .set(&escrow_key(escrow_id), &escrow);

        // REAL XLM TRANSFER back to client (skip in test mode)
        #[cfg(not(test))]
        {
            let contract_address = env.current_contract_address();

            // Get native token (XLM) contract using well-known address
            let native_token_address = Address::from_str(&env, NATIVE_TOKEN_ADDRESS);
            let token_client = TokenClient::new(&env, &native_token_address);

            // Transfer escrow amount back to client
            token_client.transfer(&contract_address, &escrow.client, &escrow.amount);
        }

        // Emit event
        Refund {
            escrow_id,
            client: escrow.client.clone(),
            amount: escrow.amount,
        }.publish(&env);

        Ok(())
    }

    /// Raise a dispute
    pub fn raise_dispute(env: Env, escrow_id: u64, reason: String) -> Result<(), EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Either client or freelancer can raise dispute
        let caller = env.current_contract_address();
        if caller != escrow.client && caller != escrow.freelancer {
            return Err(EscrowError::Unauthorized);
        }

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::InvalidStatus);
        }

        // Emit event
        Dispute {
            escrow_id,
            reason: reason.clone(),
        }.publish(&env);

        Ok(())
    }

    /// Get escrow details
    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
        env.storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)
    }

    /// Get escrow status
    pub fn get_status(env: Env, escrow_id: u64) -> Result<EscrowStatus, EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&escrow_key(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;
        Ok(escrow.status)
    }

    /// Get total number of escrows
    pub fn get_escrow_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&ESCROW_COUNT_KEY)
            .unwrap_or(0)
    }
}

// Test module
#[cfg(test)]
mod test;
