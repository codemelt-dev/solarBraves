import * as Client from "guess_the_number"
import { rpcUrl } from "./util"

export default new Client.Client({
	networkPassphrase: "Standalone Network ; February 2017",
	contractId: "CCJXMYNDJMAU4AOELWQR67PJZCZUVVNQCVIXRA5VSBIVFHNOMJ7T4D6G",
	rpcUrl,
	allowHttp: true,
	publicKey: undefined,
})
