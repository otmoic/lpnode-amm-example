const _ = require("lodash");
const service = _.get(process.env, "OS_SYSTEM_SERVER", undefined);
const axios = require("axios");
class PortfolioRequest {
  constructor(access_token) {
    this.access_token = access_token;
  }
  async post(op_type, data) {
    try {
      const requestOption = {
        method: "post",
        url: `http://${service}/system-server/v1alpha1/key/portfolio/v1/${op_type}`,
        data,
        headers: {
          "Content-Type": "application/json",
          "X-Access-Token": this.access_token,
        },
      };
      console.log("requestOption:", requestOption);
      const axios_response = await axios.request(requestOption);
      const code_l1 = _.get(axios_response, "data.code", 1);
      if (code_l1 !== 0) {
        console.error("l1 error");
        console.error(_.get(axios_response, "data.message", ""));
        return undefined;
      }
      const code_l2 = _.get(axios_response, "data.data.code", {});
      if (code_l2 !== 0) {
        console.error(
          "portfolio response error",
          _.get(axios_response, "data.data", "")
        );
        return undefined;
      }
      const portfolio_response_data = _.get(
        axios_response,
        "data.data.data",
        {}
      );
      return portfolio_response_data;
    } catch (e) {
      console.error("request error", e);
      return undefined;
    }
  }
}
module.exports = PortfolioRequest;
