use soroban_sdk::{contractevent, Address};

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Mint {
    #[topic]
    pub to: Address,
    pub count: u32,
}

// balance below is the total after the change
#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct KeyGrant {
    #[topic]
    pub to: Address,
    pub amount: u32,
    pub balance: u32,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct KeyBurn {
    #[topic]
    pub from: Address,
    pub balance: u32,
}
