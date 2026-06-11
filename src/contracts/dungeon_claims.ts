import * as Client from "dungeon_claims"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Test SDF Network ; September 2015",
	contractId: "CC5UKSPM4GNWK5L66NKIU5VBJEEXT55ODIFTNKFNZAIJ4TAEKTDNH3SS",
	rpcUrl,
	publicKey: undefined,
})
