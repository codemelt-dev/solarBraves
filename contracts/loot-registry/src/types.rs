use soroban_sdk::{contracttype, Address};

/// Item category. Keep in sync with the mirror in run-session.
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

/// An item in a player's inventory.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Item {
    pub id: u64,
    pub kind: ItemKind,
    pub rarity: Rarity,
    pub power: u32,
}

/// A rolled-but-unminted item; gets an id on safe exit.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ItemSpec {
    pub kind: ItemKind,
    pub rarity: Rarity,
    pub power: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Minter,
    NextId,
    Inventory(Address),
    Keys(Address),
}
