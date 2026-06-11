import {
	ArrowRight,
	ChevronDown,
	Coins,
	FileCode2,
	Flame,
	Landmark,
	ScrollText,
	Skull,
	Swords,
} from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"

const STATS = [
	{ value: "3", label: "open-source contracts" },
	{ value: "~$0.00001", label: "per checkpoint decision" },
	{ value: "5", label: "floors per dungeon" },
	{ value: "100%", label: "loot rolled onchain" },
]

const LOOP = [
	{
		icon: Swords,
		title: "Delve",
		body: "Fight floor by floor. Every kill rolls loot into your pending pile — held by the contract, not your client.",
	},
	{
		icon: Coins,
		title: "The Checkpoint",
		body: "Bank it or push deeper. Each choice is a signed Stellar transaction. Deeper means better rolls and a hotter multiplier.",
	},
	{
		icon: Skull,
		title: "Wipe or Glory",
		body: "Die and the pile is gone — recorded onchain, no rollback. Walk out and it mints to your inventory forever.",
	},
]

const CONTRACTS = [
	{
		icon: Flame,
		name: "RunSession",
		body: "Holds the live run: floor, pending loot, risk multiplier. The claim-or-push commitment lives here.",
	},
	{
		icon: Landmark,
		name: "LootRegistry",
		body: "Onchain inventory of equipment, runes, and the keys that gate premium dungeons.",
	},
	{
		icon: ScrollText,
		name: "DungeonClaims",
		body: "Append-only history of every claim, wipe, and key burn. The record can't be forged.",
	},
]

const Home: React.FC = () => (
	<div className="overflow-hidden">
		{/* ── Hero ── */}
		<section className="sb-grain relative flex min-h-[88vh] flex-col items-center justify-center px-6">
			{/* light layers */}
			<div
				className="sb-horizon pointer-events-none absolute inset-0"
				aria-hidden
			/>
			<div
				className="sb-sun pointer-events-none absolute -bottom-40 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full bg-ember/30 blur-[100px]"
				aria-hidden
			/>

			<div className="relative z-10 flex max-w-3xl flex-col items-center pt-16 text-center">
				<p className="mb-8 font-mono text-xs font-medium uppercase tracking-[0.35em] text-solar">
					Onchain dungeon RPG &middot; Stellar
				</p>

				<h1 className="mb-7 font-display text-6xl font-bold leading-[1.02] tracking-tight text-parchment sm:text-7xl md:text-8xl">
					Delve deep.
					<br />
					<span className="bg-gradient-to-b from-solar-bright via-solar to-ember bg-clip-text text-transparent">
						Bank it or lose it.
					</span>
				</h1>

				<p className="mb-12 max-w-xl text-lg leading-relaxed text-ash">
					Every checkpoint is a real decision settled onchain. Push deeper for
					greater loot — or wipe and lose the lot. No rollback. No respawn save.
				</p>

				<div className="flex flex-col items-center gap-4 sm:flex-row">
					<Link
						to="/play"
						className="group inline-flex h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-solar px-10 text-base font-semibold text-abyss shadow-[0_0_40px_-8px] shadow-solar/50 transition-all duration-300 hover:bg-solar-bright hover:shadow-solar/70 active:scale-95"
					>
						Enter the Depths
						<ArrowRight
							className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
							aria-hidden
						/>
					</Link>
					<Link
						to="/debug"
						className="inline-flex h-14 cursor-pointer items-center justify-center gap-2 rounded-full border border-edge-bright bg-abyss/40 px-8 text-base font-medium text-parchment backdrop-blur-sm transition-colors duration-300 hover:border-solar/50 hover:text-solar"
					>
						<FileCode2 className="h-5 w-5" aria-hidden />
						Read the contracts
					</Link>
				</div>
			</div>

			{/* stats anchored to hero floor */}
			<div className="relative z-10 mt-auto w-full max-w-5xl pb-6 pt-20">
				<dl className="grid grid-cols-2 gap-y-8 border-t border-edge pt-8 md:grid-cols-4">
					{STATS.map((s) => (
						<div key={s.label} className="text-center">
							<dd className="font-mono text-xl font-semibold tabular-nums text-solar md:text-2xl">
								{s.value}
							</dd>
							<dt className="mt-1 text-xs text-faded md:text-sm">{s.label}</dt>
						</div>
					))}
				</dl>
				<ChevronDown
					className="mx-auto mt-6 h-5 w-5 animate-bounce text-faded"
					aria-hidden
				/>
			</div>
		</section>

		{/* ── The loop ── */}
		<section
			aria-labelledby="loop-heading"
			className="mx-auto max-w-6xl px-6 py-28"
		>
			<div className="mb-14 max-w-2xl">
				<div className="mb-5 h-px w-12 bg-solar" aria-hidden />
				<h2
					id="loop-heading"
					className="mb-4 font-display text-3xl font-bold text-parchment md:text-5xl"
				>
					The stakes are the gameplay
				</h2>
				<p className="text-lg text-ash">
					Sub-cent fees make every choice affordable. The chain makes every
					choice final.
				</p>
			</div>

			<div className="grid gap-5 md:grid-cols-3">
				{LOOP.map((step, i) => (
					<div
						key={step.title}
						className="group relative overflow-hidden rounded-2xl border border-edge bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:border-solar/40"
					>
						{/* hairline glow on top edge */}
						<div
							className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-solar/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
							aria-hidden
						/>
						<div className="mb-6 flex items-center justify-between">
							<span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-solar/20 bg-solar/10">
								<step.icon className="h-5 w-5 text-solar" aria-hidden />
							</span>
							<span className="font-mono text-sm text-faded">0{i + 1}</span>
						</div>
						<h3 className="mb-3 font-display text-xl font-semibold text-parchment">
							{step.title}
						</h3>
						<p className="leading-relaxed text-ash">{step.body}</p>
					</div>
				))}
			</div>
		</section>

		{/* ── Contracts ── */}
		<section
			aria-labelledby="contracts-heading"
			className="border-t border-edge bg-surface/40"
		>
			<div className="mx-auto max-w-6xl px-6 py-28">
				<div className="mb-14 max-w-2xl">
					<div className="mb-5 h-px w-12 bg-solar" aria-hidden />
					<h2
						id="contracts-heading"
						className="mb-4 font-display text-3xl font-bold text-parchment md:text-5xl"
					>
						Three contracts, fully open
					</h2>
					<p className="text-lg text-ash">
						Soroban smart contracts under MIT. Read them, fork them, audit them.
					</p>
				</div>

				<div className="grid gap-5 md:grid-cols-3">
					{CONTRACTS.map((c) => (
						<Link
							key={c.name}
							to="/debug"
							className="group cursor-pointer rounded-2xl border border-edge bg-abyss p-8 transition-all duration-300 hover:-translate-y-1 hover:border-solar/40"
						>
							<c.icon className="mb-6 h-6 w-6 text-ember" aria-hidden />
							<h3 className="mb-3 font-mono text-lg font-semibold text-parchment">
								{c.name}
								<span className="text-faded">.rs</span>
							</h3>
							<p className="mb-6 text-[15px] leading-relaxed text-ash">
								{c.body}
							</p>
							<span className="inline-flex items-center gap-1.5 text-sm font-medium text-solar/70 transition-colors duration-300 group-hover:text-solar">
								Open in explorer
								<ArrowRight
									className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
									aria-hidden
								/>
							</span>
						</Link>
					))}
				</div>
			</div>
		</section>

		{/* ── Final CTA ── */}
		<section className="sb-grain relative border-t border-edge px-6 py-32 text-center">
			<div
				className="sb-horizon pointer-events-none absolute inset-0"
				aria-hidden
			/>
			<div className="relative z-10 mx-auto max-w-2xl">
				<h2 className="mb-5 font-display text-4xl font-bold leading-tight text-parchment md:text-6xl">
					One key. Five floors.
					<br />
					<span className="bg-gradient-to-b from-solar-bright via-solar to-ember bg-clip-text text-transparent">
						Your call.
					</span>
				</h2>
				<p className="mx-auto mb-10 max-w-md text-ash">
					Connect a wallet, enter a dungeon, and find out how deep you go before
					you blink.
				</p>
				<Link
					to="/play"
					className="group inline-flex h-14 cursor-pointer items-center justify-center gap-3 rounded-full bg-solar px-10 text-base font-semibold text-abyss shadow-[0_0_40px_-8px] shadow-solar/50 transition-all duration-300 hover:bg-solar-bright hover:shadow-solar/70 active:scale-95"
				>
					Start a run
					<ArrowRight
						className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
						aria-hidden
					/>
				</Link>
			</div>
		</section>
	</div>
)

export default Home
