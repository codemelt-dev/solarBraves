import { Wallet } from "lucide-react"
import { WalletButton } from "../WalletButton"

export function ConnectGate({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center rounded-2xl border border-edge bg-surface px-6 py-16 text-center">
			<Wallet className="mb-4 h-10 w-10 text-faded" aria-hidden />
			<p className="mb-2 font-medium text-parchment">Connect a wallet</p>
			<p className="mb-6 max-w-sm text-sm text-ash">{message}</p>
			<WalletButton />
		</div>
	)
}
