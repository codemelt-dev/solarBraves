use soroban_sdk::{contractevent, Address};

use crate::types::RunOutcome;

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RunRecorded {
    #[topic]
    pub player: Address,
    #[topic]
    pub dungeon_id: u32,
    pub outcome: RunOutcome,
    pub floors_cleared: u32,
    pub items: u32,
    pub keys_found: u32,
}
