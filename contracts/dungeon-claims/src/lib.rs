//! DungeonClaims — run history and aggregate stats.
//!
//! Append-only, written only by the configured recorder (RunSession),
//! so the record can't be forged. Premium entries double as key burns.
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, BytesN, Env, Vec};

mod error;
mod events;
mod types;

use events::RunRecorded;
pub use error::Error;
pub use types::{DataKey, RunOutcome, RunRecord, Stats};

// bump persistent entries to ~30 days when they drop below ~15
const TTL_THRESHOLD: u32 = 259_200;
const TTL_EXTEND_TO: u32 = 518_400;

#[contract]
pub struct DungeonClaims;

#[contractimpl]
impl DungeonClaims {
    pub fn __constructor(env: &Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Stats, &Stats::zero());
    }

    /// Set who can record runs (the RunSession contract). Admin only.
    pub fn set_recorder(env: &Env, recorder: Address) {
        Self::require_admin(env);
        env.storage().instance().set(&DataKey::Recorder, &recorder);
    }

    /// Record a finished run. Recorder only.
    #[allow(clippy::too_many_arguments)]
    pub fn record_run(
        env: &Env,
        player: Address,
        dungeon_id: u32,
        premium: bool,
        floors_cleared: u32,
        items: u32,
        keys_found: u32,
        outcome: RunOutcome,
    ) -> Result<(), Error> {
        Self::require_recorder(env)?;

        let record = RunRecord {
            dungeon_id,
            premium,
            floors_cleared,
            items,
            keys_found,
            outcome,
            ledger: env.ledger().sequence(),
        };

        let key = DataKey::History(player.clone());
        let mut history: Vec<RunRecord> = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| Vec::new(env));
        history.push_back(record);
        env.storage().persistent().set(&key, &history);
        env.storage()
            .persistent()
            .extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);

        let mut stats: Stats = env
            .storage()
            .instance()
            .get(&DataKey::Stats)
            .unwrap_or_else(Stats::zero);
        stats.total_runs += 1;
        if premium {
            stats.keys_burned += 1;
        }
        match outcome {
            RunOutcome::Claimed => {
                stats.claimed += 1;
                stats.items_claimed += items;
            }
            RunOutcome::Wiped => {
                stats.wiped += 1;
                stats.items_lost += items;
            }
        }
        env.storage().instance().set(&DataKey::Stats, &stats);

        RunRecorded {
            player,
            dungeon_id,
            outcome,
            floors_cleared,
            items,
            keys_found,
        }
        .publish(env);
        Ok(())
    }

    /// A player's full run history.
    pub fn history(env: &Env, player: Address) -> Vec<RunRecord> {
        env.storage()
            .persistent()
            .get(&DataKey::History(player))
            .unwrap_or_else(|| Vec::new(env))
    }

    /// Global aggregate stats.
    pub fn stats(env: &Env) -> Stats {
        env.storage()
            .instance()
            .get(&DataKey::Stats)
            .unwrap_or_else(Stats::zero)
    }

    /// Current admin.
    pub fn admin(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }

    /// Current recorder, if configured.
    pub fn recorder(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Recorder)
    }

    /// Upgrade to new wasm. Admin only.
    pub fn upgrade(env: &Env, new_wasm_hash: BytesN<32>) {
        Self::require_admin(env);
        env.deployer().update_current_contract_wasm(new_wasm_hash);
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
    fn require_recorder(env: &Env) -> Result<(), Error> {
        let recorder: Address = env
            .storage()
            .instance()
            .get(&DataKey::Recorder)
            .ok_or(Error::RecorderNotSet)?;
        recorder.require_auth();
        Ok(())
    }
}

#[cfg(test)]
mod test;
