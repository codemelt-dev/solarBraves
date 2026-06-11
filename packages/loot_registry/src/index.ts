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
		contractId: "CD4M4GJOV6LV6FB26P3IUDMVX5SCCV6CSHG66WTNQ2KZN3YHSQA6HDWW",
	},
} as const

export const Errors = {
	/**
	 * The minter (RunSession contract) has not been configured yet
	 */
	1: { message: "MinterNotSet" },
	/**
	 * The player has no dungeon keys to burn
	 */
	2: { message: "NoKeys" },
}

/**
 * Item category. Keep in sync with the mirror in run-session.
 */
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

/**
 * An item in a player's inventory.
 */
export interface Item {
	id: u64
	kind: ItemKind
	power: u32
	rarity: Rarity
}

/**
 * A rolled-but-unminted item; gets an id on safe exit.
 */
export interface ItemSpec {
	kind: ItemKind
	power: u32
	rarity: Rarity
}

export type DataKey =
	| { tag: "Admin"; values: void }
	| { tag: "Minter"; values: void }
	| { tag: "NextId"; values: void }
	| { tag: "Inventory"; values: readonly [string] }
	| { tag: "Keys"; values: readonly [string] }

export interface Client {
	/**
	 * Construct and simulate a set_minter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Set who can mint items and burn keys (the RunSession contract). Admin only.
	 */
	set_minter: (
		{ minter }: { minter: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a mint transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Mint items into a player's inventory. Minter only.
	 */
	mint: (
		{ to, specs }: { to: string; specs: Array<ItemSpec> },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<Array<Item>>>>

	/**
	 * Construct and simulate a grant_keys transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Grant keys to a player. Minter only.
	 */
	grant_keys: (
		{ to, amount }: { to: string; amount: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a airdrop_keys transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Key faucet for demos. Admin only.
	 */
	airdrop_keys: (
		{ to, amount }: { to: string; amount: u32 },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a burn_key transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Burn one key, used on premium entry. Minter only.
	 */
	burn_key: (
		{ from }: { from: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a inventory transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * A player's full inventory.
	 */
	inventory: (
		{ owner }: { owner: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Array<Item>>>

	/**
	 * Construct and simulate a key_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * A player's dungeon key balance.
	 */
	key_balance: (
		{ owner }: { owner: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<u32>>

	/**
	 * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Current admin.
	 */
	admin: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<string>>>

	/**
	 * Construct and simulate a minter transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Current minter, if configured.
	 */
	minter: (
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
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAgAAADxUaGUgbWludGVyIChSdW5TZXNzaW9uIGNvbnRyYWN0KSBoYXMgbm90IGJlZW4gY29uZmlndXJlZCB5ZXQAAAAMTWludGVyTm90U2V0AAAAAQAAACZUaGUgcGxheWVyIGhhcyBubyBkdW5nZW9uIGtleXMgdG8gYnVybgAAAAAABk5vS2V5cwAAAAAAAg==",
				"AAAABQAAAAAAAAAAAAAABE1pbnQAAAABAAAABG1pbnQAAAACAAAAAAAAAAJ0bwAAAAAAEwAAAAEAAAAAAAAABWNvdW50AAAAAAAABAAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAACEtleUdyYW50AAAAAQAAAAlrZXlfZ3JhbnQAAAAAAAADAAAAAAAAAAJ0bwAAAAAAEwAAAAEAAAAAAAAABmFtb3VudAAAAAAABAAAAAAAAAAAAAAAB2JhbGFuY2UAAAAABAAAAAAAAAAC",
				"AAAABQAAAAAAAAAAAAAAB0tleUJ1cm4AAAAAAQAAAAhrZXlfYnVybgAAAAIAAAAAAAAABGZyb20AAAATAAAAAQAAAAAAAAAHYmFsYW5jZQAAAAAEAAAAAAAAAAI=",
				"AAAAAgAAADtJdGVtIGNhdGVnb3J5LiBLZWVwIGluIHN5bmMgd2l0aCB0aGUgbWlycm9yIGluIHJ1bi1zZXNzaW9uLgAAAAAAAAAACEl0ZW1LaW5kAAAABAAAAAAAAAAAAAAABldlYXBvbgAAAAAAAAAAAAAAAAAFQXJtb3IAAAAAAAAAAAAAAAAAAAlBY2Nlc3NvcnkAAAAAAAAAAAAAAAAAAARSdW5l",
				"AAAAAgAAAAAAAAAAAAAABlJhcml0eQAAAAAABAAAAAAAAAAAAAAABkNvbW1vbgAAAAAAAAAAAAAAAAAEUmFyZQAAAAAAAAAAAAAABEVwaWMAAAAAAAAAAAAAAAlMZWdlbmRhcnkAAAA=",
				"AAAAAQAAACBBbiBpdGVtIGluIGEgcGxheWVyJ3MgaW52ZW50b3J5LgAAAAAAAAAESXRlbQAAAAQAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAARraW5kAAAH0AAAAAhJdGVtS2luZAAAAAAAAAAFcG93ZXIAAAAAAAAEAAAAAAAAAAZyYXJpdHkAAAAAB9AAAAAGUmFyaXR5AAA=",
				"AAAAAQAAADRBIHJvbGxlZC1idXQtdW5taW50ZWQgaXRlbTsgZ2V0cyBhbiBpZCBvbiBzYWZlIGV4aXQuAAAAAAAAAAhJdGVtU3BlYwAAAAMAAAAAAAAABGtpbmQAAAfQAAAACEl0ZW1LaW5kAAAAAAAAAAVwb3dlcgAAAAAAAAQAAAAAAAAABnJhcml0eQAAAAAH0AAAAAZSYXJpdHkAAA==",
				"AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAGTWludGVyAAAAAAAAAAAAAAAAAAZOZXh0SWQAAAAAAAEAAAAAAAAACUludmVudG9yeQAAAAAAAAEAAAATAAAAAQAAAAAAAAAES2V5cwAAAAEAAAAT",
				"AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
				"AAAAAAAAAEtTZXQgd2hvIGNhbiBtaW50IGl0ZW1zIGFuZCBidXJuIGtleXMgKHRoZSBSdW5TZXNzaW9uIGNvbnRyYWN0KS4gQWRtaW4gb25seS4AAAAACnNldF9taW50ZXIAAAAAAAEAAAAAAAAABm1pbnRlcgAAAAAAEwAAAAA=",
				"AAAAAAAAADJNaW50IGl0ZW1zIGludG8gYSBwbGF5ZXIncyBpbnZlbnRvcnkuIE1pbnRlciBvbmx5LgAAAAAABG1pbnQAAAACAAAAAAAAAAJ0bwAAAAAAEwAAAAAAAAAFc3BlY3MAAAAAAAPqAAAH0AAAAAhJdGVtU3BlYwAAAAEAAAPpAAAD6gAAB9AAAAAESXRlbQAAAAM=",
				"AAAAAAAAACRHcmFudCBrZXlzIHRvIGEgcGxheWVyLiBNaW50ZXIgb25seS4AAAAKZ3JhbnRfa2V5cwAAAAAAAgAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAABAAAAAEAAAPpAAAD7QAAAAAAAAAD",
				"AAAAAAAAACFLZXkgZmF1Y2V0IGZvciBkZW1vcy4gQWRtaW4gb25seS4AAAAAAAAMYWlyZHJvcF9rZXlzAAAAAgAAAAAAAAACdG8AAAAAABMAAAAAAAAABmFtb3VudAAAAAAABAAAAAA=",
				"AAAAAAAAADFCdXJuIG9uZSBrZXksIHVzZWQgb24gcHJlbWl1bSBlbnRyeS4gTWludGVyIG9ubHkuAAAAAAAACGJ1cm5fa2V5AAAAAQAAAAAAAAAEZnJvbQAAABMAAAABAAAD6QAAA+0AAAAAAAAAAw==",
				"AAAAAAAAABpBIHBsYXllcidzIGZ1bGwgaW52ZW50b3J5LgAAAAAACWludmVudG9yeQAAAAAAAAEAAAAAAAAABW93bmVyAAAAAAAAEwAAAAEAAAPqAAAH0AAAAARJdGVt",
				"AAAAAAAAAB9BIHBsYXllcidzIGR1bmdlb24ga2V5IGJhbGFuY2UuAAAAAAtrZXlfYmFsYW5jZQAAAAABAAAAAAAAAAVvd25lcgAAAAAAABMAAAABAAAABA==",
				"AAAAAAAAAA5DdXJyZW50IGFkbWluLgAAAAAABWFkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
				"AAAAAAAAAB5DdXJyZW50IG1pbnRlciwgaWYgY29uZmlndXJlZC4AAAAAAAZtaW50ZXIAAAAAAAAAAAABAAAD6AAAABM=",
				"AAAAAAAAACBVcGdyYWRlIHRvIG5ldyB3YXNtLiBBZG1pbiBvbmx5LgAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		set_minter: this.txFromJSON<null>,
		mint: this.txFromJSON<Result<Array<Item>>>,
		grant_keys: this.txFromJSON<Result<void>>,
		airdrop_keys: this.txFromJSON<null>,
		burn_key: this.txFromJSON<Result<void>>,
		inventory: this.txFromJSON<Array<Item>>,
		key_balance: this.txFromJSON<u32>,
		admin: this.txFromJSON<Option<string>>,
		minter: this.txFromJSON<Option<string>>,
		upgrade: this.txFromJSON<null>,
	}
}
