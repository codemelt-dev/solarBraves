# Solar Braves

An on-chain dungeon crawler built on [Stellar](https://stellar.org) smart
contracts (Soroban). Connect a wallet, descend into a dungeon, clear floors to
earn loot - then decide: bank what you're carrying and walk out, or push deeper
and risk losing it all. Every run, item, and wipe is recorded on-chain.

Built with [Scaffold Stellar](https://github.com/stellar-scaffold/cli), React,
TypeScript, and Vite. Runs on Stellar **testnet**.

## How it plays

1. **Connect** a Stellar wallet (Freighter etc.) and fund it on testnet.
2. **Pick a dungeon** - Cinder Hollow, The Sunken Choir, or the premium Vault of
   the Solar King (requires a key, double the risk and the spoils).
3. **Clear floors** (up to 5). Each floor can drop Weapons, Armor, Accessories,
   and Runes in Common → Legendary rarities.
4. **Exit safe** to bank your haul into your on-chain inventory, or keep
   descending. A **wipe** ends the run and the loot is gone.
5. Your full run history - claims and wipes - lives in the **History** page,
   read straight from the contract.

## Contracts (testnet)

| Contract         | ID                                                                                                                                                                      | Role                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `run_session`    | [`CDTICLOD7G4OLZEJHJBBLJQQQE6I3YW4OUCCQXK6XGFX6QTY7QQFLSTR`](https://stellar.expert/explorer/testnet/contract/CDTICLOD7G4OLZEJHJBBLJQQQE6I3YW4OUCCQXK6XGFX6QTY7QQFLSTR) | Game loop: `start_run`, `clear_floor`, `exit_safe`, `wipe`. Orchestrates the other two contracts. |
| `loot_registry`  | [`CD4M4GJOV6LV6FB26P3IUDMVX5SCCV6CSHG66WTNQ2KZN3YHSQA6HDWW`](https://stellar.expert/explorer/testnet/contract/CD4M4GJOV6LV6FB26P3IUDMVX5SCCV6CSHG66WTNQ2KZN3YHSQA6HDWW) | Items and keys: minting, `inventory`, `key_balance`, `burn_key`.                                  |
| `dungeon_claims` | [`CC5UKSPM4GNWK5L66NKIU5VBJEEXT55ODIFTNKFNZAIJ4TAEKTDNH3SS`](https://stellar.expert/explorer/testnet/contract/CC5UKSPM4GNWK5L66NKIU5VBJEEXT55ODIFTNKFNZAIJ4TAEKTDNH3SS) | Permanent record: `record_run`, per-player `history`, global `stats`.                             |

The Rust sources live in [`contracts/`](contracts/); the generated TypeScript
clients live in [`packages/`](packages/) and are wired up in
[`src/contracts/`](src/contracts/).

## Local development

Requirements: [Rust](https://www.rust-lang.org/tools/install),
[Node.js](https://nodejs.org) v22+ / [Bun](https://bun.sh),
[Stellar CLI](https://developers.stellar.org/docs/tools/cli) with the
[Scaffold Stellar plugin](https://github.com/stellar-scaffold/cli).

```bash
# environment (testnet config is in the committed example)
cp .env.example .env

# install dependencies
bun install

# start dev server - also watches contracts and regenerates clients
bun run dev
```

To build for production (same as the Vercel build):

```bash
bun run build
```

This compiles the TypeScript clients in `packages/*`, type-checks the app, and
bundles with Vite.

### Frontend environment variables

Set these (also required on Vercel - Vite bakes them in at build time):

```
PUBLIC_STELLAR_NETWORK=TESTNET
PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
```

## Project structure

```
├── contracts/           # Soroban smart contracts (Rust)
│   ├── run-session/     #   game loop, calls into the other two
│   ├── loot-registry/   #   items + premium keys
│   └── dungeon-claims/  #   run history + global stats
├── packages/            # generated TypeScript contract clients
├── src/
│   ├── contracts/       # client instances bound to testnet contract IDs
│   ├── game/            # game state hook, types, conversions
│   ├── components/      # UI components
│   └── pages/           # Home, Play, Inventory, History, Debug
└── environments.toml    # scaffold network/contract configuration
```

## Redeploying contracts

Contracts are deployed with `stellar registry` (see the
[Scaffold Stellar docs](https://github.com/stellar-scaffold/cli)). After a
redeploy, regenerate the clients locally (`bun run dev` does this) and commit
the updated `packages/` and `src/contracts/` so CI/Vercel pick up the new IDs.

## License

[MIT](LICENSE)
