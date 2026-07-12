#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String as SorobanString};

fn setup() -> (Env, TransferLogContractClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(TransferLogContract, ());
    let client = TransferLogContractClient::new(&env, &contract_id);

    let registry = Address::generate(&env);
    client.initialize(&registry);
    (env, client, registry)
}

#[test]
fn test_new_product_has_empty_history() {
    let (_env, client, _registry) = setup();
    let history = client.get_history(&1u64);
    assert_eq!(history.len(), 0);
}

#[test]
fn test_record_transfer_appends_entry() {
    let (env, client, _registry) = setup();
    let from = Address::generate(&env);
    let to = Address::generate(&env);

    let hop = client.record_transfer(&1u64, &from, &to, &SorobanString::from_str(&env, "Shenzhen warehouse"));
    assert_eq!(hop, 1u32);

    let history = client.get_history(&1u64);
    assert_eq!(history.len(), 1);
    assert_eq!(history.get(0).unwrap().to, to);
}

#[test]
fn test_multiple_hops_accumulate_in_order() {
    let (env, client, _registry) = setup();
    let manufacturer = Address::generate(&env);
    let distributor = Address::generate(&env);
    let retailer = Address::generate(&env);
    let consumer = Address::generate(&env);

    client.record_transfer(&5u64, &manufacturer, &distributor, &SorobanString::from_str(&env, "Factory"));
    client.record_transfer(&5u64, &distributor, &retailer, &SorobanString::from_str(&env, "Warehouse"));
    client.record_transfer(&5u64, &retailer, &consumer, &SorobanString::from_str(&env, "Retail: Main St"));

    let history = client.get_history(&5u64);
    assert_eq!(history.len(), 3);
    assert_eq!(history.get(0).unwrap().from, manufacturer);
    assert_eq!(history.get(2).unwrap().to, consumer);
}

#[test]
fn test_hop_count_matches_history_length() {
    let (env, client, _registry) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    client.record_transfer(&9u64, &a, &b, &SorobanString::from_str(&env, "Checkpoint 1"));
    client.record_transfer(&9u64, &b, &a, &SorobanString::from_str(&env, "Checkpoint 2"));
    assert_eq!(client.hop_count(&9u64), 2u32);
}

#[test]
fn test_histories_are_isolated_per_product() {
    let (env, client, _registry) = setup();
    let a = Address::generate(&env);
    let b = Address::generate(&env);
    client.record_transfer(&1u64, &a, &b, &SorobanString::from_str(&env, "X"));
    let other_history = client.get_history(&2u64);
    assert_eq!(other_history.len(), 0);
}

#[test]
fn test_already_initialized_rejected() {
    let (env, client, _registry) = setup();
    let other = Address::generate(&env);
    let result = client.try_initialize(&other);
    assert!(result.is_err());
}
