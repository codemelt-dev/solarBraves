import {
	Code2,
	Flame,
	Package,
	ScrollText,
	SearchCode,
	Swords,
} from "lucide-react"
import { Routes, Route, Outlet, NavLink, Link } from "react-router-dom"
import ConnectAccount from "./components/ConnectAccount"
import { DevConsole } from "./components/game/DevConsole"
import { labPrefix } from "./contracts/util"
import Debug from "./pages/Debug"
import History from "./pages/History"
import Home from "./pages/Home"
import Inventory from "./pages/Inventory"
import Play from "./pages/Play"

function App() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route path="/" element={<Home />} />
				<Route path="/play" element={<Play />} />
				<Route path="/inventory" element={<Inventory />} />
				<Route path="/history" element={<History />} />
				<Route path="/debug" element={<Debug />} />
				<Route path="/debug/:contractName" element={<Debug />} />
			</Route>
		</Routes>
	)
}

const NAV = [
	{ to: "/play", label: "Play", icon: Swords },
	{ to: "/inventory", label: "Inventory", icon: Package },
	{ to: "/history", label: "History", icon: ScrollText },
	{ to: "/debug", label: "Contracts", icon: Code2 },
]

const AppLayout: React.FC = () => (
	<div className="sb-canvas flex min-h-dvh flex-col">
		<header className="sticky top-0 z-50 border-b border-edge bg-abyss/85 backdrop-blur-md">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
				{/* brand */}
				<Link
					to="/"
					className="flex shrink-0 cursor-pointer items-center gap-2.5"
					aria-label="Solar Braves home"
				>
					<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-solar/30 bg-solar/10">
						<Flame className="h-4 w-4 text-solar" aria-hidden />
					</span>
					<span className="font-display text-lg font-bold tracking-wide text-parchment">
						Solar <span className="text-solar">Braves</span>
					</span>
				</Link>

				{/* nav */}
				<nav className="flex min-w-0 items-center gap-1" aria-label="Main">
					{NAV.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
									isActive
										? "bg-solar/10 text-solar"
										: "text-ash hover:bg-surface-2 hover:text-parchment"
								}`
							}
						>
							<Icon className="h-4 w-4" aria-hidden />
							<span className="hidden md:inline">{label}</span>
						</NavLink>
					))}
					<a
						href={labPrefix()}
						target="_blank"
						rel="noreferrer"
						className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-ash transition-colors duration-200 hover:bg-surface-2 hover:text-parchment"
					>
						<SearchCode className="h-4 w-4" aria-hidden />
						<span className="hidden lg:inline">Transactions</span>
					</a>
				</nav>

				{/* wallet */}
				<div className="ml-auto flex shrink-0 items-center">
					<ConnectAccount />
				</div>
			</div>
		</header>

		<main className="flex-1">
			<Outlet />
		</main>

		<DevConsole />

		<footer className="border-t border-edge">
			<div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
				<p className="text-sm text-faded">
					Solar Braves — onchain dungeon RPG on Stellar
				</p>
				<nav className="flex items-center gap-6" aria-label="Footer">
					<a
						href="https://github.com/theahaco/scaffold-stellar"
						target="_blank"
						rel="noreferrer"
						className="cursor-pointer text-sm text-ash transition-colors hover:text-solar"
					>
						GitHub
					</a>
					<a
						href="https://scaffoldstellar.org"
						target="_blank"
						rel="noreferrer"
						className="cursor-pointer text-sm text-ash transition-colors hover:text-solar"
					>
						Scaffold docs
					</a>
				</nav>
			</div>
		</footer>
	</div>
)

export default App
