// Frontend mirrors of the contract types. Once the TS bindings are
// generated these can be swapped for the package exports.

export type ItemKind = "Weapon" | "Armor" | "Accessory" | "Rune"
export type Rarity = "Common" | "Rare" | "Epic" | "Legendary"

export interface Item {
	id: number
	kind: ItemKind
	rarity: Rarity
	power: number
}

export interface RunRecord {
	dungeonId: number
	premium: boolean
	floorsCleared: number
	items: number
	keysFound: number
	outcome: "Claimed" | "Wiped"
	/** ledger sequence the run was recorded at */
	ledger: number
}

export interface Dungeon {
	id: number
	name: string
	tagline: string
	premium: boolean
}

export const DUNGEONS: Dungeon[] = [
	{
		id: 1,
		name: "Cinder Hollow",
		tagline: "Collapsed mineshafts lit by dying embers.",
		premium: false,
	},
	{
		id: 2,
		name: "The Sunken Choir",
		tagline: "A drowned cathedral that still sings.",
		premium: false,
	},
	{
		id: 7,
		name: "Vault of the Solar King",
		tagline: "Sealed by key. Twice the risk, twice the spoils.",
		premium: true,
	},
]

export const MAX_FLOORS = 5

export const RARITY_COLOR: Record<Rarity, string> = {
	Common: "text-ash",
	Rare: "text-blue-400",
	Epic: "text-arcane",
	Legendary: "text-solar",
}

export const RARITY_RING: Record<Rarity, string> = {
	Common: "border-edge",
	Rare: "border-blue-400/40",
	Epic: "border-arcane/40",
	Legendary: "border-solar/50",
}
