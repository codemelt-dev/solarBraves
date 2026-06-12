use soroban_sdk::{contracttype, Address, Vec};

// Mirrors of types from loot-registry and dungeon-claims. Soroban encodes
// these structurally, so identical definitions cross the contract boundary
// fine. Keep in sync.

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ItemKind {
    Weapon,
    Armor,
    Accessory,
    Rune,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Rarity {
    Common,
    Rare,
    Epic,
    Legendary,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Item {
    pub id: u64,
    pub kind: ItemKind,
    pub rarity: Rarity,
    pub power: u32,
}

/// Loot rolled during a run, not minted yet.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ItemSpec {
    pub kind: ItemKind,
    pub rarity: Rarity,
    pub power: u32,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RunOutcome {
    Claimed,
    Wiped,
}

/// A player's active run. One per address.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunState {
    pub player: Address,
    pub dungeon_id: u32,
    pub premium: bool,
    /// Current floor, 1-based.
    pub floor: u32,
    /// Basis points, 100 = 1x. Grows each floor and scales loot power.
    pub risk_bps: u32,
    /// At-stake loot, packed as kind|rarity|power into a u64 (see lib.rs).
    /// Packed on purpose: Soroban fixes a transaction's footprint at
    /// simulation time, and the PRNG re-rolls at apply time - symbol-encoded
    /// enum variants vary in byte size, so storing them here would make the
    /// write size non-deterministic and fail with ResourceLimitExceeded.
    pub pending: Vec<u64>,
    /// Ledger sequence at run start.
    pub started: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    LootRegistry,
    DungeonClaims,
    Run(Address),
}
