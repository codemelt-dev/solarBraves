//! Clients for the two contracts RunSession calls. Signatures have to match
//! the deployed siblings.
use soroban_sdk::{contractclient, Address, Env, Vec};

use crate::types::{Item, ItemSpec, RunOutcome};

#[allow(dead_code)] // only the generated clients are used
#[contractclient(name = "LootRegistryClient")]
pub trait LootRegistryInterface {
    fn mint(env: Env, to: Address, specs: Vec<ItemSpec>) -> Vec<Item>;
    fn grant_keys(env: Env, to: Address, amount: u32);
    fn burn_key(env: Env, from: Address);
}

#[allow(dead_code)] // only the generated clients are used
#[contractclient(name = "DungeonClaimsClient")]
pub trait DungeonClaimsInterface {
    #[allow(clippy::too_many_arguments)]
    fn record_run(
        env: Env,
        player: Address,
        dungeon_id: u32,
        premium: bool,
        floors_cleared: u32,
        items: u32,
        keys_found: u32,
        outcome: RunOutcome,
    );
}
