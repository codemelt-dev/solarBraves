import * as Client from "run_session"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Test SDF Network ; September 2015",
	contractId: "CDTICLOD7G4OLZEJHJBBLJQQQE6I3YW4OUCCQXK6XGFX6QTY7QQFLSTR",
	rpcUrl,
	publicKey: undefined,
})
