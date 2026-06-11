import * as Client from "nft_enumerable_example"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CA3LZ2WJMQ2AQIT7DAQJUG6VYXYQVOGGY6K3TPRTQBSJNDYEMSBN2AS2",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
