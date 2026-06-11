import { PackageOpen } from "lucide-react"
import React from "react"
import { Link } from "react-router-dom"
import { ConnectGate } from "../components/game/ConnectGate"
import { ItemCard, KeyCount } from "../components/game/Pieces"
import { useGame } from "../game/useGame"

const Inventory: React.FC = () => {
	const { address, inventory, inventoryLoading, keys } = useGame()

	if (!address) {
		return (
			<div className="min-h-dvh px-4 py-12 sm:px-6">
				<div className="mx-auto max-w-xl pt-12">
					<ConnectGate message="Your inventory lives in the LootRegistry contract, keyed to your wallet." />
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-dvh px-4 py-12 sm:px-6">
			<div className="mx-auto max-w-3xl">
				<div className="mb-10 flex flex-wrap items-end justify-between gap-4">
					<div>
						<h1 className="font-display text-3xl font-bold text-parchment md:text-4xl">
							Inventory
						</h1>
						<p className="mt-2 text-ash">
							Everything you walked out with, minted onchain.
						</p>
					</div>
					<KeyCount count={keys} />
				</div>

				{inventoryLoading ? (
					<div className="grid gap-2 sm:grid-cols-2" aria-label="Loading">
						{Array.from({ length: 4 }, (_, i) => (
							<div
								key={i}
								className="h-16 animate-pulse rounded-lg border border-edge bg-surface"
							/>
						))}
					</div>
				) : inventory.length === 0 ? (
					<div className="flex flex-col items-center rounded-2xl border border-edge bg-surface px-6 py-16 text-center">
						<PackageOpen className="mb-4 h-10 w-10 text-faded" aria-hidden />
						<p className="mb-2 font-medium text-parchment">
							Nothing banked yet
						</p>
						<p className="mb-6 max-w-sm text-sm text-ash">
							Loot only lands here when you exit a dungeon alive. Pending piles
							don't count.
						</p>
						<Link
							to="/play"
							className="h-11 cursor-pointer rounded-full bg-solar px-6 leading-[44px] font-semibold text-abyss transition-colors hover:bg-solar-bright"
						>
							Start a run
						</Link>
					</div>
				) : (
					<div className="grid gap-2 sm:grid-cols-2">
						{[...inventory].reverse().map((item) => (
							<ItemCard key={item.id} item={item} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default Inventory
