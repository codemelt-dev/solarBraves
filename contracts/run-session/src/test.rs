#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

use dungeon_claims::{DungeonClaims, DungeonClaimsClient, RunOutcome as ClaimsOutcome};
use loot_registry::{LootRegistry, LootRegistryClient};

struct World<'a> {
    env: Env,
    session: RunSessionClient<'a>,
    registry: LootRegistryClient<'a>,
    claims: DungeonClaimsClient<'a>,
    player: Address,
}

fn setup() -> World<'static> {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let player = Address::generate(&env);

    let registry_id = env.register(LootRegistry, (&admin,));
    let claims_id = env.register(DungeonClaims, (&admin,));
    let session_id = env.register(RunSession, (&admin,));

    let registry = LootRegistryClient::new(&env, &registry_id);
    let claims = DungeonClaimsClient::new(&env, &claims_id);
    let session = RunSessionClient::new(&env, &session_id);

    // wire everything together
    registry.set_minter(&session_id);
    claims.set_recorder(&session_id);
    session.configure(&registry_id, &claims_id);

    World { env, session, registry, claims, player }
}

#[test]
fn full_run_clear_floors_and_claim() {
    let w = setup();

    let state = w.session.start_run(&w.player, &1, &false);
    assert_eq!(state.floor, 1);
    assert_eq!(state.risk_bps, 100);
    assert_eq!(state.pending.len(), 0);

    let state = w.session.clear_floor(&w.player);
    assert_eq!(state.floor, 2);
    assert_eq!(state.risk_bps, 125);
    assert_eq!(state.pending.len(), 1);

    let state = w.session.clear_floor(&w.player);
    let state2 = w.session.clear_floor(&w.player);
    assert_eq!(state2.floor, 4);
    assert_eq!(state2.pending.len(), state.pending.len() + 1);

    let minted = w.session.exit_safe(&w.player);
    assert_eq!(minted.len(), 3);

    // Loot landed in the registry inventory.
    let inventory = w.registry.inventory(&w.player);
    assert_eq!(inventory.len(), 3);
    assert!(inventory.get(0).unwrap().power > 0);

    // Run recorded in claims.
    let history = w.claims.history(&w.player);
    assert_eq!(history.len(), 1);
    let record = history.get(0).unwrap();
    assert_eq!(record.floors_cleared, 3);
    assert_eq!(record.items, 3);
    assert_eq!(record.outcome, ClaimsOutcome::Claimed);

    // Run is closed.
    assert_eq!(w.session.run(&w.player), None);
}

#[test]
fn boss_floor_drops_extra_loot_then_must_exit() {
    let w = setup();
    w.session.start_run(&w.player, &1, &false);

    for _ in 0..MAX_FLOORS - 1 {
        w.session.clear_floor(&w.player);
    }
    // Boss floor: 3 drops instead of 1.
    let state = w.session.clear_floor(&w.player);
    assert_eq!(state.pending.len(), (MAX_FLOORS - 1) + 3);

    // Dungeon fully cleared - only exit remains.
    assert_eq!(
        w.session.try_clear_floor(&w.player),
        Err(Ok(Error::MustExit))
    );

    let minted = w.session.exit_safe(&w.player);
    assert_eq!(minted.len(), (MAX_FLOORS - 1) + 3);
}

#[test]
fn wipe_loses_pending_loot() {
    let w = setup();
    w.session.start_run(&w.player, &1, &false);
    w.session.clear_floor(&w.player);
    w.session.clear_floor(&w.player);

    w.session.wipe(&w.player);

    // Nothing minted; run closed; wipe recorded with the loss.
    assert_eq!(w.registry.inventory(&w.player).len(), 0);
    assert_eq!(w.session.run(&w.player), None);
    let record = w.claims.history(&w.player).get(0).unwrap();
    assert_eq!(record.outcome, ClaimsOutcome::Wiped);
    assert_eq!(record.items, 2);
    assert_eq!(w.claims.stats().items_lost, 2);
}

#[test]
fn one_active_run_per_player() {
    let w = setup();
    w.session.start_run(&w.player, &1, &false);
    assert_eq!(
        w.session.try_start_run(&w.player, &2, &false),
        Err(Ok(Error::RunActive))
    );
}

#[test]
fn premium_run_burns_a_key() {
    let w = setup();

    // No key → no premium entry.
    assert_eq!(
        w.session.try_start_run(&w.player, &7, &true),
        Err(Ok(Error::NoKey))
    );

    w.registry.airdrop_keys(&w.player, &1);
    let state = w.session.start_run(&w.player, &7, &true);
    assert_eq!(state.premium, true);
    assert_eq!(state.risk_bps, 200);
    assert_eq!(w.registry.key_balance(&w.player), 0);

    // Premium loot is scaled by the hotter multiplier (power lives in the
    // low 32 bits of the packed item).
    let state = w.session.clear_floor(&w.player);
    assert!((state.pending.get(0).unwrap() & 0xffff_ffff) >= 20);

    w.session.exit_safe(&w.player);
    assert_eq!(w.claims.stats().keys_burned, 1);
}

#[test]
fn exit_without_clearing_anything_is_allowed() {
    let w = setup();
    w.session.start_run(&w.player, &1, &false);
    let minted = w.session.exit_safe(&w.player);
    assert_eq!(minted.len(), 0);
    let record = w.claims.history(&w.player).get(0).unwrap();
    assert_eq!(record.floors_cleared, 0);
}

#[test]
fn actions_require_active_run() {
    let w = setup();
    assert_eq!(
        w.session.try_clear_floor(&w.player),
        Err(Ok(Error::NoActiveRun))
    );
    assert_eq!(w.session.try_exit_safe(&w.player), Err(Ok(Error::NoActiveRun)));
    assert_eq!(w.session.try_wipe(&w.player), Err(Ok(Error::NoActiveRun)));
}

#[test]
fn player_auth_is_required() {
    let w = setup();
    w.env.set_auths(&[]);
    assert!(w.session.try_start_run(&w.player, &1, &false).is_err());
}
