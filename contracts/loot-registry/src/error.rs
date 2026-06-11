#[soroban_sdk::contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// The minter (RunSession contract) has not been configured yet
    MinterNotSet = 1,
    /// The player has no dungeon keys to burn
    NoKeys = 2,
}
