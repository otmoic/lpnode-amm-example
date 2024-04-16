/**
 * synchronize wallet balance from the Chain, based on this data, you can determine whether there is sufficient balance for cross-chain transactions
 */
const { default: axios } = require("axios");
const _ = require("lodash");
const dex_wallet = {
	need_sync_tokens: [],
	need_request: [],
	init_wallet: (bridges) => {
		const group_list = _.groupBy(bridges, (item) => {
			return `${item.dstChainId}_${item.dstToken}_${item.wallet_id.toString()}`;
		});
		const need_sync_tokens = _.map(Object.keys(group_list), (group_key) => {
			return {
				key: group_key,
				token: group_list[group_key][0].dstToken,
				wallet_id: group_list[group_key][0].wallet_id.toString(),
				dst_client_uri: group_list[group_key][0].dstClientUri,
			};
		});
		dex_wallet.need_sync_tokens = need_sync_tokens;
		dex_wallet.need_request = Object.keys(
			_.groupBy(need_sync_tokens, (item) => {
				return item.dst_client_uri;
			})
		);
		console.log({ need_sync_tokens });
		dex_wallet.sync_balance();
	},
	sync_balance: async () => {
		console.log("sync_balance");
		dex_wallet.need_request.forEach(async (it) => {
			const base_url = it;
			const access_url = `${base_url}/lpnode/get_wallets`;
			const response = await axios.request({ url: access_url, method: "POST" });
			console.log("des token balance info");
			console.dir(_.get(response, "data.data", undefined), { depth: 5 });
		});
		setTimeout(() => {
			dex_wallet.sync_balance();
		}, 1000 * 10);
	},
};
module.exports = dex_wallet;
