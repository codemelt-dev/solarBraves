// Generated bindings encode enums as { tag: "Weapon" } and u64 as bigint.
// Flatten them into the plain shapes the UI renders.

import { type RunRecord as ContractRunRecord } from "dungeon_claims"
import {
	type Item as ContractItem,
	type RunState as ContractRunState,
} from "run_session"
import { type Item, type ItemKind, type Rarity, type RunRecord } from "./types"

export interface RunState {
	dungeonId: number
	premium: boolean
	floor: number
	riskBps: number
	pending: Item[]
}

export const toItem = (it: ContractItem): Item => ({
	id: Number(it.id),
	kind: it.kind.tag as ItemKind,
	rarity: it.rarity.tag as Rarity,
	power: it.power,
})

// Pending loot is stored packed: (kind << 40) | (rarity << 32) | power.
// The contract packs it so the storage write size never depends on what the
// PRNG rolls (Soroban footprints are fixed at simulation time).
const KINDS: ItemKind[] = ["Weapon", "Armor", "Accessory", "Rune"]
const RARITIES: Rarity[] = ["Common", "Rare", "Epic", "Legendary"]

// pending loot has no id yet; synthesize one from the index for React keys
const toPending = (packed: bigint, i: number): Item => ({
	id: -(i + 1),
	kind: KINDS[Number((packed >> 40n) & 0xffn)] ?? "Weapon",
	rarity: RARITIES[Number((packed >> 32n) & 0xffn)] ?? "Common",
	power: Number(packed & 0xffffffffn),
})

export const toRunState = (run: ContractRunState): RunState => ({
	dungeonId: run.dungeon_id,
	premium: run.premium,
	floor: run.floor,
	riskBps: run.risk_bps,
	pending: run.pending.map(toPending),
})

export const toRecord = (rec: ContractRunRecord): RunRecord => ({
	dungeonId: rec.dungeon_id,
	premium: rec.premium,
	floorsCleared: rec.floors_cleared,
	items: rec.items,
	keysFound: rec.keys_found,
	outcome: rec.outcome.tag,
	ledger: rec.ledger,
})
