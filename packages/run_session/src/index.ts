import { Buffer } from "buffer"
import { Address } from "@stellar/stellar-sdk"
import {
	AssembledTransaction,
	Client as ContractClient,
	ClientOptions as ContractClientOptions,
	MethodOptions,
	Result,
	Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract"
import type {
	u32,
	i32,
	u64,
	i64,
	u128,
	i128,
	u256,
	i256,
	Option,
	Timepoint,
	Duration,
} from "@stellar/stellar-sdk/contract"
export * from "@stellar/stellar-sdk"
export * as contract from "@stellar/stellar-sdk/contract"
export * as rpc from "@stellar/stellar-sdk/rpc"

if (typeof window !== "undefined") {
	//@ts-ignore Buffer exists
	window.Buffer = window.Buffer || Buffer
}

export const networks = {
	testnet: {
		networkPassphrase: "Test SDF Network ; September 2015",
		contractId: "CDTICLOD7G4OLZEJHJBBLJQQQE6I3YW4OUCCQXK6XGFX6QTY7QQFLSTR",
	},
} as const

export const Errors = {
	/**
	 * LootRegistry / DungeonClaims addresses have not been configured yet
	 */
	1: { message: "NotConfigured" },
	/**
	 * The player already has an active run; exit or wipe it first
	 */
	2: { message: "RunActive" },
	/**
	 * The player has no active run
	 */
	3: { message: "NoActiveRun" },
	/**
	 * The dungeon is fully cleared; the only remaining move is exit_safe
	 */
	4: { message: "MustExit" },
	/**
	 * Premium entry failed: the player has no key to burn
	 */
	5: { message: "NoKey" },
}

export type ItemKind =
	| { tag: "Weapon"; values: void }
	| { tag: "Armor"; values: void }
	| { tag: "Accessory"; values: void }
	| { tag: "Rune"; values: void }

export type Rarity =
	| { tag: "Common"; values: void }
	| { tag: "Rare"; values: void }
	| { tag: "Epic"; values: void }
	| { tag: "Legendary"; values: void }

export interface Item {
	id: u64
	kind: ItemKind
	power: u32
	rarity: Rarity
}

/**
 * Loot rolled during a run, not minted yet.
 */
export interface ItemSpec {
	kind: ItemKind
	power: u32
	rarity: Rarity
}

export type RunOutcome =
	| { tag: "Claimed"; values: void }
	| { tag: "Wiped"; values: void }

/**
 * A player's active run. One per address.
 */
export interface RunState {
	dungeon_id: u32
	/**
	 * Current floor, 1-based.
	 */
	floor: u32
	/**
	 * At-stake loot, packed as kind|rarity|power into a u64 (see lib.rs).
	 * Packed on purpose: Soroban fixes a transaction's footprint at
	 * simulation time, and the PRNG re-rolls at apply time — symbol-encoded
	 * enum variants vary in byte size, so storing them here would make the
	 * write size non-deterministic and fail with ResourceLimitExceeded.
	 */
	pending: Array<u64>
	player: string
	premium: boolean
	/**
	 * Basis points, 100 = 1x. Grows each floor and scales loot power.
	 */
	risk_bps: u32
	/**
	 * Ledger sequence at run start.
	 */
	started: u32
}

export type DataKey =
	| { tag: "Admin"; values: void }
	| { tag: "LootRegistry"; values: void }
	| { tag: "DungeonClaims"; values: void }
	| { tag: "Run"; values: readonly [string] }

export interface Client {
	/**
	 * Construct and simulate a configure transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Set the LootRegistry and DungeonClaims addresses. Admin only.
	 */
	configure: (
		{
			loot_registry,
			dungeon_claims,
		}: { loot_registry: string; dungeon_claims: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a start_run transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Enter a dungeon. Premium entry burns a key. One active run per address.
	 */
	start_run: (
		{
			player,
			dungeon_id,
			premium,
		}: { player: string; dungeon_id: u32; premium: boolean },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<RunState>>>

	/**
	 * Construct and simulate a clear_floor transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Clear the current floor: roll loot, advance, bump the risk multiplier.
	 */
	clear_floor: (
		{ player }: { player: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<RunState>>>

	/**
	 * Construct and simulate a exit_safe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Bank the run: mint pending loot, maybe drop a key, record it, close.
	 */
	exit_safe: (
		{ player }: { player: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<Array<Item>>>>

	/**
	 * Construct and simulate a wipe transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Hero died. Run closes, pending loot is gone, wipe goes on record.
	 */
	wipe: (
		{ player }: { player: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a run transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * A player's active run, if any.
	 */
	run: (
		{ player }: { player: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<RunState>>>

	/**
	 * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Current admin.
	 */
	admin: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<string>>>

	/**
	 * Construct and simulate a upgrade transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Upgrade to new wasm. Admin only.
	 */
	upgrade: (
		{ new_wasm_hash }: { new_wasm_hash: Buffer },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>
}
export class Client extends ContractClient {
	static async deploy<T = Client>(
		/** Constructor/Initialization Args for the contract's `__constructor` method */
		{ admin }: { admin: string },
		/** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
		options: MethodOptions &
			Omit<ContractClientOptions, "contractId"> & {
				/** The hash of the Wasm blob, which must already be installed on-chain. */
				wasmHash: Buffer | string
				/** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
				salt?: Buffer | Uint8Array
				/** The format used to decode `wasmHash`, if it's provided as a string. */
				format?: "hex" | "base64"
			},
	): Promise<AssembledTransaction<T>> {
		return ContractClient.deploy({ admin }, options)
	}
	constructor(public readonly options: ContractClientOptions) {
		super(
			new ContractSpec([
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABQAAAENMb290UmVnaXN0cnkgLyBEdW5nZW9uQ2xhaW1zIGFkZHJlc3NlcyBoYXZlIG5vdCBiZWVuIGNvbmZpZ3VyZWQgeWV0AAAAAA1Ob3RDb25maWd1cmVkAAAAAAAAAQAAADtUaGUgcGxheWVyIGFscmVhZHkgaGFzIGFuIGFjdGl2ZSBydW47IGV4aXQgb3Igd2lwZSBpdCBmaXJzdAAAAAAJUnVuQWN0aXZlAAAAAAAAAgAAABxUaGUgcGxheWVyIGhhcyBubyBhY3RpdmUgcnVuAAAAC05vQWN0aXZlUnVuAAAAAAMAAABCVGhlIGR1bmdlb24gaXMgZnVsbHkgY2xlYXJlZDsgdGhlIG9ubHkgcmVtYWluaW5nIG1vdmUgaXMgZXhpdF9zYWZlAAAAAAAITXVzdEV4aXQAAAAEAAAAM1ByZW1pdW0gZW50cnkgZmFpbGVkOiB0aGUgcGxheWVyIGhhcyBubyBrZXkgdG8gYnVybgAAAAAFTm9LZXkAAAAAAAAF",
				"AAAABQAAAAAAAAAAAAAAClJ1blN0YXJ0ZWQAAAAAAAEAAAALcnVuX3N0YXJ0ZWQAAAAAAwAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAAKZHVuZ2Vvbl9pZAAAAAAABAAAAAAAAAAAAAAAB3ByZW1pdW0AAAAAAQAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAADEZsb29yQ2xlYXJlZAAAAAEAAAANZmxvb3JfY2xlYXJlZAAAAAAAAAMAAAAAAAAABnBsYXllcgAAAAAAEwAAAAEAAAAAAAAABWZsb29yAAAAAAAABAAAAAAAAAAAAAAAB3BlbmRpbmcAAAAABAAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAAC0xvb3RDbGFpbWVkAAAAAAEAAAAMbG9vdF9jbGFpbWVkAAAABAAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAAOZmxvb3JzX2NsZWFyZWQAAAAAAAQAAAAAAAAAAAAAAAVpdGVtcwAAAAAAAAQAAAAAAAAAAAAAAAprZXlzX2ZvdW5kAAAAAAAEAAAAAAAAAAI=",
				"AAAABQAAAAAAAAAAAAAACFJ1bldpcGVkAAAAAQAAAAlydW5fd2lwZWQAAAAAAAACAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAAAAAAAAppdGVtc19sb3N0AAAAAAAEAAAAAAAAAAI=",
				"AAAAAgAAAAAAAAAAAAAACEl0ZW1LaW5kAAAABAAAAAAAAAAAAAAABldlYXBvbgAAAAAAAAAAAAAAAAAFQXJtb3IAAAAAAAAAAAAAAAAAAAlBY2Nlc3NvcnkAAAAAAAAAAAAAAAAAAARSdW5l",
				"AAAAAgAAAAAAAAAAAAAABlJhcml0eQAAAAAABAAAAAAAAAAAAAAABkNvbW1vbgAAAAAAAAAAAAAAAAAEUmFyZQAAAAAAAAAAAAAABEVwaWMAAAAAAAAAAAAAAAlMZWdlbmRhcnkAAAA=",
				"AAAAAQAAAAAAAAAAAAAABEl0ZW0AAAAEAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEa2luZAAAB9AAAAAISXRlbUtpbmQAAAAAAAAABXBvd2VyAAAAAAAABAAAAAAAAAAGcmFyaXR5AAAAAAfQAAAABlJhcml0eQAA",
				"AAAAAQAAAClMb290IHJvbGxlZCBkdXJpbmcgYSBydW4sIG5vdCBtaW50ZWQgeWV0LgAAAAAAAAAAAAAISXRlbVNwZWMAAAADAAAAAAAAAARraW5kAAAH0AAAAAhJdGVtS2luZAAAAAAAAAAFcG93ZXIAAAAAAAAEAAAAAAAAAAZyYXJpdHkAAAAAB9AAAAAGUmFyaXR5AAA=",
				"AAAAAgAAAAAAAAAAAAAAClJ1bk91dGNvbWUAAAAAAAIAAAAAAAAAAAAAAAdDbGFpbWVkAAAAAAAAAAAAAAAABVdpcGVkAAAA",
				"AAAAAQAAACdBIHBsYXllcidzIGFjdGl2ZSBydW4uIE9uZSBwZXIgYWRkcmVzcy4AAAAAAAAAAAhSdW5TdGF0ZQAAAAcAAAAAAAAACmR1bmdlb25faWQAAAAAAAQAAAAXQ3VycmVudCBmbG9vciwgMS1iYXNlZC4AAAAABWZsb29yAAAAAAAABAAAAVBBdC1zdGFrZSBsb290LCBwYWNrZWQgYXMga2luZHxyYXJpdHl8cG93ZXIgaW50byBhIHU2NCAoc2VlIGxpYi5ycykuClBhY2tlZCBvbiBwdXJwb3NlOiBTb3JvYmFuIGZpeGVzIGEgdHJhbnNhY3Rpb24ncyBmb290cHJpbnQgYXQKc2ltdWxhdGlvbiB0aW1lLCBhbmQgdGhlIFBSTkcgcmUtcm9sbHMgYXQgYXBwbHkgdGltZSDigJQgc3ltYm9sLWVuY29kZWQKZW51bSB2YXJpYW50cyB2YXJ5IGluIGJ5dGUgc2l6ZSwgc28gc3RvcmluZyB0aGVtIGhlcmUgd291bGQgbWFrZSB0aGUKd3JpdGUgc2l6ZSBub24tZGV0ZXJtaW5pc3RpYyBhbmQgZmFpbCB3aXRoIFJlc291cmNlTGltaXRFeGNlZWRlZC4AAAAHcGVuZGluZwAAAAPqAAAABgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAdwcmVtaXVtAAAAAAEAAAA/QmFzaXMgcG9pbnRzLCAxMDAgPSAxeC4gR3Jvd3MgZWFjaCBmbG9vciBhbmQgc2NhbGVzIGxvb3QgcG93ZXIuAAAAAAhyaXNrX2JwcwAAAAQAAAAdTGVkZ2VyIHNlcXVlbmNlIGF0IHJ1biBzdGFydC4AAAAAAAAHc3RhcnRlZAAAAAAE",
				"AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAMTG9vdFJlZ2lzdHJ5AAAAAAAAAAAAAAANRHVuZ2VvbkNsYWltcwAAAAAAAAEAAAAAAAAAA1J1bgAAAAABAAAAEw==",
				"AAAAAAAAAEZTZXQgdGhlIGFkbWluLiBXaXJlIHRoZSBvdGhlciBjb250cmFjdHMgd2l0aCBgY29uZmlndXJlYCBhZnRlciBkZXBsb3kuAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
				"AAAAAAAAAD1TZXQgdGhlIExvb3RSZWdpc3RyeSBhbmQgRHVuZ2VvbkNsYWltcyBhZGRyZXNzZXMuIEFkbWluIG9ubHkuAAAAAAAACWNvbmZpZ3VyZQAAAAAAAAIAAAAAAAAADWxvb3RfcmVnaXN0cnkAAAAAAAATAAAAAAAAAA5kdW5nZW9uX2NsYWltcwAAAAAAEwAAAAA=",
				"AAAAAAAAAEdFbnRlciBhIGR1bmdlb24uIFByZW1pdW0gZW50cnkgYnVybnMgYSBrZXkuIE9uZSBhY3RpdmUgcnVuIHBlciBhZGRyZXNzLgAAAAAJc3RhcnRfcnVuAAAAAAAAAwAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAApkdW5nZW9uX2lkAAAAAAAEAAAAAAAAAAdwcmVtaXVtAAAAAAEAAAABAAAD6QAAB9AAAAAIUnVuU3RhdGUAAAAD",
				"AAAAAAAAAEZDbGVhciB0aGUgY3VycmVudCBmbG9vcjogcm9sbCBsb290LCBhZHZhbmNlLCBidW1wIHRoZSByaXNrIG11bHRpcGxpZXIuAAAAAAALY2xlYXJfZmxvb3IAAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAA+kAAAfQAAAACFJ1blN0YXRlAAAAAw==",
				"AAAAAAAAAERCYW5rIHRoZSBydW46IG1pbnQgcGVuZGluZyBsb290LCBtYXliZSBkcm9wIGEga2V5LCByZWNvcmQgaXQsIGNsb3NlLgAAAAlleGl0X3NhZmUAAAAAAAABAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAABAAAD6QAAA+oAAAfQAAAABEl0ZW0AAAAD",
				"AAAAAAAAAEFIZXJvIGRpZWQuIFJ1biBjbG9zZXMsIHBlbmRpbmcgbG9vdCBpcyBnb25lLCB3aXBlIGdvZXMgb24gcmVjb3JkLgAAAAAAAAR3aXBlAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
				"AAAAAAAAAB5BIHBsYXllcidzIGFjdGl2ZSBydW4sIGlmIGFueS4AAAAAAANydW4AAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAA+gAAAfQAAAACFJ1blN0YXRl",
				"AAAAAAAAAA5DdXJyZW50IGFkbWluLgAAAAAABWFkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
				"AAAAAAAAACBVcGdyYWRlIHRvIG5ldyB3YXNtLiBBZG1pbiBvbmx5LgAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		configure: this.txFromJSON<null>,
		start_run: this.txFromJSON<Result<RunState>>,
		clear_floor: this.txFromJSON<Result<RunState>>,
		exit_safe: this.txFromJSON<Result<Array<Item>>>,
		wipe: this.txFromJSON<Result<void>>,
		run: this.txFromJSON<Option<RunState>>,
		admin: this.txFromJSON<Option<string>>,
		upgrade: this.txFromJSON<null>,
	}
}
