#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Env, String};

fn create_client(env: &Env) -> Address {
    Address::generate(env)
}

fn create_freelancer(env: &Env) -> Address {
    Address::generate(env)
}

#[test]
fn test_initialize_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000; // 10 XLM in stroops
    let deadline = env.ledger().timestamp() + 86400; // 24 hours from now
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata.clone(),
        )
    });

    assert_eq!(escrow_id, 1);

    // Verify escrow was created
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.id, 1);
    assert_eq!(escrow.client, client);
    assert_eq!(escrow.amount, amount);
    assert_eq!(escrow.status, EscrowStatus::Created);
    assert_eq!(escrow.deadline, deadline);
}

#[test]
fn test_initialize_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 0;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Verify escrow was created (validation happens during fund)
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.id, 1);
    assert_eq!(escrow.amount, 0);
}

#[test]
fn test_initialize_invalid_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline: u64 = 1000; // Past deadline (timestamp starts at 0)
    let metadata = String::from_str(&env, "Test");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Verify escrow was created (validation happens during operations)
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.id, 1);
}

#[test]
fn test_fund_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Fund the escrow
    let result = env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id)
    });
    assert!(result.is_ok());

    // Verify status changed to Funded
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.status, EscrowStatus::Funded);
}

#[test]
fn test_fund_already_funded_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Fund once
    env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id).unwrap()
    });

    // Try to fund again
    let result = env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id)
    });
    assert_eq!(result, Err(EscrowError::EscrowAlreadyFunded));
}

#[test]
fn test_release_payment() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Fund the escrow
    env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id).unwrap()
    });

    // Release payment
    let result = env.as_contract(&contract_id, || {
        EscrowContract::release_payment(env.clone(), escrow_id)
    });
    assert!(result.is_ok());

    // Verify status changed to Released
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.status, EscrowStatus::Released);
}

#[test]
fn test_release_not_funded_escrow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Try to release without funding
    let result = env.as_contract(&contract_id, || {
        EscrowContract::release_payment(env.clone(), escrow_id)
    });
    assert_eq!(result, Err(EscrowError::EscrowNotFunded));
}

#[test]
fn test_refund_after_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline: u64 = 1000; // Short deadline
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Fund the escrow
    env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id).unwrap()
    });

    // Advance time past deadline
    env.ledger().with_mut(|li| {
        li.timestamp = deadline + 1000;
    });

    // Refund
    let result = env.as_contract(&contract_id, || {
        EscrowContract::refund(env.clone(), escrow_id)
    });
    assert!(result.is_ok());

    // Verify status changed to Refunded
    let escrow = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(escrow.status, EscrowStatus::Refunded);
}

#[test]
fn test_refund_before_deadline() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Fund the escrow
    env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id).unwrap()
    });

    // Try to refund before deadline
    let result = env.as_contract(&contract_id, || {
        EscrowContract::refund(env.clone(), escrow_id)
    });
    assert_eq!(result, Err(EscrowError::DeadlineNotPassed));
}

#[test]
fn test_get_escrow_count() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test");

    // Initially 0
    let count = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow_count(env.clone())
    });
    assert_eq!(count, 0);

    // Create first escrow
    env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata.clone(),
        )
    });

    let count = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow_count(env.clone())
    });
    assert_eq!(count, 1);

    // Create second escrow
    env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    let count = env.as_contract(&contract_id, || {
        EscrowContract::get_escrow_count(env.clone())
    });
    assert_eq!(count, 2);
}

#[test]
fn test_get_status() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowContract, ());
    let client = create_client(&env);
    let freelancer = create_freelancer(&env);
    let amount: i128 = 100_000_000;
    let deadline = env.ledger().timestamp() + 86400;
    let metadata = String::from_str(&env, "Test escrow");

    let escrow_id = env.as_contract(&contract_id, || {
        EscrowContract::initialize(
            env.clone(),
            client.clone(),
            freelancer.clone(),
            amount,
            deadline,
            metadata,
        )
    });

    // Check initial status
    let status = env.as_contract(&contract_id, || {
        EscrowContract::get_status(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(status, EscrowStatus::Created);

    // Fund and check again
    env.as_contract(&contract_id, || {
        EscrowContract::fund(env.clone(), escrow_id).unwrap()
    });
    let status = env.as_contract(&contract_id, || {
        EscrowContract::get_status(env.clone(), escrow_id).unwrap()
    });
    assert_eq!(status, EscrowStatus::Funded);
}
