#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracterror, contracttype, Address, Env, String, Symbol,
};

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
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowCreatedEvent {
    pub escrow_id: u64,
    pub client: Address,
    pub freelancer: Address,
    pub amount: i128,
    pub deadline: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowFundedEvent {
    pub escrow_id: u64,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PaymentReleasedEvent {
    pub escrow_id: u64,
    pub freelancer: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RefundEvent {
    pub escrow_id: u64,
    pub client: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeEvent {
    pub escrow_id: u64,
    pub reason: String,
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

// Storage keys
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StorageKey {
    EscrowCount,
    Escrow(u64),
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
        freelancer: Address,
        amount: i128,
        deadline: u64,
        metadata: String,
    ) -> Result<u64, EscrowError> {
        // Validate inputs
        if amount <= 0 {
            return Err(EscrowError::InvalidAmount);
        }

        if deadline <= env.ledger().timestamp() {
            return Err(EscrowError::InvalidDeadline);
        }

        // Get current escrow count and increment
        let escrow_count: u64 = env
            .storage()
            .instance()
            .get(&StorageKey::EscrowCount)
            .unwrap_or(0);

        let new_id = escrow_count + 1;

        // Create escrow
        let escrow = Escrow {
            id: new_id,
            client: env.current_contract_address(),
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
            .set(&StorageKey::Escrow(new_id), &escrow);

        // Update escrow count
        env.storage().instance().set(&StorageKey::EscrowCount, &new_id);

        // Emit event (using tuple syntax for Soroban SDK v25)
        env.events().publish(
            (Symbol::new(&env, "escrow_created"),),
            EscrowCreatedEvent {
                escrow_id: new_id,
                client: env.current_contract_address(),
                freelancer: freelancer.clone(),
                amount,
                deadline,
            },
        );

        Ok(new_id)
    }

    /// Fund the escrow with native XLM
    /// Must be called by the client with attached payment
    pub fn fund(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        let client = escrow.client.clone();
        client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Created {
            return Err(EscrowError::EscrowAlreadyFunded);
        }

        // Update status
        escrow.status = EscrowStatus::Funded;

        // Store updated escrow
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "escrow_funded"),),
            EscrowFundedEvent {
                escrow_id,
                amount: escrow.amount,
            },
        );

        Ok(())
    }

    /// Release payment to freelancer
    /// Can only be called by the client when status is Funded
    pub fn release_payment(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        let client = escrow.client.clone();
        client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::EscrowNotFunded);
        }

        // Update status
        escrow.status = EscrowStatus::Released;

        // Store updated escrow before transfer
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        // Transfer payment to freelancer using native token transfer
        // The contract must receive the tokens first, then transfer them
        // For this simplified version, we assume the contract holds the balance
        let _contract_address = env.current_contract_address();
        
        // Use the native token (XLM) transfer
        // Note: In production, you'd use the token client to transfer
        // This is a simplified version that assumes balance tracking
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "payment_released"),),
            PaymentReleasedEvent {
                escrow_id,
                freelancer: escrow.freelancer.clone(),
                amount: escrow.amount,
            },
        );

        Ok(())
    }

    /// Request revision (client requests changes)
    pub fn request_revision(env: Env, escrow_id: u64, note: String) -> Result<(), EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Verify caller is the client
        escrow.client.require_auth();

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::InvalidStatus);
        }

        // Emit event (revision request is informational)
        env.events().publish(
            (Symbol::new(&env, "revision_requested"),),
            (escrow_id, note),
        );

        Ok(())
    }

    /// Refund the client after deadline has passed
    pub fn refund(env: Env, escrow_id: u64) -> Result<(), EscrowError> {
        let mut escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;

        // Check if deadline has passed
        if env.ledger().timestamp() < escrow.deadline {
            return Err(EscrowError::DeadlineNotPassed);
        }

        // Check status
        if escrow.status != EscrowStatus::Funded {
            return Err(EscrowError::EscrowNotFunded);
        }

        // Update status
        escrow.status = EscrowStatus::Refunded;

        // Store updated escrow
        env.storage()
            .instance()
            .set(&StorageKey::Escrow(escrow_id), &escrow);

        // Emit event
        env.events().publish(
            (Symbol::new(&env, "refund"),),
            RefundEvent {
                escrow_id,
                client: escrow.client.clone(),
                amount: escrow.amount,
            },
        );

        Ok(())
    }

    /// Raise a dispute
    pub fn raise_dispute(env: Env, escrow_id: u64, reason: String) -> Result<(), EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
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
        env.events().publish(
            (Symbol::new(&env, "dispute"),),
            DisputeEvent {
                escrow_id,
                reason,
            },
        );

        Ok(())
    }

    /// Get escrow details
    pub fn get_escrow(env: Env, escrow_id: u64) -> Result<Escrow, EscrowError> {
        env.storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)
    }

    /// Get escrow status
    pub fn get_status(env: Env, escrow_id: u64) -> Result<EscrowStatus, EscrowError> {
        let escrow: Escrow = env
            .storage()
            .instance()
            .get(&StorageKey::Escrow(escrow_id))
            .ok_or(EscrowError::EscrowNotFound)?;
        Ok(escrow.status)
    }

    /// Get total number of escrows
    pub fn get_escrow_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&StorageKey::EscrowCount)
            .unwrap_or(0)
    }
}

// Test module
#[cfg(test)]
mod test;
