import { Gem, Key, Shield, Sparkles, Sword } from "lucide-react"
import {
	MAX_FLOORS,
	RARITY_COLOR,
	RARITY_RING,
	type Item,
	type ItemKind,
} from "../../game/types"

const KIND_ICON: Record<ItemKind, typeof Sword> = {
	Weapon: Sword,
	Armor: Shield,
	Accessory: Gem,
	Rune: Sparkles,
}

export function ItemCard({ item, dim = false }: { item: Item; dim?: boolean }) {
	const Icon = KIND_ICON[item.kind]
	return (
		<div
			className={`flex items-center gap-3 rounded-lg border bg-surface-2 px-3 py-2.5 ${RARITY_RING[item.rarity]} ${dim ? "opacity-50" : ""}`}
		>
			<Icon
				className={`h-4 w-4 shrink-0 ${RARITY_COLOR[item.rarity]}`}
				aria-hidden
			/>
			<div className="min-w-0 flex-1 text-left">
				<p className="truncate text-sm font-medium text-parchment">
					{item.kind}
				</p>
				<p className={`font-mono text-xs ${RARITY_COLOR[item.rarity]}`}>
					{item.rarity}
				</p>
			</div>
			<span
				className="font-mono text-sm font-semibold tabular-nums text-parchment"
				title="Power"
			>
				{item.power}
				<span className="ml-1 text-xs font-normal text-faded">pwr</span>
			</span>
		</div>
	)
}

export function FloorPips({ floor }: { floor: number }) {
	return (
		<div
			className="flex items-center gap-1.5"
			role="img"
			aria-label={`Floor ${Math.min(floor, MAX_FLOORS)} of ${MAX_FLOORS}`}
		>
			{Array.from({ length: MAX_FLOORS }, (_, i) => {
				const n = i + 1
				const cleared = n < floor
				const current = n === floor
				return (
					<span
						key={n}
						className={`h-1.5 rounded-full transition-all duration-300 ${
							current
								? "w-6 bg-solar"
								: cleared
									? "w-3 bg-solar/50"
									: "w-3 bg-edge"
						}`}
					/>
				)
			})}
		</div>
	)
}

export function RiskBadge({ riskBps }: { riskBps: number }) {
	const hot = riskBps >= 200
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-medium tabular-nums ${
				hot
					? "border-ember/40 bg-ember/10 text-ember"
					: "border-solar/30 bg-solar/10 text-solar"
			}`}
		>
			RISK ×{(riskBps / 100).toFixed(2)}
		</span>
	)
}

export function KeyCount({ count }: { count: number }) {
	return (
		<span className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface-2 px-3 py-1 font-mono text-xs tabular-nums text-parchment">
			<Key className="h-3.5 w-3.5 text-solar" aria-hidden />
			{count} {count === 1 ? "key" : "keys"}
		</span>
	)
}
