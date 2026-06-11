#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, vec, Address, Env};

fn setup() -> (Env, LootRegistryClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let minter = Address::generate(&env);
    let contract_id = env.register(LootRegistry, (&admin,));
    let client = LootRegistryClient::new(&env, &contract_id);
    client.set_minter(&minter);
    (env, client, admin, minter)
}

fn spec(kind: ItemKind, rarity: Rarity, power: u32) -> ItemSpec {
    ItemSpec { kind, rarity, power }
}

#[test]
fn mint_assigns_sequential_ids_and_accumulates() {
    let (env, client, _, _) = setup();
    let player = Address::generate(&env);

    let minted = client.mint(
        &player,
        &vec![
            &env,
            spec(ItemKind::Weapon, Rarity::Common, 12),
            spec(ItemKind::Rune, Rarity::Epic, 40),
        ],
    );
    assert_eq!(minted.len(), 2);
    assert_eq!(minted.get(0).unwrap().id, 1);
    assert_eq!(minted.get(1).unwrap().id, 2);

    client.mint(&player, &vec![&env, spec(ItemKind::Armor, Rarity::Rare, 25)]);

    let inventory = client.inventory(&player);
    assert_eq!(inventory.len(), 3);
    assert_eq!(inventory.get(2).unwrap().id, 3);
    assert_eq!(inventory.get(2).unwrap().kind, ItemKind::Armor);
}

#[test]
fn mint_fails_without_minter_configured() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(LootRegistry, (&admin,));
    let client = LootRegistryClient::new(&env, &contract_id);
    let player = Address::generate(&env);

    let result = client.try_mint(&player, &vec![&env, spec(ItemKind::Weapon, Rarity::Common, 1)]);
    assert_eq!(result, Err(Ok(Error::MinterNotSet)));
}

#[test]
fn mint_requires_minter_auth() {
    let (env, client, _, _) = setup();
    let player = Address::generate(&env);

    // Drop all auth mocks: the call must now fail auth for the minter.
    env.set_auths(&[]);
    let result = client.try_mint(&player, &vec![&env, spec(ItemKind::Weapon, Rarity::Common, 1)]);
    assert!(result.is_err());
}

#[test]
fn key_lifecycle() {
    let (env, client, _, _) = setup();
    let player = Address::generate(&env);

    assert_eq!(client.key_balance(&player), 0);
    assert_eq!(client.try_burn_key(&player), Err(Ok(Error::NoKeys)));

    client.airdrop_keys(&player, &2);
    client.grant_keys(&player, &1);
    assert_eq!(client.key_balance(&player), 3);

    client.burn_key(&player);
    assert_eq!(client.key_balance(&player), 2);
}

#[test]
fn empty_inventory_is_empty_vec() {
    let (env, client, _, _) = setup();
    let player = Address::generate(&env);
    assert_eq!(client.inventory(&player).len(), 0);
}
