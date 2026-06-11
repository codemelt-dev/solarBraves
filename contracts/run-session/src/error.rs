#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// LootRegistry / DungeonClaims addresses have not been configured yet
    NotConfigured = 1,
    /// The player already has an active run; exit or wipe it first
    RunActive = 2,
    /// The player has no active run
    NoActiveRun = 3,
    /// The dungeon is fully cleared; the only remaining move is exit_safe
    MustExit = 4,
    /// Premium entry failed: the player has no key to burn
    NoKey = 5,
}
