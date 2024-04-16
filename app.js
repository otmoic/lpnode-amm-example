const _ = require("lodash");
const db = require("./db.js");
const resource = require("./resource.js")
const dex_wallet = require("./dex_wallet.js");
const flow = require("./flow.js");
/**
 * the data structure of bridge_list is as follows:
 *   
  {
	"_id": "661d156d6e2996ccbdc8c9b1",
	"dstChain_id": "661cdff96e2996ccbdc67f78",
	"dstToken_id": "661d14c66e2996ccbdc8c24f",
	"srcChain_id": "661cdff96e2996ccbdc67f78",
	"srcToken_id": "661d14a66e2996ccbdc8c0f7",
	"ammName": "amm-01",
	"bridgeName": "ETH-USDT",
	"createdAt": 1713182061281,
	"dstChainId": 9006,
	"dstClientUri": "http://obridge-chain-client-evm-bsc-server-9006:9100/evm-client-9006",
	"dstToken": "0xaCDA8BF66C2CADAc9e99Aa1aa75743F536E71094",
	"enableHedge": true,
	"enableLimiter": false,
	"lpReceiverAddress": "0x1E1f3324f5482bACeA3E07978278624F28e4ca4A",
	"msmqName": "0x57E73DB0eebd89F722e064d4c209f86ebA9DAEEc/0xaCDA8BF66C2CADAc9e99Aa1aa75743F536E71094_9006_9006",
	"srcChainId": 9006,
	"srcClientUri": "http://obridge-chain-client-evm-bsc-server-9006:9100/evm-client-9006",
	"srcToken": "0x57E73DB0eebd89F722e064d4c209f86ebA9DAEEc",
	"src_wallet_id": "661d13df9309c6b67fae6fb4",
	"walletName": "TestWallet1",
	"wallet_id": "661d13df9309c6b67fae6fb4"
  }
 */
let bridge_list = [];
// before using, please first create cross-chain currency pairs on the otmoic app and then complete loading here
const lp_store_db_name = _.get(process.env, "MONGODB_DBNAME_LP_STORE", undefined);
const load_bridges = async () => {
	const bridges = await db.mongodb
		.select_table(lp_store_db_name, "bridges")
		.find({})
		.limit(10)
		.toArray();
	await dex_wallet.init_wallet(bridges);
	bridge_list = bridges;
};
const main = async () => {
	await resource.load_config()
	/**
	 * load cross-chain configuration from the database; after loading, basic cross-chain information will be obtained, including original chain token, target chain token, message channel name, and corresponding Chain Evm service address.
	 */
	await load_bridges();
	flow.init(bridge_list);
	/**
	 * send heartbeat messages to Relay at regular intervals to keep lp online
	 */
	flow.keep_bridge_quote();
	/**
	 * periodically refresh orderbook for providing quote support
	 */
	flow.fetch_orderbook()
	/**
	 * synchronize balance of hedging account in cex
	 * account needs to be modified in the amm configuration on the otmoic app.
	 */
	flow.fetch_cex_balance();
};
main()
	.then(() => { })
	.catch((e) => {
		console.error(e);
	});
