use soroban_sdk::{contracttype, Address};

/// How a run ended. Keep in sync with the mirror in run-session.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RunOutcome {
    Claimed,
    Wiped,
}

/// One finished run.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunRecord {
    pub dungeon_id: u32,
    /// Premium entry burned a key.
    pub premium: bool,
    pub floors_cleared: u32,
    /// Items claimed, or lost on a wipe.
    pub items: u32,
    pub keys_found: u32,
    pub outcome: RunOutcome,
    /// Ledger sequence when recorded.
    pub ledger: u32,
}

/// Aggregate stats across all players.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stats {
    pub total_runs: u32,
    pub claimed: u32,
    pub wiped: u32,
    pub keys_burned: u32,
    pub items_claimed: u32,
    pub items_lost: u32,
}

impl Stats {
    pub fn zero() -> Self {
        Stats {
            total_runs: 0,
            claimed: 0,
            wiped: 0,
            keys_burned: 0,
            items_claimed: 0,
            items_lost: 0,
        }
    }
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Recorder,
    History(Address),
    Stats,
}
