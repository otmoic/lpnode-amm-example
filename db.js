const _ = require("lodash");
const Redis = require("ioredis");
const mongo_drive = require("mongodb");
const mongoHost = _.get(process.env, "OBRIDGE_MONGODB_HOST", undefined);
const mongoPass = _.get(process.env, "MONGODB_PASSWORD", undefined);
const uri = `mongodb://root:${mongoPass}@${mongoHost}:27017`;
const redis_host = _.get(process.env, "OBRIDGE_REDIS_HOST");
const redis_pass = _.get(process.env, "REDIS_PASSWORD", undefined);
const redis_port = 6379;

console.log(redis_host, redis_pass, redis_port);
const pub_redis = null;
const sub_redis = null;
let data_redis_list = new Map();
const db_list = new Map();
const mongo_client = new mongo_drive.MongoClient(uri);
const db = {
  redis: {
    get_pub_redis: () => {
      const pub_redis = new Redis({
        host: redis_host,
        port: redis_port,
        password: redis_pass,
        db: 0,
        retryStrategy: (times) => {
          console.error(
            `redis Host:${redis_host},port:${redis_port} reconnect number ${times}`
          );
          const delay = Math.min(times * 50, 1000 * 10);
          return delay;
        },
      });
      return pub_redis;
    },
    get_sub_redis: () => {
      const sub_redis = new Redis({
        host: redis_host,
        port: redis_port,
        password: redis_pass,
        db: 0,
        retryStrategy: (times) => {
          console.error(
            `redis Host:${redis_host},port:${redis_port} reconnect number ${times}`
          );
          const delay = Math.min(times * 50, 1000 * 10);
          return delay;
        },
      });
      return sub_redis;
    },
    get_data_redis: (db_index) => {
      if (data_redis_list.get(db_index)) {
        return data_redis_list.get(db_index);
      }
      const redis = new Redis({
        host: redis_host,
        port: redis_port,
        password: redis_pass,
        db: db_index,
        retryStrategy: (times) => {
          console.error(
            `redis Host:${redis_host},port:${redis_port} reconnect number ${times}`
          );
          const delay = Math.min(times * 50, 1000 * 10);
          return delay;
        },
      });
      data_redis_list.set(db_index, redis);
      return redis;
    },
  },
  mongodb: {
    get_db(db_name) {
      if (!db_list.get(db_name)) {
        const database = mongo_client.db(db_name);
        db_list.set(db_name, database);
        return database;
      }
      return db_list.get(db_name);
    },
    select_table(db_name, collection_name) {
      return db.mongodb.get_db(db_name).collection(collection_name);
    },
  },
};
module.exports = db;
