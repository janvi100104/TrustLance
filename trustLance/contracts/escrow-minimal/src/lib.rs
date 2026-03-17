#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, String};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    /// Initialize - minimal version that works
    pub fn initialize(
        env: Env,
        client: Address,
        freelancer: Address,
        amount: i128,
    ) -> u64 {
        // Get count
        let count: u64 = env
            .storage()
            .instance()
            .get(&1u32)
            .unwrap_or(0);

        let new_id = count + 1;

        // Store simple data - just the amount and client
        env.storage().instance().set(&new_id, &amount);
        env.storage().instance().set(&client, &new_id);
        
        // Update count
        env.storage().instance().set(&1u32, &new_id);

        new_id
    }
    
    /// Get escrow amount
    pub fn get_amount(env: Env, escrow_id: u64) -> i128 {
        env.storage()
            .instance()
            .get(&escrow_id)
            .unwrap_or(0)
    }
}
