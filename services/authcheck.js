const jwtlib = require('jsonwebtoken'),
      crypto = require('crypto'),
      redis=require('../services/redis.js'),
      configs=require('../config/configs.js'),
      jwt = configs.jwt;
module.exports =
  (req)=>{
      return new Promise((resolve, reject) => {
        var auth=false,
            tokenSingle='';
        try {
          jwtlib.verify(req.body.authorization, jwt.tokenKey, (err, authval) => {
            if (!!authval) {
              if (typeof authval['id']!== "undefined") {
                redis.client.hgetall('user_'+authval.id, function(err, object) {
                  if (!!object) {
                    if (typeof object['id']!== "undefined") {
                      if (authval.id==object.id && authval.login==object.login && authval.host==object.host) {
                        redis.client.lrange('userToken_'+authval.id, 0, -1, function(err2, object2) {
                          //вероятность положения токена в массиве в конце максимальна
                          for (var i = (object2.length-1); i>=0 ; i--) {
                              if (req.body.tokenOne==object2[i]) {
                                auth=true;
                                //Генерируем X-CSRF-Token (единичный токен)
                                tokenSingle = crypto.randomBytes(64).toString('hex');
                                redis.client.rpush(['userToken_'+authval.id,tokenSingle]);
                                break;
                              }
                          };
                          if (object2.length>=jwt.tokenQueueCount) {
                            for (var i = 0; i <= (object2.length-jwt.tokenQueueCount); i++) {
                              redis.client.lrem('userToken_'+authval.id, 0, object2[i]);
                            }
                          }
                          resolve([auth,tokenSingle,object]);
                        });
                      }
                      else {
                          resolve([auth,tokenSingle,null]);
                      }
                    }
                    else {
                        resolve([auth,tokenSingle,null]);
                    }
                  }
                  else {
                      resolve([auth,tokenSingle,null]);
                  }
                });
              }
              else {
                  resolve([auth,tokenSingle,null]);
              }
            }
            else {
                resolve([auth,tokenSingle,null]);
            }
          });
        } catch (err) {
          console.log('error authchech',err);
          resolve([auth,tokenSingle,null]);
        }
      });
    }
