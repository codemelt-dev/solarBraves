import * as Client from "fungible_allowlist_example"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CCAS7XSZYN7VJ3JC3OVF72IQ3R7UAGNAUNSBC6ZNV6CZIFRDI4IKBJ54",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
