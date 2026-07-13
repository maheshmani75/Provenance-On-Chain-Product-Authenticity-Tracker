//! Product Registry Contract
//!
//! Manufacturers register physical products with a serial number and a set
//! of authenticity metadata. Ownership then moves through the supply chain
//! — manufacturer -> distributor -> retailer -> consumer, and any resale
//! after that — via `transfer_custody`. Every transfer makes a
//! cross-contract call into the TransferLog contract, which is the
//! tamper-evident source of truth for a product's full journey. A "scan to
//! verify" flow reads `get_product` + the log's `get_history` to prove a
//! product is genuine and show exactly where it's been.

#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String};

mod translog {
    soroban_sdk::contractimport!(
        file = "../../target/wasm32v1-none/release/transfer_log.wasm"
    );
}

#[contracttype]
#[derive(Clone)]
pub struct Product {
    pub manufacturer: Address,
    pub name: String,
    pub serial_number: String,
    pub current_owner: Address,
    pub transfer_log: Address,
    pub registered_at: u64,
    pub flagged_counterfeit: bool,
}

#[contracttype]
pub enum DataKey {
    Product(u64),
    NextProductId,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    ProductNotFound = 1,
    Unauthorized = 2,
    NotCurrentOwner = 3,
    AlreadyFlagged = 4,
}



#[contract]
pub struct ProductRegistryContract;

#[contractimpl]
impl ProductRegistryContract {
    /// Manufacturer registers a new product. Ownership starts with the manufacturer.
    pub fn register_product(
        env: Env,
        manufacturer: Address,
        name: String,
        serial_number: String,
        transfer_log: Address,
    ) -> Result<u64, RegistryError> {
        manufacturer.require_auth();

        let product_id: u64 = env.storage().instance().get(&DataKey::NextProductId).unwrap_or(0);
        env.storage().instance().set(&DataKey::NextProductId, &(product_id + 1));

        let product = Product {
            manufacturer: manufacturer.clone(),
            name,
            serial_number: serial_number.clone(),
            current_owner: manufacturer.clone(),
            transfer_log,
            registered_at: env.ledger().timestamp(),
            flagged_counterfeit: false,
        };
        env.storage().persistent().set(&DataKey::Product(product_id), &product);

        env.events().publish((symbol_short!("Register"), product_id), (manufacturer, serial_number));
        Ok(product_id)
    }

    /// Current owner hands custody to the next party in the chain. Makes a
    /// cross-contract call into TransferLog to append the tamper-evident record.
    pub fn transfer_custody(
        env: Env,
        product_id: u64,
        to: Address,
        location: String,
    ) -> Result<(), RegistryError> {
        let mut product = Self::load_product(&env, product_id)?;
        product.current_owner.require_auth();

        let from = product.current_owner.clone();

        // Cross-contract call: Registry -> TransferLog
        let log_client = translog::Client::new(&env, &product.transfer_log);
        log_client.record_transfer(&product_id, &from, &to, &location);

        product.current_owner = to.clone();
        env.storage().persistent().set(&DataKey::Product(product_id), &product);

        env.events().publish((symbol_short!("Transfer"), product_id), (from, to));
        Ok(())
    }

    /// Anyone can flag a product as suspected counterfeit (e.g. a consumer
    /// who scans a duplicate serial number in the wild). This does not
    /// erase history — it appends a permanent flag anyone can see when
    /// verifying the product.
    pub fn flag_counterfeit(env: Env, product_id: u64, flagged_by: Address) -> Result<(), RegistryError> {
        flagged_by.require_auth();
        let mut product = Self::load_product(&env, product_id)?;

        if product.flagged_counterfeit {
            return Err(RegistryError::AlreadyFlagged);
        }
        product.flagged_counterfeit = true;
        env.storage().persistent().set(&DataKey::Product(product_id), &product);

        env.events().publish((symbol_short!("Flagged"), product_id), flagged_by);
        Ok(())
    }

    pub fn get_product(env: Env, product_id: u64) -> Result<Product, RegistryError> {
        Self::load_product(&env, product_id)
    }

    fn load_product(env: &Env, product_id: u64) -> Result<Product, RegistryError> {
        env.storage().persistent().get(&DataKey::Product(product_id)).ok_or(RegistryError::ProductNotFound)
    }
}

mod test;
