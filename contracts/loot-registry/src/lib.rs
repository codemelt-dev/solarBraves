//! LootRegistry — player inventories and dungeon keys.
//!
//! Only the configured minter (the RunSession contract) mints items and
//! burns keys. Keys gate premium dungeons.
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec};

mod error;
mod events;
mod types;

use events::{KeyBurn, KeyGrant, Mint};
pub use error::Error;
pub use types::{DataKey, Item, ItemKind, ItemSpec, Rarity};

// bump persistent entries to ~30 days when they drop below ~15
const TTL_THRESHOLD: u32 = 259_200;
const TTL_EXTEND_TO: u32 = 518_400;

#[contract]
pub struct LootRegistry;

#[contractimpl]
impl LootRegistry {
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &1u64);
    }

    /// Set who can mint items and burn keys (the RunSession contract). Admin only.
    pub fn set_minter(env: &Env, minter: Address) {
        Self::require_admin(env);
        env.storage().instance().set(&DataKey::Minter, &minter);
    }

    /// Mint items into a player's inventory. Minter only.
    pub fn mint(env: &Env, to: Address, specs: Vec<ItemSpec>) -> Result<Vec<Item>, Error> {
        Self::require_minter(env)?;
        let mut next_id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(1);
        let key = DataKey::Inventory(to.clone());
        let mut inventory: Vec<Item> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        let mut minted = Vec::new(env);
        for spec in specs.iter() {
            let item = Item {
                id: next_id,
                kind: spec.kind,
                rarity: spec.rarity,
                power: spec.power,
            };
            inventory.push_back(item.clone());
            minted.push_back(item);
            next_id += 1;
        }
        env.storage().instance().set(&DataKey::NextId, &next_id);
        env.storage().persistent().set(&key, &inventory);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        Mint { to, count: minted.len() }.publish(env);
        Ok(minted)
    }

    /// Grant keys to a player. Minter only.
    pub fn grant_keys(env: &Env, to: Address, amount: u32) -> Result<(), Error> {
        Self::require_minter(env)?;
        Self::add_keys(env, &to, amount);
        Ok(())
    }

    /// Key faucet for demos. Admin only.
    pub fn airdrop_keys(env: &Env, to: Address, amount: u32) {
        Self::require_admin(env);
        Self::add_keys(env, &to, amount);
    }

    /// Burn one key, used on premium entry. Minter only.
    pub fn burn_key(env: &Env, from: Address) -> Result<(), Error> {
        Self::require_minter(env)?;
        let key = DataKey::Keys(from.clone());
        let balance: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        if balance == 0 {
            return Err(Error::NoKeys);
        }
        env.storage().persistent().set(&key, &(balance - 1));
        KeyBurn { from, balance: balance - 1 }.publish(env);
        Ok(())
    }

    /// A player's full inventory.
    pub fn inventory(env: &Env, owner: Address) -> Vec<Item> {
        env.storage()
            .persistent()
            .get(&DataKey::Inventory(owner))
            .unwrap_or_else(|| Vec::new(env))
    }

    /// A player's dungeon key balance.
    pub fn key_balance(env: &Env, owner: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Keys(owner))
            .unwrap_or(0)
    }

    /// Current admin.
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Current minter, if configured.
    pub fn minter(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Minter)
    }

    /// Upgrade to new wasm. Admin only.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    fn add_keys(env: &Env, to: &Address, amount: u32) {
        let key = DataKey::Keys(to.clone());
        let balance: u32 = env.storage().persistent().get(&key).unwrap_or(0);
        env.storage().persistent().set(&key, &(balance + amount));
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
        KeyGrant { to: to.clone(), amount, balance: balance + amount }.publish(env);
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("admin not set");
        admin.require_auth();
    }

    // invoker-contract auth: passes when RunSession calls us directly
    fn require_minter(env: &Env) -> Result<(), Error> {
        let minter: Address = env
            .storage()
            .instance()
            .get(&DataKey::Minter)
            .ok_or(Error::MinterNotSet)?;
        minter.require_auth();
        Ok(())
    }
}

#[cfg(test)]
mod test;
