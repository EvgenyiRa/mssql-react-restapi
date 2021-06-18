const jwtlib = require('jsonwebtoken'),
      redis=require('../services/redis.js'),
      crypto = require('crypto');
module.exports={tokenKey : '7a2b-3c7d-5e6f-7g8h',
                host: process.env.JWT_FRONTEND_PATH || "http://localhost:3000",
                expiresIn:'8h',
                redisExpire:28800,//8часов
                verify:function(req,jwt,callback) {
                  var auth=false,
                      tokenOne='';
                  try {
                    jwtlib.verify(req.body.authorization, jwt.tokenKey, (err, payload) => {
                      if (!!payload) {
                        if (typeof payload['id']!== "undefined") {
                          redis.client.hgetall('user_'+payload.id, function(err, object) {
                          //console.log('object',object,'payload',payload);
                          if (!!object) {
                            if (typeof object['id']!== "undefined") {
                              redis.client.lrange('userToken_'+payload.id, 0, -1, function(err2, object2) {
                                //console.log('req.body.tokenOne',req.body.tokenOne,'redis.client.get.userToken',object2);
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
              }
