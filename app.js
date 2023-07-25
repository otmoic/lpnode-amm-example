/**
 * 
Use container environment variables to link mongodb and redis databases;
Use lp_admin to create custom configurations;
Use lp_admin to read custom configuration;
Load the bridge configuration in the database;
refresh portfolio access_token;
Use portfolio to synchronize hedging account balance;
Use portfolio to create cex order;
Subscribe to portfolio order creation and execution events;
Synchronize dex wallet balance;
Subscribe to the currency pair channel to complete the cross-chain process.
Use portfolio to get binance order book

 */
const axios = require("axios");
const _ = require("lodash");
const db = require("./db.js");
const portfolio = require("./portfolio.js");
const dex_wallet = require("./dex_wallet.js");
const flow = require("./flow.js");
const PortfolioRequest = require("./portfolio_request.js");
let base_config = null;
let bridge_list = [];
const lp_admin_base_url = _.get(
  process.env,
  "LP_ADMIN_PANEL_ACCESS_BASEURL",
  ""
);
if (!lp_admin_base_url) {
  console.error("lp_admin_base_url not found ");
  process.exit(1);
}
const create_base_config_id = async () => {
  try {
    const data = {
      appName: _.get(process.env, "APP_NAME", ""),
      version: _.get(process.env, "APP_VERSION", ""),
      clientId: Buffer.from(new Date().getTime().toString()).toString("base64"),
      template:
        '{"chainDataConfig":[{"chainId":9006,"config":{"minSwapNativeTokenValue":"0.5"}},{"chainId":9000,"config":{"minSwapNativeTokenValue":"0.5"}}],"hedgeConfig":{"hedgeAccount":"a001","hedgeType":"CoinSpotHedge","accountList":[{"accountId":"a001","exchangeName":"binance","spotAccount":{"apiKey":"","apiSecret":""},"usdtFutureAccount":{"apiKey":"","apiSecret":""},"coinFutureAccount":{"apiKey":"","apiSecret":""}}]}}',
    };
    console.log("send data to lp_admin:", data);
    result = await axios.request({
      url: `${lp_admin_base_url}/lpnode/lpnode_admin_panel/configResource/create`,
      method: "post",
      data,
    });
    console.info("create configuration return:", _.get(result, "data", ""));
    const id = _.get(result, "data.result.id", "");
    const clientId = _.get(result, "data.result.clientId", "");
    if (!id || id === "" || !clientId || clientId === "") {
      logger.error(
        "Failed to create configuration for service, unable to start, Lp_admin returns incorrect"
      );
      process.exit(5);
    }
    console.info(
      "The configId was created successfully, please restart the app"
    );
    return clientId;
  } catch (e) {
    console.error(
      "Error creating configuration",
      e.toString(),
      _.get(e, "response.data", "")
    );
  }
};
const load_config = async () => {
  const app_name = _.get(process.env, "APP_NAME");
  if (!app_name) {
    throw "app_name not found";
  }
  db.redis.get_data_redis(0);

  console.log(`config_id_${app_name}`);
  const config_id = await db.redis
    .get_data_redis(0)
    .get(`config_id_${app_name}`);
  console.log("config_id is:", config_id);
  if (!config_id) {
    const config_id = await create_base_config_id();
    await db.redis.get_data_redis(0).set(`config_id_${app_name}`, config_id);
    process.exit(1);
  }
  await load_config_form_obridge_admin(config_id);
};
const load_config_form_obridge_admin = async (config_id) => {
  const base_url = _.get(process.env, "LP_ADMIN_PANEL_ACCESS_BASEURL", "");
  if (!base_url) {
    throw "base_url not found";
  }
  const url = `${base_url}/lpnode/lpnode_admin_panel/configResource/get`;

  const response = await axios.request({
    url,
    method: "post",
    data: { clientId: config_id },
  });
  console.log("___");
  console.log(response.data);
  base_config = JSON.parse(
    (() => {
      const config = _.get(response, "data.result.templateResult", "{}");
      if (config === "") {
        return "{}";
      }
      return config;
    })()
  );
  if (!base_config.hedgeConfig || !base_config.hedgeConfig.hedgeAccount) {
    console.log(
      "The basic configuration data is incorrect, waiting for reconfiguration"
    );
    process.exit(1);
  }
};

const load_bridges = async () => {
  const bridges = await db.mongodb
    .select_table("lp_store", "bridges")
    .find({})
    .limit(10)
    .toArray();
  await dex_wallet.init_wallet(bridges);
  bridge_list = bridges;
};
const main = async () => {
  await load_config();
  await load_bridges();
  const hedge_account = _.get(base_config, "hedgeConfig.hedgeAccount", null);
  // portfolio account balance , binance markets info order stream
  await portfolio.init(hedge_account);
  const trading_pair = ["ETH/USDT"];
  const markets = await portfolio.init_markets(trading_pair);
  setTimeout(async () => {
    const market_response = await markets.request_spot_orderbook();
    console.log("market_response", market_response);
  }, 1000 * 5);

  setTimeout(async () => {
    const create_order_data = {
      client: hedge_account,
      exchange: "15",
      client_id: "Test001",
      market: "ETHUSDT",
      size: "0.01",
      price: "0",
      side: "sell",
      order_type: "market",
      post_only: false,
    };
    const pr = new PortfolioRequest(portfolio.latest_token);
    const order_response = await pr.post("CreateOrder", create_order_data);
    console.log("order_response", order_response);
  }, 1000 * 10);

  // flow
  flow.init(bridge_list);
  flow.keep_bridge_quote();
};
main()
  .then(() => {})
  .catch((e) => {
    console.error(e);
  });
