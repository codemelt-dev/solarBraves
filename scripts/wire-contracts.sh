#!/usr/bin/env bash
# Wire the Solar Braves contracts together after deploy:
#   loot_registry.set_minter(run_session)
#   dungeon_claims.set_recorder(run_session)
#   run_session.configure(loot_registry, dungeon_claims)
#
# Usage: ./scripts/wire-contracts.sh [network] [source]
#   network  defaults to "local"  (use "testnet" after a staging deploy)
#   source   defaults to "me"     (use "testnet-user" on testnet)
set -euo pipefail

NETWORK="${1:-local}"
SOURCE="${2:-me}"
IDS_DIR="$(dirname "$0")/../.config/stellar/contract-ids"

case "$NETWORK" in
  local) PASSPHRASE="Standalone Network ; February 2017" ;;
  testnet) PASSPHRASE="Test SDF Network ; September 2015" ;;
  mainnet|public) PASSPHRASE="Public Global Stellar Network ; September 2015" ;;
  *) echo "unknown network: $NETWORK" >&2; exit 1 ;;
esac

id_for() {
  # alias files: { "ids": { "<network passphrase>": "C..." } }
  python3 -c "import json,sys; print(json.load(open('$IDS_DIR/$1.json'))['ids']['$PASSPHRASE'])"
}

LOOT=$(id_for loot_registry)
CLAIMS=$(id_for dungeon_claims)
SESSION=$(id_for run_session)

echo "loot_registry:  $LOOT"
echo "dungeon_claims: $CLAIMS"
echo "run_session:    $SESSION"

stellar contract invoke --id "$LOOT" --source "$SOURCE" --network "$NETWORK" -- \
  set_minter --minter "$SESSION"
echo "✓ set_minter"

stellar contract invoke --id "$CLAIMS" --source "$SOURCE" --network "$NETWORK" -- \
  set_recorder --recorder "$SESSION"
echo "✓ set_recorder"

stellar contract invoke --id "$SESSION" --source "$SOURCE" --network "$NETWORK" -- \
  configure --loot_registry "$LOOT" --dungeon_claims "$CLAIMS"
echo "✓ configure"

echo "All wired."
