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
		contractId: "CC5UKSPM4GNWK5L66NKIU5VBJEEXT55ODIFTNKFNZAIJ4TAEKTDNH3SS",
	},
} as const

export const Errors = {
	/**
	 * The recorder (RunSession contract) has not been configured yet
	 */
	1: { message: "RecorderNotSet" },
}

/**
 * How a run ended. Keep in sync with the mirror in run-session.
 */
export type RunOutcome =
	| { tag: "Claimed"; values: void }
	| { tag: "Wiped"; values: void }

/**
 * One finished run.
 */
export interface RunRecord {
	dungeon_id: u32
	floors_cleared: u32
	/**
	 * Items claimed, or lost on a wipe.
	 */
	items: u32
	keys_found: u32
	/**
	 * Ledger sequence when recorded.
	 */
	ledger: u32
	outcome: RunOutcome
	/**
	 * Premium entry burned a key.
	 */
	premium: boolean
}

/**
 * Aggregate stats across all players.
 */
export interface Stats {
	claimed: u32
	items_claimed: u32
	items_lost: u32
	keys_burned: u32
	total_runs: u32
	wiped: u32
}

export type DataKey =
	| { tag: "Admin"; values: void }
	| { tag: "Recorder"; values: void }
	| { tag: "History"; values: readonly [string] }
	| { tag: "Stats"; values: void }

export interface Client {
	/**
	 * Construct and simulate a set_recorder transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Set who can record runs (the RunSession contract). Admin only.
	 */
	set_recorder: (
		{ recorder }: { recorder: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<null>>

	/**
	 * Construct and simulate a record_run transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Record a finished run. Recorder only.
	 */
	record_run: (
		{
			player,
			dungeon_id,
			premium,
			floors_cleared,
			items,
			keys_found,
			outcome,
		}: {
			player: string
			dungeon_id: u32
			premium: boolean
			floors_cleared: u32
			items: u32
			keys_found: u32
			outcome: RunOutcome
		},
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Result<void>>>

	/**
	 * Construct and simulate a history transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * A player's full run history.
	 */
	history: (
		{ player }: { player: string },
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Array<RunRecord>>>

	/**
	 * Construct and simulate a stats transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Global aggregate stats.
	 */
	stats: (options?: MethodOptions) => Promise<AssembledTransaction<Stats>>

	/**
	 * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Current admin.
	 */
	admin: (
		options?: MethodOptions,
	) => Promise<AssembledTransaction<Option<string>>>

	/**
	 * Construct and simulate a recorder transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
	 * Current recorder, if configured.
	 */
	recorder: (
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
				"AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAQAAAD5UaGUgcmVjb3JkZXIgKFJ1blNlc3Npb24gY29udHJhY3QpIGhhcyBub3QgYmVlbiBjb25maWd1cmVkIHlldAAAAAAADlJlY29yZGVyTm90U2V0AAAAAAAB",
				"AAAABQAAAAAAAAAAAAAAC1J1blJlY29yZGVkAAAAAAEAAAAMcnVuX3JlY29yZGVkAAAABgAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAAAAAAAAKZHVuZ2Vvbl9pZAAAAAAABAAAAAEAAAAAAAAAB291dGNvbWUAAAAH0AAAAApSdW5PdXRjb21lAAAAAAAAAAAAAAAAAA5mbG9vcnNfY2xlYXJlZAAAAAAABAAAAAAAAAAAAAAABWl0ZW1zAAAAAAAABAAAAAAAAAAAAAAACmtleXNfZm91bmQAAAAAAAQAAAAAAAAAAg==",
				"AAAAAgAAAD1Ib3cgYSBydW4gZW5kZWQuIEtlZXAgaW4gc3luYyB3aXRoIHRoZSBtaXJyb3IgaW4gcnVuLXNlc3Npb24uAAAAAAAAAAAAAApSdW5PdXRjb21lAAAAAAACAAAAAAAAAAAAAAAHQ2xhaW1lZAAAAAAAAAAAAAAAAAVXaXBlZAAAAA==",
				"AAAAAQAAABFPbmUgZmluaXNoZWQgcnVuLgAAAAAAAAAAAAAJUnVuUmVjb3JkAAAAAAAABwAAAAAAAAAKZHVuZ2Vvbl9pZAAAAAAABAAAAAAAAAAOZmxvb3JzX2NsZWFyZWQAAAAAAAQAAAAhSXRlbXMgY2xhaW1lZCwgb3IgbG9zdCBvbiBhIHdpcGUuAAAAAAAABWl0ZW1zAAAAAAAABAAAAAAAAAAKa2V5c19mb3VuZAAAAAAABAAAAB5MZWRnZXIgc2VxdWVuY2Ugd2hlbiByZWNvcmRlZC4AAAAAAAZsZWRnZXIAAAAAAAQAAAAAAAAAB291dGNvbWUAAAAH0AAAAApSdW5PdXRjb21lAAAAAAAbUHJlbWl1bSBlbnRyeSBidXJuZWQgYSBrZXkuAAAAAAdwcmVtaXVtAAAAAAE=",
				"AAAAAQAAACNBZ2dyZWdhdGUgc3RhdHMgYWNyb3NzIGFsbCBwbGF5ZXJzLgAAAAAAAAAABVN0YXRzAAAAAAAABgAAAAAAAAAHY2xhaW1lZAAAAAAEAAAAAAAAAA1pdGVtc19jbGFpbWVkAAAAAAAABAAAAAAAAAAKaXRlbXNfbG9zdAAAAAAABAAAAAAAAAALa2V5c19idXJuZWQAAAAABAAAAAAAAAAKdG90YWxfcnVucwAAAAAABAAAAAAAAAAFd2lwZWQAAAAAAAAE",
				"AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABAAAAAAAAAAAAAAABUFkbWluAAAAAAAAAAAAAAAAAAAIUmVjb3JkZXIAAAABAAAAAAAAAAdIaXN0b3J5AAAAAAEAAAATAAAAAAAAAAAAAAAFU3RhdHMAAAA=",
				"AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
				"AAAAAAAAAD5TZXQgd2hvIGNhbiByZWNvcmQgcnVucyAodGhlIFJ1blNlc3Npb24gY29udHJhY3QpLiBBZG1pbiBvbmx5LgAAAAAADHNldF9yZWNvcmRlcgAAAAEAAAAAAAAACHJlY29yZGVyAAAAEwAAAAA=",
				"AAAAAAAAACVSZWNvcmQgYSBmaW5pc2hlZCBydW4uIFJlY29yZGVyIG9ubHkuAAAAAAAACnJlY29yZF9ydW4AAAAAAAcAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAKZHVuZ2Vvbl9pZAAAAAAABAAAAAAAAAAHcHJlbWl1bQAAAAABAAAAAAAAAA5mbG9vcnNfY2xlYXJlZAAAAAAABAAAAAAAAAAFaXRlbXMAAAAAAAAEAAAAAAAAAAprZXlzX2ZvdW5kAAAAAAAEAAAAAAAAAAdvdXRjb21lAAAAB9AAAAAKUnVuT3V0Y29tZQAAAAAAAQAAA+kAAAPtAAAAAAAAAAM=",
				"AAAAAAAAABxBIHBsYXllcidzIGZ1bGwgcnVuIGhpc3RvcnkuAAAAB2hpc3RvcnkAAAAAAQAAAAAAAAAGcGxheWVyAAAAAAATAAAAAQAAA+oAAAfQAAAACVJ1blJlY29yZAAAAA==",
				"AAAAAAAAABdHbG9iYWwgYWdncmVnYXRlIHN0YXRzLgAAAAAFc3RhdHMAAAAAAAAAAAAAAQAAB9AAAAAFU3RhdHMAAAA=",
				"AAAAAAAAAA5DdXJyZW50IGFkbWluLgAAAAAABWFkbWluAAAAAAAAAAAAAAEAAAPoAAAAEw==",
				"AAAAAAAAACBDdXJyZW50IHJlY29yZGVyLCBpZiBjb25maWd1cmVkLgAAAAhyZWNvcmRlcgAAAAAAAAABAAAD6AAAABM=",
				"AAAAAAAAACBVcGdyYWRlIHRvIG5ldyB3YXNtLiBBZG1pbiBvbmx5LgAAAAd1cGdyYWRlAAAAAAEAAAAAAAAADW5ld193YXNtX2hhc2gAAAAAAAPuAAAAIAAAAAA=",
			]),
			options,
		)
	}
	public readonly fromJSON = {
		set_recorder: this.txFromJSON<null>,
		record_run: this.txFromJSON<Result<void>>,
		history: this.txFromJSON<Array<RunRecord>>,
		stats: this.txFromJSON<Stats>,
		admin: this.txFromJSON<Option<string>>,
		recorder: this.txFromJSON<Option<string>>,
		upgrade: this.txFromJSON<null>,
	}
}
