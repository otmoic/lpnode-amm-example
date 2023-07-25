/**
 * obtain data from APIs provided by the exchange_adapter program
 */
const { default: axios } = require("axios")
const _ = require("lodash")
const MARKET_BASE_URL = `obridge-amm-market-price-service`
const MARKET_BASE_PORT = 18080
class ExchangeAdapter {
    async get_orderbook() {
        const url = `http://${MARKET_BASE_URL}:${MARKET_BASE_PORT}/api/spotOrderbook`;
        console.log("request:", url)
        const ret = await axios.request({
            url: url,
            method: "get",
            timeout: 5000
        })
        console.log(_.get(ret, "data", {}))

    }
    async get_cex_spot_balance(account_id) {
        const url = `http://${MARKET_BASE_URL}:${MARKET_BASE_PORT}/api/spotBalances?accountId=${account_id}`
        console.log("request:", url)
        const ret = await axios.request({
            url,
            method: "get",
            timeout: 5000
        })
        console.log(_.get(ret, "data", {}))
    }
}
const exchangeAdapter = new ExchangeAdapter()
module.exports = exchangeAdapter