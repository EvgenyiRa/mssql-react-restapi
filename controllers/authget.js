/*01*/const redis=require('../services/redis.js'),
            jwt = require('../config/jwt');
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if (!!req.body.authorization) {
          //const authorization=req.body.authorization.toString();
          jwt.verify(req,jwt,async function(resAuath,tokenOne,user) {
            if (resAuath) {
              if (+user.rights===1) {
                try {
                  redis.client.get('userRigths_'+user.id, function(err, object) {
                    user.rights=JSON.parse(object);
                    res.status(200).json({user:user,tokenOne:tokenOne});
                  });
                } catch (err) {
                  next(err);
                }
              }
              else {
                res.status(200).json({user:user,tokenOne:tokenOne});
              }
            }
            else {
              res.status(200).json({ message: 'Token false' })
            }
          });
        }
        else {
          res.status(200).json({ message: 'User not authorized' })
        }


}

module.exports.post = post;
