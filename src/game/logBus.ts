import { useSyncExternalStore } from "react"

// Tiny in-memory log bus for the dev console. Every contract interaction
// (simulated read or signed tx) gets logged here.

export type LogKind = "call" | "ok" | "err" | "read"

export interface LogEntry {
	id: number
	at: string // HH:MM:SS
	kind: LogKind
	label: string
	detail?: string
}

let entries: LogEntry[] = []
let nextId = 1
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

const time = () => new Date().toLocaleTimeString("en-GB", { hour12: false })

// JSON.stringify chokes on bigint (u64s from the chain)
const safe = (v: unknown) =>
	JSON.stringify(v, (_k, x: unknown) =>
		typeof x === "bigint" ? x.toString() : x,
	)

export function log(kind: LogKind, label: string, detail?: unknown) {
	entries = [
		...entries.slice(-199), // keep the last 200
		{
			id: nextId++,
			at: time(),
			kind,
			label,
			detail:
				detail === undefined
					? undefined
					: typeof detail === "string"
						? detail
						: safe(detail),
		},
	]
	emit()
}

export function clearLogs() {
	entries = []
	emit()
}

export function useLogs(): LogEntry[] {
	return useSyncExternalStore(
		(cb) => {
			listeners.add(cb)
			return () => listeners.delete(cb)
		},
		() => entries,
	)
}
