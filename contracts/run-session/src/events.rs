use soroban_sdk::{contractevent, Address};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunStarted {
    #[topic]
    pub player: Address,
    pub dungeon_id: u32,
    pub premium: bool,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FloorCleared {
    #[topic]
    pub player: Address,
    pub floor: u32,
    pub pending: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LootClaimed {
    #[topic]
    pub player: Address,
    pub floors_cleared: u32,
    pub items: u32,
    pub keys_found: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunWiped {
    #[topic]
    pub player: Address,
    pub items_lost: u32,
}
