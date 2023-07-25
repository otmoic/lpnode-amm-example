const PortfolioRequest = require("./portfolio_request");

class PortfolioMarkets {
  constructor(trading_pair, access_token_getter) {
    this.trading_pair = trading_pair;
    this.access_token_getter = access_token_getter;
    (async () => {
      await this.subscription();
    })();
  }
  async subscription() {
    console.log("subscription trading_pair markets");
    for (let i = 0; i < this.trading_pair.length; i++) {
      console.log("trading_pair", this.trading_pair[i]);
      const tobeSend = {
        exchange: "15",
        market: this.trading_pair[i].replace("/", ""),
      };
      console.log("send data", JSON.stringify(tobeSend));
      const access_token = this.access_token_getter();
      console.log("access_token:", access_token);
      const pr = new PortfolioRequest(access_token);
      const sub_response = await pr.post("AddSubMarkets", tobeSend);
      console.log("sub_response:", sub_response);
    }
  }
  async request_spot_orderbook() {
    const portfolio_pair_list = this.trading_pair.map((it) => {
      return it.replace("/", "");
    });
    const market_str = portfolio_pair_list.join(",");

    const queryData = {
      exchange: "15",
      market: market_str,
    };
    console.info("get depth", JSON.stringify(queryData));
    const access_token = this.access_token_getter();
    const pr = new PortfolioRequest(access_token);
    const orderbookResponse = await pr.post("Depth", queryData);
    return orderbookResponse;
  }
}
module.exports = PortfolioMarkets;
