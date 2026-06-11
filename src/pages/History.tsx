import { Key, ScrollText, Skull, Trophy } from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"
import { ConnectGate } from "../components/game/ConnectGate"
import { DUNGEONS } from "../game/types"
import { useGame } from "../game/useGame"

const History: React.FC = () => {
	const { address, history, historyLoading } = useGame()
	const claimed = history.filter((h) => h.outcome === "Claimed").length
	const wiped = history.length - claimed

	if (!address) {
		return (
			<div className="min-h-dvh px-4 py-12 sm:px-6">
				<div className="mx-auto max-w-xl pt-12">
					<ConnectGate message="Run history is recorded by the DungeonClaims contract, keyed to your wallet." />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-dvh px-4 py-12 sm:px-6">
			<div className="mx-auto max-w-3xl">
				<div className="mb-10">
					<h1 className="font-display text-3xl font-bold text-parchment md:text-4xl">
						Run history
					</h1>
					<p className="mt-2 text-ash">
						Every claim and every wipe, recorded by DungeonClaims.{" "}
						<span className="font-mono text-sm text-faded">
							{claimed} claimed · {wiped} wiped
						</span>
					</p>
				</div>

				{historyLoading ? (
					<div className="flex flex-col gap-2" aria-label="Loading">
						{Array.from({ length: 3 }, (_, i) => (
							<div
								key={i}
								className="h-16 animate-pulse rounded-xl border border-edge bg-surface"
							/>
						))}
					</div>
				) : history.length === 0 ? (
					<div className="flex flex-col items-center rounded-2xl border border-edge bg-surface px-6 py-16 text-center">
						<ScrollText className="mb-4 h-10 w-10 text-faded" aria-hidden />
						<p className="mb-2 font-medium text-parchment">No runs recorded</p>
						<p className="mb-6 max-w-sm text-sm text-ash">
							Your ledger is clean. It won't stay that way.
						</p>
						<Link
							to="/play"
							className="h-11 cursor-pointer rounded-full bg-solar px-6 leading-[44px] font-semibold text-abyss transition-colors hover:bg-solar-bright"
						>
							First descent
						</Link>
					</div>
				) : (
					<ol className="flex flex-col gap-2">
						{[...history].reverse().map((run, i) => {
							const won = run.outcome === "Claimed"
							const dungeon = DUNGEONS.find((d) => d.id === run.dungeonId)
							return (
								<li
									key={`${run.ledger}-${i}`}
									className="flex items-center gap-4 rounded-xl border border-edge bg-surface px-4 py-3"
								>
									{won ? (
										<Trophy
											className="h-5 w-5 shrink-0 text-solar"
											aria-hidden
										/>
									) : (
										<Skull
											className="h-5 w-5 shrink-0 text-blood"
											aria-hidden
										/>
									)}
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium text-parchment">
											{dungeon?.name ?? `Dungeon ${run.dungeonId}`}
											{run.premium && (
												<Key
													className="ml-2 inline h-3.5 w-3.5 text-solar"
													aria-label="Premium run"
												/>
											)}
										</p>
										<p className="font-mono text-xs text-faded">
											{run.floorsCleared} floors ·{" "}
											{won
												? `${run.items} item${run.items === 1 ? "" : "s"} banked${run.keysFound ? " · key found" : ""}`
												: `${run.items} item${run.items === 1 ? "" : "s"} lost`}{" "}
											· ledger {run.ledger.toLocaleString()}
										</p>
									</div>
									<span
										className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-xs ${
											won
												? "border-solar/30 bg-solar/10 text-solar"
												: "border-blood/30 bg-blood/10 text-blood"
										}`}
									>
										{run.outcome}
									</span>
								</li>
							)
						})}
					</ol>
				)}
			</div>
		</div>
	)
}

export default History
