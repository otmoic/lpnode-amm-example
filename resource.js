const { default: axios } = require("axios");
const db = require("./db.js");
const _ = require("lodash");
const APP_NAME = _.get(process.env, "APP_NAME", undefined)
const APP_VERSION = _.get(process.env, "APP_VERSION", "")
const ADMIN_PANEL_BASEURL = _.get(process.env, "LP_ADMIN_PANEL_ACCESS_BASEURL", undefined)
class Resource {
    constructor() {
        this._data_redis = db.redis.get_redis()
    }
    async create_config() {
        const template =
            '{"chainDataConfig":[{"chainId":9006,"config":{"maxSwapNativeTokenValue":"50000","minSwapNativeTokenValue":"0.5"}}],"bridgeBaseConfig":{"defaultFee":"0.003","enabledHedge":false},"bridgeConfig":[],"orderBookType":"market","hedgeConfig":{"hedgeAccount":"001","hedgeType":"CoinSpotHedge","accountList":[{"enablePrivateStream":false,"apiType":"exchange_adapter","accountId":"001","exchangeName":"binance","spotAccount":{"apiKey":"","apiSecret":""},"usdtFutureAccount":{"apiKey":"","apiSecret":""},"coinFutureAccount":{"apiKey":"","apiSecret":""}}]}}';
        result = await axios.request({
            url: `${lpAdminPanelUrl}/lpnode/lpnode_admin_panel/configResource/create`,
            method: "post",
            data: {
                appName: APP_NAME,
                version: APP_VERSION,
                clientId: Buffer.from(new Date().getTime().toString()).toString(
                    "base64"
                ),
                template,
            },
        });
        logger.debug("create configuration return:", _.get(result, "data", ""));
        const id = _.get(result, "data.result.id", "");
        const clientId = _.get(result, "data.result.clientId", "");
        console.log("create result sucess", id, clientId)

    }
    async load_config() {
        const app_config_key = `config_id_${APP_NAME}`;
        const resource_id = await this._data_redis.get(app_config_key)
        console.log(resource_id)
        const url = `${ADMIN_PANEL_BASEURL}/lpnode/lpnode_admin_panel/configResource/get`
        try {
            const response = await axios.request({
                url,
                timeout: 5000,
                method: "post",
                data: {
                    clientId: resource_id
                }
            })
            /**
                the exchange_adapter program automatically loads the account configured in hedgeAccount; using the name configured in hedgeAccount, you can request balance or manage orders.
                {
                    chainDataConfig: [ { chainId: 9006, config: [Object] } ],
                    bridgeBaseConfig: { defaultFee: '0.003', enabledHedge: false },
                    bridgeConfig: [],
                    orderBookType: 'market',
                    hedgeConfig: {
                        hedgeAccount: '001',
                        hedgeType: 'CoinSpotHedge',
                        accountList: [ [Object] ]
                    }
                }
             */
            const ret = _.get(response, "data.result.templateResult", "{}")
            const config_object = JSON.parse(ret)
            console.log(config_object)
        } catch (e) {
            const server_error_message = _.get(e, "response.data.message", "");
            if (server_error_message.includes("configId is not exist")) {

            }
            console.error(e)
        }


    }
}
const resource = new Resource()
module.exports = resource