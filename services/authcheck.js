const jwtlib = require('jsonwebtoken'),
      crypto = require('crypto'),
      redis=require('../services/redis.js'),
      configs=require('../config/configs.js'),
      jwt = configs.jwt;
module.exports =
  (req)=>{
      return new Promise((resolve, reject) => {
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
                      resolve([auth,tokenOne,object]);
                    });
                  }
                  else {
                      resolve([auth,tokenOne,null]);
                  }
                }
                else {
                    resolve([auth,tokenOne,null]);
                }
            });
              }
              else {
                  resolve([auth,tokenOne,null]);
              }
            }
            else {
                resolve([auth,tokenOne,null]);
            }
          });
        } catch (err) {
          console.log('error authchech',err);
          resolve([auth,tokenOne,null]);
        }
      });
    }
