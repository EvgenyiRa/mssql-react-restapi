const redis = require('redis'),
      redisConfig = require('../config/redis.js');;
let client = redis.createClient(redisConfig.port,redisConfig.host);

module.exports.client =client;
