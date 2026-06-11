import { ChevronDown, Terminal, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { clearLogs, useLogs, type LogKind } from "../../game/logBus"

const KIND_STYLE: Record<LogKind, { tag: string; cls: string }> = {
	call: { tag: "TX →", cls: "text-solar" },
	ok: { tag: "OK ←", cls: "text-verdant" },
	err: { tag: "ERR ←", cls: "text-blood" },
	read: { tag: "SIM", cls: "text-ash" },
}

// Collapsible terminal showing every contract interaction: simulated reads,
// signed transactions, results, and errors.
export function DevConsole() {
	const [open, setOpen] = useState(false)
	const logs = useLogs()
	const scrollRef = useRef<HTMLDivElement>(null)
	const unseen = useRef(0)
	const [badge, setBadge] = useState(0)

	// auto-scroll to the newest entry while open; count unseen while closed
	useEffect(() => {
		if (open) {
			unseen.current = 0
			setBadge(0)
			scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
		} else if (logs.length > 0) {
			unseen.current += 1
			setBadge(unseen.current)
		}
	}, [logs, open])

	return (
		<>
			<button
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				aria-label="Toggle contract console"
				className="fixed bottom-4 right-4 z-50 flex h-11 cursor-pointer items-center gap-2 rounded-full border border-edge-bright bg-surface px-4 font-mono text-xs text-parchment shadow-lg transition-colors hover:border-solar/50 hover:text-solar"
			>
				<Terminal className="h-4 w-4" aria-hidden />
				console
				{!open && badge > 0 && (
					<span className="rounded-full bg-solar px-1.5 py-0.5 text-[10px] font-semibold text-abyss">
						{badge > 99 ? "99+" : badge}
					</span>
				)}
			</button>

			{open && (
				<div
					role="log"
					aria-label="Contract call log"
					className="fixed inset-x-0 bottom-0 z-40 border-t border-edge bg-abyss/95 backdrop-blur-md"
				>
					<div className="mx-auto max-w-7xl px-4 sm:px-6">
						<div className="flex h-10 items-center justify-between border-b border-edge">
							<p className="font-mono text-xs text-faded">
								solar-braves · contract console — TX = signed transaction, SIM =
								free simulation (read)
							</p>
							<div className="flex items-center gap-1">
								<button
									onClick={clearLogs}
									aria-label="Clear log"
									className="cursor-pointer rounded p-1.5 text-faded transition-colors hover:text-blood"
								>
									<Trash2 className="h-3.5 w-3.5" aria-hidden />
								</button>
								<button
									onClick={() => setOpen(false)}
									aria-label="Close console"
									className="cursor-pointer rounded p-1.5 text-faded transition-colors hover:text-parchment"
								>
									<ChevronDown className="h-4 w-4" aria-hidden />
								</button>
							</div>
						</div>
						<div
							ref={scrollRef}
							className="h-[32vh] overflow-y-auto py-2 font-mono text-xs leading-relaxed"
						>
							{logs.length === 0 && (
								<p className="text-faded">
									No calls yet. Enter a dungeon — every checkpoint decision
									lands here.
								</p>
							)}
							{logs.map((e) => {
								const k = KIND_STYLE[e.kind]
								return (
									<p key={e.id} className="whitespace-pre-wrap break-all">
										<span className="text-faded">{e.at} </span>
										<span className={`${k.cls} font-semibold`}>{k.tag} </span>
										<span className="text-parchment">{e.label}</span>
										{e.detail && <span className="text-ash"> {e.detail}</span>}
									</p>
								)
							})}
						</div>
					</div>
				</div>
			)}
		</>
	)
}
