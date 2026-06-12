import {
	ArrowDown,
	ArrowRight,
	Flame,
	Heart,
	Key,
	Lock,
	Skull,
	Swords,
	Vault,
} from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { ConnectGate } from "../components/game/ConnectGate"
import {
	FloorPips,
	ItemCard,
	KeyCount,
	RiskBadge,
} from "../components/game/Pieces"
import { type RunState } from "../game/convert"
import { DUNGEONS, MAX_FLOORS, type Item } from "../game/types"
import { useGame } from "../game/useGame"

type Phase = "select" | "fight" | "settling" | "checkpoint" | "banked" | "wiped"

const ENEMIES = [
	"Ash Ghoul",
	"Hollow Sentinel",
	"Ember Wraith",
	"Pit Stalker",
	"The Floor Warden", // boss
]

const HERO_MAX_HP = 100

const Play: React.FC = () => {
	const game = useGame()
	const [phase, setPhase] = useState<Phase>("select")
	const [view, setView] = useState<RunState | null>(null)
	const [settlingLabel, setSettlingLabel] = useState("Settling onchain")
	const [heroHp, setHeroHp] = useState(HERO_MAX_HP)
	const [enemyHp, setEnemyHp] = useState(0)
	const [enemyMax, setEnemyMax] = useState(0)
	const [hitFlash, setHitFlash] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [result, setResult] = useState<{ banked?: Item[]; lost?: Item[] }>({})

	const floor = view?.floor ?? 1
	const boss = floor === MAX_FLOORS
	const dungeon = DUNGEONS.find((d) => d.id === view?.dungeonId)

	// resume an active run found onchain
	useEffect(() => {
		if (phase === "select" && game.run && !game.startRun.isPending) {
			setView(game.run)
			setHeroHp(HERO_MAX_HP)
			setPhase("checkpoint")
		}
	}, [phase, game.run, game.startRun.isPending])

	// refs alongside state: attack() must not put side effects inside a
	// setState updater (StrictMode double-invokes updaters - that sends
	// duplicate transactions), and clicks can outpace re-renders
	const enemyHpRef = useRef(0)
	const clearingRef = useRef(false)

	const spawnEnemy = useCallback((f: number) => {
		const hp = 6 + f * 4 + (f === MAX_FLOORS ? 10 : 0)
		enemyHpRef.current = hp
		clearingRef.current = false
		setEnemyHp(hp)
		setEnemyMax(hp)
	}, [])

	const fail = (e: unknown, fallback: Phase) => {
		setError(e instanceof Error ? e.message : "Transaction failed")
		setPhase(fallback)
	}

	const enterDungeon = async (id: number, premium: boolean) => {
		setError(null)
		setSettlingLabel("Entering the dungeon")
		setPhase("settling")
		try {
			const state = await game.startRun.mutateAsync({
				dungeonId: id,
				premium,
			})
			setView(state)
			setHeroHp(HERO_MAX_HP)
			spawnEnemy(1)
			setPhase("fight")
		} catch (e) {
			// tx errors can be ambiguous (e.g. DUPLICATE after a retry whose
			// first submission landed) - trust the chain, not the error
			const fresh = await game.refetchRun()
			if (fresh.data) {
				setView(fresh.data)
				setHeroHp(HERO_MAX_HP)
				spawnEnemy(fresh.data.floor)
				setPhase("fight")
			} else {
				fail(e, "select")
			}
		}
	}

	// enemy hits back on a timer while fighting - no pause, no regen
	useEffect(() => {
		if (phase !== "fight") return
		const t = setInterval(() => {
			setHeroHp((hp) => Math.max(0, hp - (2 + Math.floor(Math.random() * 4))))
		}, 1200)
		return () => clearInterval(t)
	}, [phase])

	// death -> wipe transaction
	const wipedRef = useRef(false)
	useEffect(() => {
		if (phase === "fight" && heroHp === 0 && !wipedRef.current) {
			wipedRef.current = true
			const lost = view?.pending ?? []
			setSettlingLabel("Recording the wipe")
			setPhase("settling")
			game.wipe
				.mutateAsync()
				.then(() => {
					setResult({ lost })
					setView(null)
					setPhase("wiped")
				})
				.catch(async (e: unknown) => {
					const fresh = await game.refetchRun()
					if (!fresh.data) {
						setResult({ lost })
						setView(null)
						setPhase("wiped")
					} else {
						fail(e, "select")
					}
				})
		}
		if (phase !== "fight") wipedRef.current = false
	}, [heroHp, phase, game.wipe, view])

	const attack = () => {
		if (phase !== "fight" || heroHp === 0 || clearingRef.current) return
		setHitFlash(true)
		setTimeout(() => setHitFlash(false), 120)
		const next = Math.max(0, enemyHpRef.current - 1)
		enemyHpRef.current = next
		setEnemyHp(next)
		if (next === 0) {
			// floor cleared -> loot rolls onchain (guard: exactly one tx)
			clearingRef.current = true
			setSettlingLabel("Rolling loot onchain")
			setPhase("settling")
			game.clearFloor
				.mutateAsync()
				.then((state) => {
					setView(state)
					setPhase("checkpoint")
				})
				.catch(async (e: unknown) => {
					const fresh = await game.refetchRun()
					if (fresh.data && fresh.data.floor > (view?.floor ?? 0)) {
						// the "failed" tx actually landed
						setView(fresh.data)
						setPhase("checkpoint")
					} else {
						fail(e, fresh.data ? "checkpoint" : "select")
					}
				})
		}
	}

	const pushDeeper = () => {
		setError(null)
		spawnEnemy(floor)
		setPhase("fight")
	}

	const bankLoot = async () => {
		setError(null)
		setSettlingLabel("Minting your loot")
		setPhase("settling")
		try {
			const banked = await game.exitSafe.mutateAsync()
			setResult({ banked })
			setView(null)
			setPhase("banked")
		} catch (e) {
			const fresh = await game.refetchRun()
			if (!fresh.data) {
				// run is closed onchain - the bank landed despite the error
				setResult({ banked: view?.pending ?? [] })
				setView(null)
				setPhase("banked")
			} else {
				fail(e, "checkpoint")
			}
		}
	}

	const backToSelect = () => {
		setResult({})
		setError(null)
		setView(null)
		setPhase("select")
	}

	if (!game.address) {
		return (
			<div className="min-h-dvh px-4 py-12 sm:px-6">
				<div className="mx-auto max-w-xl pt-12">
					<ConnectGate message="Every checkpoint decision is a signed Stellar transaction. Connect to enter the depths." />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-dvh px-4 py-12 sm:px-6">
			<div className="mx-auto max-w-4xl">
				{error && (
					<div
						role="alert"
						className="mb-6 rounded-xl border border-blood/40 bg-blood/10 px-4 py-3 text-sm text-parchment"
					>
						{error}
					</div>
				)}

				{phase === "select" && (
					<section aria-labelledby="select-heading">
						<div className="mb-10 flex flex-wrap items-end justify-between gap-4">
							<div>
								<h1
									id="select-heading"
									className="font-display text-3xl font-bold text-parchment md:text-4xl"
								>
									Choose your descent
								</h1>
								<p className="mt-2 text-ash">
									Five floors down. Loot stays pending until you walk out.
								</p>
							</div>
							<KeyCount count={game.keys} />
						</div>

						<div className="grid gap-5 md:grid-cols-3">
							{DUNGEONS.map((d) => {
								const locked = d.premium && game.keys === 0
								return (
									<button
										key={d.id}
										onClick={() => void enterDungeon(d.id, d.premium)}
										disabled={locked || game.runLoading}
										className={`group relative cursor-pointer rounded-2xl border p-6 text-left transition-all duration-300 ${
											locked
												? "cursor-not-allowed border-edge bg-surface opacity-50"
												: d.premium
													? "border-solar/30 bg-surface hover:-translate-y-1 hover:border-solar/60"
													: "border-edge bg-surface hover:-translate-y-1 hover:border-solar/30"
										}`}
									>
										{d.premium && (
											<span className="absolute right-5 top-5">
												{locked ? (
													<Lock className="h-4 w-4 text-faded" aria-hidden />
												) : (
													<Key className="h-4 w-4 text-solar" aria-hidden />
												)}
											</span>
										)}
										<Vault
											className={`mb-4 h-7 w-7 ${d.premium ? "text-solar" : "text-ash"}`}
											aria-hidden
										/>
										<h2 className="mb-2 font-display text-lg font-semibold text-parchment">
											{d.name}
										</h2>
										<p className="mb-4 text-sm leading-relaxed text-ash">
											{d.tagline}
										</p>
										<span className="font-mono text-xs text-faded">
											{d.premium
												? locked
													? "REQUIRES KEY"
													: "BURNS 1 KEY · RISK ×2.00"
												: "FREE ENTRY · RISK ×1.00"}
										</span>
									</button>
								)
							})}
						</div>
					</section>
				)}

				{phase === "settling" && (
					<section
						aria-live="polite"
						className="flex min-h-[50vh] flex-col items-center justify-center text-center"
					>
						<Flame
							className="mb-6 h-12 w-12 animate-pulse text-solar"
							aria-hidden
						/>
						<p className="font-display text-xl font-semibold text-parchment">
							{settlingLabel}…
						</p>
						<p className="mt-2 font-mono text-xs text-faded">
							signed transaction · Stellar settles in seconds
						</p>
					</section>
				)}

				{phase === "fight" && view && (
					<section aria-label="Combat">
						<header className="mb-8 flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="font-mono text-xs uppercase tracking-widest text-faded">
									{dungeon?.name}
								</p>
								<h1 className="font-display text-2xl font-bold text-parchment">
									Floor {floor}
									{boss && <span className="text-ember"> - Boss</span>}
								</h1>
							</div>
							<div className="flex items-center gap-3">
								<RiskBadge riskBps={view.riskBps} />
								<FloorPips floor={floor} />
							</div>
						</header>

						<button
							onClick={attack}
							className={`group relative mb-6 flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border bg-surface transition-colors duration-150 ${
								hitFlash
									? "border-ember/60 bg-surface-2"
									: "border-edge hover:border-ember/30"
							}`}
							aria-label={`Attack ${ENEMIES[floor - 1]}`}
						>
							<Skull
								className={`mb-4 h-20 w-20 transition-transform duration-100 ${
									hitFlash
										? "scale-90 text-ember"
										: "text-ash group-hover:scale-105"
								}`}
								aria-hidden
							/>
							<p className="mb-4 font-display text-xl font-semibold text-parchment">
								{ENEMIES[floor - 1]}
							</p>
							<div className="w-56">
								<div
									className="h-2 overflow-hidden rounded-full bg-edge"
									role="progressbar"
									aria-valuenow={enemyHp}
									aria-valuemax={enemyMax}
									aria-label="Enemy health"
								>
									<div
										className="h-full rounded-full bg-ember transition-all duration-150"
										style={{ width: `${(enemyHp / enemyMax) * 100}%` }}
									/>
								</div>
								<p className="mt-2 text-center font-mono text-xs tabular-nums text-faded">
									{enemyHp} / {enemyMax}
								</p>
							</div>
							<span className="mt-4 text-xs text-faded">tap to attack</span>
						</button>

						<div className="grid gap-4 md:grid-cols-[1fr_280px]">
							<div className="rounded-2xl border border-edge bg-surface p-5">
								<div className="mb-2 flex items-center justify-between">
									<span className="flex items-center gap-2 text-sm font-medium text-parchment">
										<Heart className="h-4 w-4 text-blood" aria-hidden />
										Your hero
									</span>
									<span className="font-mono text-sm tabular-nums text-ash">
										{heroHp} / {HERO_MAX_HP}
									</span>
								</div>
								<div
									className="h-2.5 overflow-hidden rounded-full bg-edge"
									role="progressbar"
									aria-valuenow={heroHp}
									aria-valuemax={HERO_MAX_HP}
									aria-label="Hero health"
								>
									<div
										className={`h-full rounded-full transition-all duration-300 ${
											heroHp > 40
												? "bg-verdant"
												: heroHp > 15
													? "bg-solar"
													: "bg-blood"
										}`}
										style={{ width: `${(heroHp / HERO_MAX_HP) * 100}%` }}
									/>
								</div>
								<p className="mt-3 text-xs text-faded">
									No regen between floors. Die and the wipe is recorded onchain.
								</p>
							</div>

							<div className="rounded-2xl border border-edge bg-surface p-5">
								<p className="mb-3 text-sm font-medium text-parchment">
									At stake{" "}
									<span className="font-mono text-xs text-faded">
										({view.pending.length})
									</span>
								</p>
								{view.pending.length === 0 ? (
									<p className="text-xs text-faded">
										Nothing yet. Clear this floor.
									</p>
								) : (
									<div className="flex max-h-36 flex-col gap-2 overflow-y-auto">
										{view.pending.map((it) => (
											<ItemCard key={it.id} item={it} />
										))}
									</div>
								)}
							</div>
						</div>
					</section>
				)}

				{phase === "checkpoint" && view && (
					<section aria-labelledby="checkpoint-heading" className="text-center">
						<p className="mb-2 font-mono text-xs uppercase tracking-widest text-solar">
							Checkpoint - floor {floor - 1} cleared · {dungeon?.name}
						</p>
						<h1
							id="checkpoint-heading"
							className="mb-8 font-display text-3xl font-bold text-parchment md:text-4xl"
						>
							{floor > MAX_FLOORS
								? "The dungeon is yours."
								: "Bank it, or push deeper?"}
						</h1>

						<div className="mx-auto mb-10 grid max-w-md gap-2">
							{view.pending.map((it) => (
								<ItemCard key={it.id} item={it} />
							))}
							{view.pending.length === 0 && (
								<p className="text-sm text-faded">
									Nothing at stake yet. The first floor awaits.
								</p>
							)}
						</div>

						<div className="mx-auto flex max-w-lg flex-col gap-4 sm:flex-row">
							<button
								onClick={() => void bankLoot()}
								className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-solar text-base font-semibold text-abyss transition-all duration-300 hover:bg-solar-bright active:scale-95"
							>
								Bank the loot
								<ArrowRight className="h-5 w-5" aria-hidden />
							</button>
							{floor <= MAX_FLOORS && (
								<button
									onClick={pushDeeper}
									className="flex h-14 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-ember/40 text-base font-semibold text-ember transition-all duration-300 hover:bg-ember/10 active:scale-95"
								>
									{view.pending.length === 0 ? "Descend" : "Push deeper"}
									<ArrowDown className="h-5 w-5" aria-hidden />
								</button>
							)}
						</div>
						{floor <= MAX_FLOORS && (
							<p className="mt-6 text-sm text-faded">
								Deeper: risk ×{(view.riskBps / 100).toFixed(2)} → better loot,
								same hero, no healing.
							</p>
						)}
					</section>
				)}

				{phase === "banked" && (
					<section aria-labelledby="banked-heading" className="text-center">
						<Swords className="mx-auto mb-6 h-12 w-12 text-solar" aria-hidden />
						<h1
							id="banked-heading"
							className="mb-3 font-display text-4xl font-bold text-solar"
						>
							Loot banked
						</h1>
						<p className="mb-8 text-ash">Minted to your onchain inventory.</p>
						<div className="mx-auto mb-10 grid max-w-md gap-2">
							{(result.banked ?? []).map((it) => (
								<ItemCard key={it.id} item={it} />
							))}
							{(result.banked ?? []).length === 0 && (
								<p className="text-sm text-faded">Empty-handed - but alive.</p>
							)}
						</div>
						<div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
							<button
								onClick={backToSelect}
								className="h-12 cursor-pointer rounded-full bg-solar px-8 font-semibold text-abyss transition-all duration-300 hover:bg-solar-bright"
							>
								Run it back
							</button>
							<Link
								to="/inventory"
								className="cursor-pointer text-sm font-medium text-ash transition-colors hover:text-solar"
							>
								View inventory →
							</Link>
						</div>
					</section>
				)}

				{phase === "wiped" && (
					<section aria-labelledby="wiped-heading" className="text-center">
						<Skull className="mx-auto mb-6 h-12 w-12 text-blood" aria-hidden />
						<h1
							id="wiped-heading"
							className="mb-3 font-display text-4xl font-bold text-blood"
						>
							Wiped
						</h1>
						<p className="mb-8 text-ash">
							{(result.lost ?? []).length > 0
								? `${(result.lost ?? []).length} item${(result.lost ?? []).length > 1 ? "s" : ""} lost to the depths. Recorded onchain - no rollback.`
								: "You fell with empty pockets. Small mercies."}
						</p>
						<div className="mx-auto mb-10 grid max-w-md gap-2">
							{(result.lost ?? []).map((it) => (
								<ItemCard key={it.id} item={it} dim />
							))}
						</div>
						<button
							onClick={backToSelect}
							className="h-12 cursor-pointer rounded-full bg-solar px-8 font-semibold text-abyss transition-all duration-300 hover:bg-solar-bright"
						>
							Again
						</button>
					</section>
				)}
			</div>
		</div>
	)
}

export default Play
