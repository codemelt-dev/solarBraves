//! RunSession — a player's active dungeon run, held entirely onchain.
//!
//! At each checkpoint the player either banks the pending loot (exit_safe)
//! or pushes deeper (clear_floor) for better rolls at higher risk. A wipe
//! loses everything. Loot only reaches the registry on safe exit, so there
//! is no off-chain rollback.
#![no_std]
use soroban_sdk::{Address, BytesN, Env, Vec, contract, contractimpl};

mod clients;
mod error;
mod events;
mod types;

pub use error::Error;
pub use types::{DataKey, Item, ItemKind, ItemSpec, Rarity, RunOutcome, RunState};

use clients::{DungeonClaimsClient, LootRegistryClient};
use events::{FloorCleared, LootClaimed, RunStarted, RunWiped};

/// Last floor is the boss.
pub const MAX_FLOORS: u32 = 5;
// risk multiplier in basis points, 100 = 1x
const BASE_RISK_BPS: u32 = 100;
const PREMIUM_RISK_BPS: u32 = 200;
const RISK_STEP_BPS: u32 = 25;

// bump persistent entries to ~30 days when they drop below ~15
const TTL_THRESHOLD: u32 = 259_200;
const TTL_EXTEND_TO: u32 = 518_400;

#[contract]
pub struct RunSession;

#[contractimpl]
impl RunSession {
    /// Set the admin. Wire the other contracts with `configure` after deploy.
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Set the LootRegistry and DungeonClaims addresses. Admin only.
    pub fn configure(env: &Env, loot_registry: Address, dungeon_claims: Address) {
        Self::require_admin(env);
        env.storage()
            .instance()
            .set(&DataKey::LootRegistry, &loot_registry);
        env.storage()
            .instance()
            .set(&DataKey::DungeonClaims, &dungeon_claims);
    }

    /// Enter a dungeon. Premium entry burns a key. One active run per address.
    pub fn start_run(
        env: &Env,
        player: Address,
        dungeon_id: u32,
        premium: bool,
    ) -> Result<RunState, Error> {
        player.require_auth();
        let (loot_registry, _) = Self::contracts(env)?;

        let key = DataKey::Run(player.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::RunActive);
        }

        if premium {
            let registry = LootRegistryClient::new(env, &loot_registry);
            if registry.try_burn_key(&player).is_err() {
                return Err(Error::NoKey);
            }
        }

        let state = RunState {
            player: player.clone(),
            dungeon_id,
            premium,
            floor: 1,
            risk_bps: if premium {
                PREMIUM_RISK_BPS
            } else {
                BASE_RISK_BPS
            },
            pending: Vec::new(env),
            started: env.ledger().sequence(),
        };
        Self::save_run(env, &key, &state);
        RunStarted {
            player,
            dungeon_id,
            premium,
        }
        .publish(env);
        Ok(state)
    }

    /// Clear the current floor: roll loot, advance, bump the risk multiplier.
    pub fn clear_floor(env: &Env, player: Address) -> Result<RunState, Error> {
        player.require_auth();
        let key = DataKey::Run(player.clone());
        let mut state: RunState = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NoActiveRun)?;

        if state.floor > MAX_FLOORS {
            return Err(Error::MustExit);
        }

        let boss = state.floor == MAX_FLOORS;
        let drops: u32 = if boss { 3 } else { 1 };
        for _ in 0..drops {
            let packed = Self::roll_item(env, state.floor, state.risk_bps);
            state.pending.push_back(packed);
        }

        FloorCleared {
            player,
            floor: state.floor,
            pending: state.pending.len(),
        }
        .publish(env);
        state.floor += 1;
        state.risk_bps += RISK_STEP_BPS;
        Self::save_run(env, &key, &state);
        Ok(state)
    }

    /// Bank the run: mint pending loot, maybe drop a key, record it, close.
    pub fn exit_safe(env: &Env, player: Address) -> Result<Vec<Item>, Error> {
        player.require_auth();
        let (loot_registry, dungeon_claims) = Self::contracts(env)?;
        let key = DataKey::Run(player.clone());
        let state: RunState = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NoActiveRun)?;
        env.storage().persistent().remove(&key);

        let floors_cleared = state.floor - 1;
        let registry = LootRegistryClient::new(env, &loot_registry);

        // unpack the rolled loot; content is fixed in storage by now, so the
        // mint write is the same in simulation and at apply time
        let mut specs: Vec<ItemSpec> = Vec::new(env);
        for packed in state.pending.iter() {
            specs.push_back(Self::unpack_spec(packed));
        }
        let minted = if specs.is_empty() {
            Vec::new(env)
        } else {
            registry.mint(&player, &specs)
        };

        // key drop: need 2+ floors, better odds deeper and in premium.
        // grant_keys is called even for 0 keys — the gate is deterministic
        // but the roll is not, and the footprint must not depend on it.
        let mut keys_found = 0u32;
        if floors_cleared >= 2 {
            let chance_bps = 1_000 + 400 * floors_cleared + if state.premium { 1_500 } else { 0 };
            let roll: u64 = env.prng().gen_range(0..10_000);
            if roll < chance_bps as u64 {
                keys_found = 1;
            }
            registry.grant_keys(&player, &keys_found);
        }

        DungeonClaimsClient::new(env, &dungeon_claims).record_run(
            &player,
            &state.dungeon_id,
            &state.premium,
            &floors_cleared,
            &minted.len(),
            &keys_found,
            &RunOutcome::Claimed,
        );
        LootClaimed {
            player,
            floors_cleared,
            items: minted.len(),
            keys_found,
        }
        .publish(env);
        Ok(minted)
    }

    /// Hero died. Run closes, pending loot is gone, wipe goes on record.
    pub fn wipe(env: &Env, player: Address) -> Result<(), Error> {
        player.require_auth();
        let (_, dungeon_claims) = Self::contracts(env)?;
        let key = DataKey::Run(player.clone());
        let state: RunState = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::NoActiveRun)?;
        env.storage().persistent().remove(&key);

        let lost = state.pending.len();
        DungeonClaimsClient::new(env, &dungeon_claims).record_run(
            &player,
            &state.dungeon_id,
            &state.premium,
            &(state.floor - 1),
            &lost,
            &0,
            &RunOutcome::Wiped,
        );
        RunWiped {
            player,
            items_lost: lost,
        }
        .publish(env);
        Ok(())
    }

    /// A player's active run, if any.
    pub fn run(env: &Env, player: Address) -> Option<RunState> {
        env.storage().persistent().get(&DataKey::Run(player))
    }

    /// Current admin.
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Upgrade to new wasm. Admin only.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    // Loot rolls use the protocol prng, so the client has no say in outcomes.
    // Returns the item packed as (kind << 40) | (rarity << 32) | power —
    // a u64 always encodes to the same size, which keeps the storage write
    // deterministic even though the roll itself isn't (see types.rs).
    fn roll_item(env: &Env, floor: u32, risk_bps: u32) -> u64 {
        let kind: u64 = env.prng().gen_range(0..4);
        // Depth and risk shift the rarity roll upward.
        let roll = env.prng().gen_range::<u64>(1..=100) as u32
            + floor * 4
            + (risk_bps - BASE_RISK_BPS) / 25;
        let rarity: u64 = if roll >= 105 {
            3
        } else if roll >= 90 {
            2
        } else if roll >= 65 {
            1
        } else {
            0
        };
        let base = floor * 10 + env.prng().gen_range::<u64>(0..10) as u32;
        let power = base * risk_bps / 100;
        (kind << 40) | (rarity << 32) | power as u64
    }

    fn unpack_spec(packed: u64) -> ItemSpec {
        let kind = match (packed >> 40) & 0xff {
            0 => ItemKind::Weapon,
            1 => ItemKind::Armor,
            2 => ItemKind::Accessory,
            _ => ItemKind::Rune,
        };
        let rarity = match (packed >> 32) & 0xff {
            0 => Rarity::Common,
            1 => Rarity::Rare,
            2 => Rarity::Epic,
            _ => Rarity::Legendary,
        };
        ItemSpec {
            kind,
            rarity,
            power: (packed & 0xffff_ffff) as u32,
        }
    }

    fn save_run(env: &Env, key: &DataKey, state: &RunState) {
        env.storage().persistent().set(key, state);
        env.storage()
            .persistent()
            .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    fn contracts(env: &Env) -> Result<(Address, Address), Error> {
        let loot = env
            .storage()
            .instance()
            .get(&DataKey::LootRegistry)
            .ok_or(Error::NotConfigured)?;
        let claims = env
            .storage()
            .instance()
            .get(&DataKey::DungeonClaims)
            .ok_or(Error::NotConfigured)?;
        Ok((loot, claims))
    }

    fn require_admin(env: &Env) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("admin not set");
        admin.require_auth();
    }
}

#[cfg(test)]
mod test;
