/**
 * obtain data from APIs provided by the exchange_adapter program
 */
const { default: axios } = require("axios")
const _ = require("lodash")
const MARKET_HOST = `obridge-amm-market-price-service`
const MARKET_PORT = 18080
class ExchangeAdapter {
    async get_orderbook() {
        try {
            const url = `http://${MARKET_HOST}:${MARKET_PORT}/api/spotOrderbook`;
            console.log("request:", url)
            const ret = await axios.request({
                url: url,
                method: "get",
                timeout: 5000
            })
            console.log(_.get(ret, "data", {}))
        } catch (e) {
            console.error(e)
        }
    }
    async get_cex_spot_balance(account_id) {
        try {
            const url = `http://${MARKET_HOST}:${MARKET_PORT}/api/spotBalances?accountId=${account_id}`
            console.log("request:", url)
            const ret = await axios.request({
                url,
                method: "get",
                timeout: 5000
            })
            console.log(_.get(ret, "data", {}))
        } catch (e) {
            console.error(e)
        }
    }
    async spot_order(account_id, side = "BUY") {
        /**
           {
                {
                code: 0,
                result: {
                    info: {
                        symbol: 'ETHUSDT',
                        orderId: '1257224',
                        orderListId: '-1',
                        clientOrderId: '00X87',
                        transactTime: '1713247663152',
                        price: '0.00000000',
                        origQty: '0.00800000',
                        executedQty: '0.00800000',
                        cummulativeQuoteQty: '24.49176000',
                        status: 'FILLED',
                        timeInForce: 'GTC',
                        type: 'MARKET',
                        side: 'BUY',
                        workingTime: '1713247663152',
                        fills: [Array],
                        selfTradePreventionMode: 'EXPIRE_MAKER'
                    },
                    id: '1257224',
                    clientOrderId: '00X87',
                    timestamp: 1713247663152,
                    datetime: '2024-04-16T06:07:43.152Z',
                    lastTradeTimestamp: 1713247663152,
                    lastUpdateTimestamp: 1713247663152,
                    symbol: 'ETH/USDT',
                    type: 'market',
                    timeInForce: 'GTC',
                    postOnly: false,
                    reduceOnly: null,
                    side: 'buy',
                    price: 3061.47,
                    triggerPrice: null,
                    amount: 0.008,
                    cost: 24.49176,
                    average: 3061.47,
                    filled: 0.008,
                    remaining: 0,
                    status: 'closed',
                    fee: null,
                    trades: [
                        [Object]
                    ],
                    fees: [],
                    stopPrice: null,
                    takeProfitPrice: null,
                    stopLossPrice: null
                }
            }
         */
        const url = `http://${MARKET_HOST}:${MARKET_PORT}/api/order/createMarketOrder?accountId=${account_id}`
        const order_data = {
            market: "ETH/USDT",
            side,
            timestamp: new Date().getTime(),
            quantity: "0.008",
            clientOrderId: "00X87",
        }
        try {
            const response = await axios.request({
                url,
                method: "POST",
                headers: {
                    accountId: account_id,
                },
                data: order_data,
            })
            console.log(_.get(response, "data", {}))
        } catch (e) {
            console.error(e)
        }
    }
    async get_markets() {
        try {
            const url = `http://${MARKET_HOST}:${MARKET_PORT}/api/public/fetchMarkets`
            console.log("request url:", url)
            const ret = await axios.request({
                url,
                method: "get"
            })
            console.log(_.get(ret, "data", {}))
        } catch (e) {
            console.error(e)
        }
    }
}
const exchangeAdapter = new ExchangeAdapter()
module.exports = exchangeAdapter