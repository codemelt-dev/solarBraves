#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup() -> (Env, DungeonClaimsClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let recorder = Address::generate(&env);
    let contract_id = env.register(DungeonClaims, (&admin,));
    let client = DungeonClaimsClient::new(&env, &contract_id);
    client.set_recorder(&recorder);
    (env, client, recorder)
}

#[test]
fn records_history_and_stats() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);

    client.record_run(&player, &1, &false, &3, &4, &1, &RunOutcome::Claimed);
    client.record_run(&player, &2, &true, &2, &3, &0, &RunOutcome::Wiped);

    let history = client.history(&player);
    assert_eq!(history.len(), 2);
    let first = history.get(0).unwrap();
    assert_eq!(first.dungeon_id, 1);
    assert_eq!(first.floors_cleared, 3);
    assert_eq!(first.outcome, RunOutcome::Claimed);
    let second = history.get(1).unwrap();
    assert_eq!(second.premium, true);
    assert_eq!(second.outcome, RunOutcome::Wiped);

    let stats = client.stats();
    assert_eq!(stats.total_runs, 2);
    assert_eq!(stats.claimed, 1);
    assert_eq!(stats.wiped, 1);
    assert_eq!(stats.keys_burned, 1);
    assert_eq!(stats.items_claimed, 4);
    assert_eq!(stats.items_lost, 3);
}

#[test]
fn record_fails_without_recorder_configured() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(DungeonClaims, (&admin,));
    let client = DungeonClaimsClient::new(&env, &contract_id);
    let player = Address::generate(&env);

    let result =
        client.try_record_run(&player, &1, &false, &1, &1, &0, &RunOutcome::Claimed);
    assert_eq!(result, Err(Ok(Error::RecorderNotSet)));
}

#[test]
fn record_requires_recorder_auth() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);

    env.set_auths(&[]);
    let result =
        client.try_record_run(&player, &1, &false, &1, &1, &0, &RunOutcome::Claimed);
    assert!(result.is_err());
}

#[test]
fn empty_history_and_zero_stats() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);
    assert_eq!(client.history(&player).len(), 0);
    assert_eq!(client.stats(), Stats::zero());
}
