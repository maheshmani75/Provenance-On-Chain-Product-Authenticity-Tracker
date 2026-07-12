#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, String as SorobanString};

mod translog_test_shim {
    pub use transfer_log::{TransferLogContract, TransferLogContractClient};
}

fn setup() -> (Env, ProductRegistryContractClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(ProductRegistryContract, ());
    let client = ProductRegistryContractClient::new(&env, &contract_id);

    let log_id = env.register(translog_test_shim::TransferLogContract, ());
    translog_test_shim::TransferLogContractClient::new(&env, &log_id).initialize(&contract_id);

    let manufacturer = Address::generate(&env);
    (env, client, manufacturer, log_id)
}

#[test]
fn test_register_product_sets_manufacturer_as_owner() {
    let (env, client, manufacturer, log_id) = setup();
    let product_id = client.register_product(
        &manufacturer,
        &SorobanString::from_str(&env, "Leather Wallet #A1"),
        &SorobanString::from_str(&env, "SN-00042"),
        &log_id,
    );

    let product = client.get_product(&product_id);
    assert_eq!(product.current_owner, manufacturer);
    assert_eq!(product.flagged_counterfeit, false);
}

#[test]
fn test_transfer_custody_updates_owner_and_logs_via_cross_contract_call() {
    let (env, client, manufacturer, log_id) = setup();
    let product_id = client.register_product(
        &manufacturer,
        &SorobanString::from_str(&env, "Leather Wallet #A1"),
        &SorobanString::from_str(&env, "SN-00042"),
        &log_id,
    );

    let distributor = Address::generate(&env);
    client.transfer_custody(&product_id, &distributor, &SorobanString::from_str(&env, "Regional warehouse"));

    let product = client.get_product(&product_id);
    assert_eq!(product.current_owner, distributor);

    let log_client = translog_test_shim::TransferLogContractClient::new(&env, &log_id);
    let history = log_client.get_history(&product_id);
    assert_eq!(history.len(), 1);
    assert_eq!(history.get(0).unwrap().to, distributor);
}

#[test]
fn test_multi_hop_chain_of_custody() {
    let (env, client, manufacturer, log_id) = setup();
    let product_id = client.register_product(
        &manufacturer,
        &SorobanString::from_str(&env, "Sneakers #7"),
        &SorobanString::from_str(&env, "SN-00099"),
        &log_id,
    );

    let distributor = Address::generate(&env);
    let retailer = Address::generate(&env);
    let consumer = Address::generate(&env);

    client.transfer_custody(&product_id, &distributor, &SorobanString::from_str(&env, "Port"));
    client.transfer_custody(&product_id, &retailer, &SorobanString::from_str(&env, "Store backroom"));
    client.transfer_custody(&product_id, &consumer, &SorobanString::from_str(&env, "Checkout"));

    let product = client.get_product(&product_id);
    assert_eq!(product.current_owner, consumer);

    let log_client = translog_test_shim::TransferLogContractClient::new(&env, &log_id);
    assert_eq!(log_client.hop_count(&product_id), 3u32);
}

#[test]
fn test_flag_counterfeit_marks_product() {
    let (env, client, manufacturer, log_id) = setup();
    let product_id = client.register_product(
        &manufacturer,
        &SorobanString::from_str(&env, "Watch #3"),
        &SorobanString::from_str(&env, "SN-00777"),
        &log_id,
    );

    let suspicious_scanner = Address::generate(&env);
    client.flag_counterfeit(&product_id, &suspicious_scanner);

    let product = client.get_product(&product_id);
    assert_eq!(product.flagged_counterfeit, true);
}

#[test]
fn test_double_flag_rejected() {
    let (env, client, manufacturer, log_id) = setup();
    let product_id = client.register_product(
        &manufacturer,
        &SorobanString::from_str(&env, "Watch #3"),
        &SorobanString::from_str(&env, "SN-00777"),
        &log_id,
    );
    let scanner = Address::generate(&env);
    client.flag_counterfeit(&product_id, &scanner);

    let result = client.try_flag_counterfeit(&product_id, &scanner);
    assert!(result.is_err());
}

#[test]
fn test_product_not_found_errors() {
    let (env, client, _manufacturer, _log_id) = setup();
    let result = client.try_get_product(&999u64);
    assert!(result.is_err());
}
