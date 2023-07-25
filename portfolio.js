const _ = require("lodash");
const axios = require("axios");
const bcrypt = require("bcrypt");
const PortfolioRequest = require("./portfolio_request");
const PortfolioOrderStream = require("./portfolio_order_stream");
const PortfolioMarkets = require("./portfolio_markets");
class Portfolio {
  constructor() {
    this.app_key = undefined;
    this.app_secret = undefined;
    this.service = null;
    this.latest_token = null;
    this.account_id = null;
    this.balance = {};
  }
  async init_markets(trading_pair) {
    const markets = new PortfolioMarkets(trading_pair, () => {
      return this.latest_token;
    });
    return markets;
  }
  async init(account_id) {
    console.log("init account_id:", account_id);
    this.account_id = account_id;
    this.app_key = _.get(process.env, "OS_API_KEY", undefined);
    this.app_secret = _.get(process.env, "OS_API_SECRET", undefined);
    this.service = _.get(process.env, "OS_SYSTEM_SERVER", undefined);
    console.log(this.app_key, this.app_secret, "$$$$$$$");
    if (!this.app_key || !this.app_secret) {
      throw "init error";
    }
    if (!this.service) {
      throw "service host not found";
    }
    await this.sync_token();
    if (!this.latest_token) {
      throw "can't get token";
    }
    await this.async_spot_balance();
    await this.connect_private_stream();
  }
  async async_spot_balance() {
    const pr = new PortfolioRequest(this.latest_token);
    const balance_response = await pr.post("Account", {
      exchange: "15",
    });
    if (_.isArray(balance_response) && balance_response.length >= 1) {
      console.info("balance load finish");
      const balance_list = balance_response.filter((it) => {
        if (
          it.account_name === this.account_id &&
          it.exchange_name === "binance_spot"
        ) {
          return true;
        }
        return false;
      });
      if (balance_list.length <= 0) {
        console.error("balance not found");
        return;
      }
      this.balance = balance_list[0].spot_balances;
      console.info("balance", this.balance);
    }
  }
  async sync_token() {
    console.log("sync_token access token");
    const timestamp = (new Date().getTime() / 1000).toFixed(0);
    const text = this.app_key + timestamp + this.app_secret;
    const token = await bcrypt.hash(text, 10);
    const body = {
      app_key: this.app_key,
      timestamp: parseInt(timestamp),
      token: token,
      perm: {
        group: "portfolio",
        dataType: "key",
        version: "v1",
        ops: [
          "Account",
          "MarketInfo",
          "SubMarkets",
          "SupportAccount",
          "Depth",
          "Deal",
          "AddSubMarkets",
          "CreateOrder",
        ],
      },
    };
    try {
      const res = await axios.request({
        method: "post",
        url: `http://${this.service}/permission/v1alpha1/access`,
        data: body,
      });
      const access_token = _.get(res, "data.data.access_token", undefined);
      this.latest_token = access_token;
      console.log("latest_token:", access_token);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        this.sync_token();
      }, 1000 * 60 * 3);
    }
  }
  async connect_private_stream() {
    const private_stream = new PortfolioOrderStream(this.account_id);
    private_stream.connect();
    private_stream.on_message_callback((msg) => {
      /**
       * {"method": "order.update", "params": {"account_name": "B001", "fill_fees": 5.8409999999999998e-5, "base": "", "client_id_from_ex": "", "client_id": "Test001", "quote": "", "event": "ORDER_DONE", "market": "ETHUSDT", "real_exchange_id": 15, "fee_type": "BNB", "exchange_index": 2, "is_create_order_by_iv": false, "iv": 0.0, "price": 0.0, "order_id": "13919815631", "order_type": "market", "quote_size": 0.0, "quote_size_filled": 18.5151, "timestamp": 1690266165.821732, "status": 5, "settle": "", "settle_size": 0.0, "side": "sell", "size": 0.01, "size_filled": 0.01}, "id": null}
       */
      console.log(`private_stream received message:`, msg);
    });
  }
  async create_order(order_data) {}
}
module.exports = new Portfolio();
