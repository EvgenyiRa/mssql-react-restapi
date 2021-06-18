module.exports = {
  webServer:{
    port: process.env.HTTP_PORT || 3777,
    host: process.env.HTTP_BIND_IP || '127.0.0.1',
    https:false
 },
 database:{
   hrPool: {
     user: process.env.MSSQL_USER || 'user',
     password: process.env.MSSQL_PWD || 'pwd',
     server: process.env.MSSQL_SERVER || 'localhost',
     port: +process.env.MSSQL_PORT || 1433,
     database: process.env.MSSQL_DB || 'database',
     pool: {
         max: 10,
         min: 10,
         idleTimeoutMillis: 14400000 /*4hours*/
     },
     options: {
       encrypt: false
     }
   },
   dbtype:'mssql'
 },
 jwt:{
   tokenKey : '7a9b-5c7d-5e7f-7g9h',
   host: process.env.JWT_FRONTEND_PATH || "http://localhost:3000",
   expiresIn:'8h',
   redisExpire:28800,//8часов
   verify:function(req,jwt,callback) {
     const jwtlib = require('jsonwebtoken'),
           redis=require('../services/redis.js'),
           crypto = require('crypto');
     var auth=false,
         tokenOne='';
     try {
       jwtlib.verify(req.body.authorization, jwt.tokenKey, (err, payload) => {
         if (!!payload) {
           if (typeof payload['id']!== "undefined") {
             redis.client.hgetall('user_'+payload.id, function(err, object) {
             if (!!object) {
               if (typeof object['id']!== "undefined") {
                 redis.client.lrange('userToken_'+payload.id, 0, -1, function(err2, object2) {
                   if (payload.id==object.id && payload.login==object.login && payload.host==object.host) {
                       //наибольшая вероятность нахождения токена в очереди в её конце
                       for (var i = (object2.length-1); i>=0 ; i--) {
                           if (req.body.tokenOne==object2[i]) {
                             auth=true;
                             tokenOne = crypto.randomBytes(64).toString('hex'); //X-CSRF-Token
                             redis.client.rpush(['userToken_'+payload.id,tokenOne]);
                             break;
                           }
                       };
                       if (object2.length>=jwt.lenTokenQueue) {
                         for (var i = 0; i <= (object2.length-jwt.lenTokenQueue); i++) {
                           redis.client.lrem('userToken_'+payload.id, 0, object2[i]);
                         }
                       }
                   }
                   callback(auth,tokenOne,object);
                 });
               }
               else {
                   callback(auth,tokenOne,null);
               }
             }
             else {
                 callback(auth,tokenOne,null);
             }
         });
           }
           else {
               callback(auth,tokenOne,null);
           }
         }
         else {
             callback(auth,tokenOne,null);
         }
       });
     } catch (err) {
       console.log('error jwt.verify',err);
       callback(auth,tokenOne,null);
     }
   },
   salts:['$2a$10$eSb3zD5nD4diakkyY.oRNg$',
          '$2a$10$A.6eNVSpds0uiBe6PwjgAg$',
          '$2a$10$Lo/U/CN8Rg95Bmm8Vf2Z.w$',
          '$2a$10$d18ZjBRTh34uP2UUdQrxDg$',
          '$2a$10$e44PXCG9XUsmi1cxYSg0mQ$'
        ],
   lenTokenQueue:8
 },
 redis:{
   port: process.env.MSSQL_REACT_RESTAPI_REDISPORT || 6379,
   host: process.env.MSSQL_REACT_RESTAPI_REDISHOST || '127.0.0.1'
 }

};
