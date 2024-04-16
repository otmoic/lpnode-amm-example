const db = require("./db.js");
const _ = require("lodash");
// interact with the exchange_adapter program
const exchangeAdapter = require("./exchange_adapter/exchange_adapter.js")
class Flow {
	constructor() {
		this.bridge_list = [];
		this.pubredis = db.redis.get_redis_new();
		this.protocal = {
			origTotalPrice: "",
			price: "", // return this.calculate(item, price);
			origPrice: "", // The original quotation of the currency, which is used to calculate the slippage after
			dst_usd_price: "", // dstToken/StableCoin
			min_amount: "", // Minimum required input
			gas: `0`,
			capacity: `0x${(50000000000000000000000).toString(16)}`, // The maximum supply that the system can provide
			native_token_price: `0`, // srcToken/TargetChain Coin Price
			native_token_usdt_price: `0`, // TargetChain Coin Price/USDT
			native_token_max: `1`, // native_token maximum exchange amount
			native_token_min: `0.1`, // minimum exchange amount
			timestamp: new Date().getTime(), // Time quotes
			quote_hash: "", // Quotation unique hash
		};
	}
	init(bridge_list) {
		this.bridge_list = bridge_list;
		const sub_redis = db.redis.get_redis_new();
		sub_redis.on("message", (channel, message) => {
			this.on_lp_message(channel, message);
		});
		if (_.isArray(bridge_list)) {
			_.map(bridge_list, (item) => {
				console.log("subscribe", item.msmqName);
				sub_redis.subscribe(item.msmqName);
			});
		}
		console.log("init bridge_list", bridge_list);
	}
	async keep_bridge_quote() {
		if (_.isArray(this.bridge_list)) {
			_.map(this.bridge_list, (item) => {
				console.log("keep_bridge_quote", item.msmqName);
				this.send_keep_quote(item.msmqName, this.protocal);
			});
		}
		setTimeout(() => {
			this.keep_bridge_quote();
		}, 1000 * 10);
	}
	async send_keep_quote(channel, protocal) {
		const cmd = {
			cmd: "CMD_UPDATE_QUOTE",
			quote_data: protocal,
		};
		this.send_msg(channel, cmd);
	}

	async fetch_orderbook() {
		console.log("fetch_orderbook")
		const ret = await exchangeAdapter.get_orderbook()
		setTimeout(() => {
			this.fetch_orderbook()
		}, 1000 * 10)
	}
	async fetch_cex_balance() {
		console.log("fetch cex_balance")
		// for account retrieval, please refer to resource.js
		const account_id = "001"
		await exchangeAdapter.get_cex_spot_balance(account_id)
		setInterval(() => {
			this.fetch_cex_balance()
		}, 1000 * 30)
	}
	async fetch_markets(){
		await exchangeAdapter.get_markets()
	}

	async send_msg(channel, cmd) {
		console.info(`send cmd`, channel, _.get(cmd, "cmd", ""));
		_.set(cmd, "_is_local", "1");
		this.pubredis.publish(channel, JSON.stringify(cmd));
	}
	async on_lp_message(channel, message) {
		const msg = JSON.parse(message);
		const is_local = _.get(msg, "_is_local", "0");
		if (is_local !== "1") {
			console.log("receive message", message);
		}
		const received_cmd = _.get(msg, "cmd", undefined);
		if (!received_cmd) {
			console.error("unknown command");
			return;
		}
		if (received_cmd === "CMD_ASK_QUOTE") {
			// please retrieve orderbook data and quote according to actual circumstances
			this.replay_quote(channel, msg);
		}
		if (received_cmd === "EVENT_LOCK_QUOTE") {
			// here, you can opt to perform a reverse operation on the CEX.
			await exchangeAdapter.spot_order("BUY")
			this.replay_lock(channel, msg);
		}
		if (received_cmd === "EVENT_TRANSFER_OUT") {
			this.call_transfer_in(channel, msg);
		}
		if (received_cmd === "EVENT_TRANSFER_IN") {
			console.log("EVENT_TRANSFER_IN");
		}
		if (received_cmd === "CMD_TRANSFER_IN_CONFIRM") {
			console.log(received_cmd, message);
		}
		if (received_cmd === "EVENT_TRANSFER_OUT_CONFIRM") {
			this.call_transfer_in_confirm(channel, msg);
		}
		if (received_cmd === "CMD_TRANSFER_OUT_REFUND") {
			this.call_transfer_in_refund(channel, msg);
		}
	}
	async call_transfer_in_refund(channel, msg) {
		const cmd = {
			cmd: "CMD_TRANSFER_IN_REFUND",
			business_full_data: _.get(msg, "business_full_data"),
		};
		this.send_msg(channel, cmd);
	}
	async call_transfer_in_confirm(channel, msg) {
		const cmd = {
			cmd: "CMD_TRANSFER_IN_CONFIRM",
			business_full_data: _.get(msg, "business_full_data"),
		};
		this.send_msg(channel, cmd);
	}
	/**
	 * respond to user's inquiry request
	 * specific price, you can obtain it freely or rely on the exchange-adapter program to fetch the orderbook from supported Cex exchanges
	 * refer to orderbook.js for acquisition method
	 * @param {*} channel 
	 * @param {*} ask_msg 
	 */
	async replay_quote(channel, ask_msg) {
		const cmd = {
			cid: _.get(ask_msg, "cid", undefined),
			cmd: "EVENT_ASK_REPLY",
			quote_data: {
				origTotalPrice: "1879.35",
				price: "1869.95325",
				origPrice: "1879.35",
				dst_usd_price: 1,
				min_amount: "0.01067384",
				gas: "0",
				capacity: "0x54029706960000000000",
				native_token_price: "7.8668626419856962558",
				native_token_usdt_price: "237.7",
				native_token_max: "0.27634550",
				native_token_min: "0.08413968",
				timestamp: 1687780150044,
				quote_hash: "9b3e3af17cc091d4b20e0083f57c075983379b28",
				quote_orderbook_type: "SELL",
				src_usd_price: "1879.35",
				mode: "bs",
				orderbook: {
					A: {
						bids: [[1879.35, 1]],
						asks: [[1879.36, 1]],
						timestamp: 1687780149704,
					},
					B: null,
				},
				hedge_fee_asset_price: 237.7,
				hedge_fee_asset: "BNB",
				native_token_orig_price: "7.9063946150610012621",
				native_token_symbol: "BNB/USDT",
				assetName: "ETH/USDT",
				assetTokenName:
					"0x87B78C05c78895D01da25767E25d341Bf341cB6A/0xADC66B2D406eb183AB8423c3bF89e540da5786d2",
				assetChainInfo: "9006-9006",
				capacity_num: "54.02970696",
				native_token_min_number: 0.08413968,
				native_token_max_number: 0.2763455,
			},
		};
		console.log("send cmd", cmd);
		this.send_msg(channel, cmd);
	}
	async replay_lock(channel, lock_msg) {
		_.set(
			lock_msg,
			"pre_business.order_append_data",
			JSON.stringify({
				orderId: 1,
			})
		); // return orderId
		_.set(lock_msg, "pre_business.locked", true);
		_.set(lock_msg, "pre_business.err_msg", "");
		const cmd = {
			cmd: "CALLBACK_LOCK_QUOTE",
			pre_business: _.get(lock_msg, "pre_business", {}),
		};
		console.log("send cmd", cmd);
		this.send_msg(channel, cmd);
	}
	async call_transfer_in(channel, transfer_out_msg) {
		const cmd = {
			cmd: "CMD_TRANSFER_IN",
			business_full_data: _.get(transfer_out_msg, "business_full_data", {}),
		};
		this.send_msg(channel, cmd);
	}
}
module.exports = new Flow();
