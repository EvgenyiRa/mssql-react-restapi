/*01*/const configs=require('../config/configs.js'),
            jwt = configs.jwt,
            jwtlib = require('jsonwebtoken'),
            redis=require('../services/redis.js');

/*02*/
/*03*/async function post(req, res, next) {
        if (!!req.body.authorization) {
          jwtlib.verify(req.body.authorization, jwt.tokenKey, (err, payload) => {
            if (err) {
                res.status(200).json({ message: 'Error load token' });
            }
            else if (payload) {
              if (typeof payload['id']!== "undefined") {
                try {
                  redis.client.hgetall('user_'+payload.id, function(err, object) {
                      //console.log(object);
                      if (!!object) {
                        if (typeof object['id']!=="undefined") {
                          if (payload.id==object.id && payload.login==object.login && req.headers.origin==payload.host) {
                              redis.client.del('user_'+object.id);
                              redis.client.del('userToken_'+object.id);
                              redis.client.del('userRigths_'+object.id);
                              res.status(200).json({ message: 'Cache del' });
                          }
                        }
                      }
                  });
                } catch (err) {
                  console.log('error authdel',err);
                }
              }
            }
          });
        }
      }

module.exports.post = post;
