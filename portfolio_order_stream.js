const _ = require("lodash");
const WebSocket = require("ws");
const system_service = _.get(process.env, "OS_SYSTEM_SERVER", undefined);
class PortfolioOrderStream {
  constructor(account_id) {
    this.account_id = account_id;
    this.socket = null;
    this.message_id = 0;
    this.on_message_fun = null;
    this.keep_send_promise_list = new Map();
  }
  on_message_callback(fun) {
    this.on_message_fun = fun;
  }
  async connect() {
    console.info("init streams 💥");
    const ws = new WebSocket(
      `ws://${system_service}/legacy/v1alpha1/websocket.portfolio/v1/ws/`
    );
    this.socket = ws;
    ws.on("error", (err) => {
      console.error("stream error");
      this.on_error(err);
    });
    ws.on("message", (data) => {
      this.on_message(data);
    });
    ws.on("open", () => {
      this.socket = ws;
      this.on_open();
    });
  }
  send_keep_available() {
    this.keep_available = setInterval(async () => {
      try {
        await this.sync_send_keep();
        console.info("send_keep_available success");
      } catch (e) {
        setTimeout(() => {
          this.reconnect();
        }, 1000);

        console.error(`keepAvailable data response error`, e);
      }
    }, 1000 * 10);
  }
  sync_send_keep() {
    const message_id = this.inc_message_id();
    this.socket.send(
      JSON.stringify({
        method: "server.ping",
        params: [],
        id: message_id,
      })
    );
    return new Promise((resolve, reject) => {
      const clearTimer = (msg_id) => {
        // logger.debug(`clear timeout..`);
        if (
          this.keep_send_promise_list.get(msg_id) &&
          this.keep_send_promise_list.get(msg_id)["time"]
        ) {
          clearTimeout(this.keep_send_promise_list.get(msg_id)["time"]);
        }
      };
      this.keep_send_promise_list.set(message_id, {
        time: setTimeout(() => {
          reject(new Error("Timeout"));
          this.keep_send_promise_list.delete(message_id);
        }, 3000),
        resolve: (msg_id) => {
          resolve(true);
          clearTimer(msg_id);
          this.keep_send_promise_list.delete(msg_id);
        },
        reject: (msg_id, message) => {
          reject(new Error(message));
          clearTimer(msg_id);
          this.keep_send_promise_list.delete(msg_id);
        },
      });
    });
  }
  clear_keeper() {
    if (this.keep_available) {
      clearInterval(this.keep_available);
    }
  }
  async reconnect() {
    if (this.socket) {
      try {
        this.clear_keeper();
        this.socket.removeAllListeners();
        this.socket.close();
      } catch (e) {
        logger.error(`close socket error:`, e);
      }
    }
    this.connect();
  }
  async on_message(data) {
    const message = JSON.parse(data.toString());
    const messageId = _.get(message, "id", 0);
    const result = _.get(message, "result", "");

    if (messageId > 0 && result === "pong") {
      // logger.info("received a poll message", data.toString());
      this.on_pong(messageId);
      return;
    }
    if (this.on_message_fun && typeof this.on_message_fun === "function") {
      this.on_message_fun(data.toString());
    }
  }
  on_pong(msg_id) {
    const wait_context = this.keep_send_promise_list.get(msg_id);
    if (wait_context && typeof wait_context.resolve === "function") {
      wait_context.resolve(msg_id);
      return;
    }
    console.warn(`send context not found msgId:${msg_id}`);
  }
  inc_message_id() {
    this.message_id++;
    return this.message_id;
  }
  async on_open() {
    console.info("ws open .. ");
    setTimeout(() => {
      this.socket.send(
        JSON.stringify({
          id: this.inc_message_id(),
          method: "server.sign",
          params: [this.account_id],
        })
      );
    }, 100);
    setTimeout(() => {
      this.socket.send(
        JSON.stringify({
          id: this.inc_message_id(),
          method: "order.subscribe2",
          params: [],
        })
      );
    }, 800);
    this.send_keep_available();
  }
  on_error(err) {
    console.error(`socket error:`, err);
    setTimeout(() => {
      this.reconnect();
    }, 1000);
  }
}
module.exports = PortfolioOrderStream;
