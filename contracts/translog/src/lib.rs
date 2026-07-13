//! Transfer Log Contract
//!
//! Append-only ownership history for registered products. The
//! ProductRegistry contract calls into this contract cross-contract on
//! every ownership handoff (manufacturer -> distributor -> retailer ->
//! consumer, and any resale after that). This contract never decides
//! whether a transfer is *allowed* — that's the Registry's job — it is
//! purely the tamper-evident record of what happened and when, which is
//! what a "scan to verify" flow reads back to build a timeline.

#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[contracttype]
#[derive(Clone)]
pub struct TransferEntry {
    pub from: Address,
    pub to: Address,
    pub location: String, // free-text checkpoint, e.g. "Shenzhen warehouse", "Retail: Main St"
    pub ledger_timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    AuthorizedRegistry,
    Log(u64), // product_id -> Vec<TransferEntry>
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TransferLogError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
}



#[contract]
pub struct TransferLogContract;

#[contractimpl]
impl TransferLogContract {
    /// Set the single ProductRegistry contract permitted to append entries.
    pub fn initialize(env: Env, registry: Address) -> Result<(), TransferLogError> {
        if env.storage().instance().has(&DataKey::AuthorizedRegistry) {
            return Err(TransferLogError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::AuthorizedRegistry, &registry);
        Ok(())
    }

    /// Called cross-contract by the Registry on every ownership handoff.
    pub fn record_transfer(
        env: Env,
        product_id: u64,
        from: Address,
        to: Address,
        location: String,
    ) -> Result<u32, TransferLogError> {
        let registry: Address = env
            .storage()
            .instance()
            .get(&DataKey::AuthorizedRegistry)
            .ok_or(TransferLogError::NotInitialized)?;
        registry.require_auth();

        let key = DataKey::Log(product_id);
        let mut log: Vec<TransferEntry> = env.storage().persistent().get(&key).unwrap_or(Vec::new(&env));
        log.push_back(TransferEntry {
            from: from.clone(),
            to: to.clone(),
            location,
            ledger_timestamp: env.ledger().timestamp(),
        });
        let hop_count = log.len();
        env.storage().persistent().set(&key, &log);

        env.events().publish((symbol_short!("Transfer"), product_id), (from, to));
        Ok(hop_count)
    }

    /// Read-only: full ownership timeline for a product, oldest first.
    pub fn get_history(env: Env, product_id: u64) -> Vec<TransferEntry> {
        env.storage().persistent().get(&DataKey::Log(product_id)).unwrap_or(Vec::new(&env))
    }

    pub fn hop_count(env: Env, product_id: u64) -> u32 {
        env.storage()
            .persistent()
            .get::<_, Vec<TransferEntry>>(&DataKey::Log(product_id))
            .map(|v| v.len())
            .unwrap_or(0)
    }
}

mod test;
