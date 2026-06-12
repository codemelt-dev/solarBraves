import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import dungeonClaims from "../contracts/dungeon_claims"
import lootRegistry from "../contracts/loot_registry"
import runSession from "../contracts/run_session"
import { useWallet } from "../hooks/useWallet"
import { toItem, toRecord, toRunState, type RunState } from "./convert"
import { log } from "./logBus"
import { type Item } from "./types"

// Real game state - every mutation here is a signed Soroban transaction.
// Reads are free simulations.

// signAndSend wrapper: unwrap the contract Result or surface its error,
// logging the round trip to the dev console
async function send<T>(
	label: string,
	tx: {
		signAndSend: (opts: never) => Promise<{
			result: unknown
			sendTransactionResponse?: { hash?: string }
		}>
	},
	signTransaction: unknown,
): Promise<T> {
	log("call", label)
	let sent
	try {
		sent = await tx.signAndSend({ signTransaction } as never)
	} catch (e) {
		log("err", label, e instanceof Error ? e.message : String(e))
		throw e
	}
	const hash = sent.sendTransactionResponse?.hash
	const res = sent.result as {
		isErr: () => boolean
		unwrap: () => T
		unwrapErr: () => { message?: string }
	}
	if (typeof res?.isErr === "function") {
		if (res.isErr()) {
			const msg = res.unwrapErr()?.message ?? "Contract call failed"
			log("err", label, msg)
			throw new Error(msg)
		}
		const value = res.unwrap()
		log("ok", label, { hash, result: value })
		return value
	}
	log("ok", label, { hash, result: sent.result })
	return sent.result as T
}

export function useGame() {
	const { address, signTransaction } = useWallet()
	const qc = useQueryClient()
	const invalidate = (...keys: string[]) =>
		Promise.all(
			keys.map((k) => qc.invalidateQueries({ queryKey: [k, address] })),
		)

	// ── reads (simulations, no signature) ──
	const runQ = useQuery({
		queryKey: ["run", address],
		enabled: !!address,
		queryFn: async (): Promise<RunState | null> => {
			const tx = await runSession.run({ player: address! })
			const state = tx.result ? toRunState(tx.result) : null
			log("read", "run_session.run()", state ?? "no active run")
			return state
		},
	})

	const inventoryQ = useQuery({
		queryKey: ["inventory", address],
		enabled: !!address,
		queryFn: async (): Promise<Item[]> => {
			const tx = await lootRegistry.inventory({ owner: address! })
			log("read", "loot_registry.inventory()", `${tx.result.length} items`)
			return tx.result.map(toItem)
		},
	})

	const keysQ = useQuery({
		queryKey: ["keys", address],
		enabled: !!address,
		queryFn: async (): Promise<number> => {
			const tx = await lootRegistry.key_balance({ owner: address! })
			log("read", "loot_registry.key_balance()", tx.result)
			return tx.result
		},
	})

	const historyQ = useQuery({
		queryKey: ["history", address],
		enabled: !!address,
		queryFn: async () => {
			const tx = await dungeonClaims.history({ player: address! })
			log("read", "dungeon_claims.history()", `${tx.result.length} records`)
			return tx.result.map(toRecord)
		},
	})

	// ── writes (signed transactions) ──
	const startRun = useMutation({
		mutationFn: async (args: { dungeonId: number; premium: boolean }) => {
			const tx = await runSession.start_run(
				{ player: address!, dungeon_id: args.dungeonId, premium: args.premium },
				{ publicKey: address! } as never,
			)
			const state = await send<Parameters<typeof toRunState>[0]>(
				`run_session.start_run(dungeon_id: ${args.dungeonId}, premium: ${args.premium})`,
				tx,
				signTransaction,
			)
			return toRunState(state)
		},
		onSuccess: () => void invalidate("run", "keys"),
	})

	const clearFloor = useMutation({
		mutationFn: async () => {
			const tx = await runSession.clear_floor({ player: address! }, {
				publicKey: address!,
			} as never)
			const state = await send<Parameters<typeof toRunState>[0]>(
				"run_session.clear_floor()",
				tx,
				signTransaction,
			)
			return toRunState(state)
		},
		onSuccess: () => void invalidate("run"),
	})

	const exitSafe = useMutation({
		mutationFn: async () => {
			const tx = await runSession.exit_safe({ player: address! }, {
				publicKey: address!,
			} as never)
			const minted = await send<Parameters<typeof toItem>[0][]>(
				"run_session.exit_safe()",
				tx,
				signTransaction,
			)
			return minted.map(toItem)
		},
		onSuccess: () => void invalidate("run", "inventory", "keys", "history"),
	})

	const wipe = useMutation({
		mutationFn: async () => {
			const tx = await runSession.wipe({ player: address! }, {
				publicKey: address!,
			} as never)
			await send<void>("run_session.wipe()", tx, signTransaction)
		},
		onSuccess: () => void invalidate("run", "history"),
	})

	return {
		address,
		run: runQ.data ?? null,
		runLoading: runQ.isLoading,
		// re-read run state from chain - used to resolve ambiguous tx errors
		// (e.g. DUPLICATE after a retry, where the first submission landed)
		refetchRun: () => runQ.refetch(),
		inventory: inventoryQ.data ?? [],
		inventoryLoading: inventoryQ.isLoading,
		keys: keysQ.data ?? 0,
		history: historyQ.data ?? [],
		historyLoading: historyQ.isLoading,
		startRun,
		clearFloor,
		exitSafe,
		wipe,
	}
}
