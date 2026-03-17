#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct SimpleContract;

#[contractimpl]
impl SimpleContract {
    /// Simple test function that just returns the count
    pub fn initialize(env: Env, client: Address, freelancer: Address) -> u64 {
        // Simple storage test
        let count: u64 = env
            .storage()
            .instance()
            .get(&123u32)
            .unwrap_or(0);
        
        let new_count = count + 1;
        env.storage().instance().set(&123u32, &new_count);
        
        new_count
    }
}
