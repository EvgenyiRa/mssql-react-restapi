const redis = require('redis'),
      configs=require('../config/configs.js'),
      redisConfig = configs.redis;
const client = redis.createClient(redisConfig.port,redisConfig.host);

module.exports.client =client;
