/*01*/const jwt = require('../config/jwt'),
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
              if ((typeof payload['id']!== "undefined") & (typeof payload['city']!== "undefined")) {
                try {
                  redis.client.hgetall('user_'+payload.city+'_'+payload.id, function(err, object) {
                      //console.log(object);
                      if (!!object) {
                        if (typeof object['id']!=="undefined") {
                          if (payload.id==object.id && payload.login==object.login && req.headers.origin==payload.host && payload.city==object.city) {
                              redis.client.del('user_'+payload.city+'_'+object.id);
                              redis.client.del('userToken_'+payload.city+'_'+object.id);
                              redis.client.del('userRigths_'+payload.city+'_'+object.id);
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
