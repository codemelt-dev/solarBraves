import * as Client from "loot_registry"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Test SDF Network ; September 2015",
	contractId: "CD4M4GJOV6LV6FB26P3IUDMVX5SCCV6CSHG66WTNQ2KZN3YHSQA6HDWW",
	rpcUrl,
	publicKey: undefined,
})
