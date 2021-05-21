/*01*/const jwt = require('../config/jwt');
      const bcrypt = require('bcrypt');
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if (!!req.body.authorization) {
          //const authorization=req.body.authorization.toString();
          jwt.verify(req,jwt,async function(resAuath,tokenOne,user) {
            if (resAuath) {
              function getRandomInRange(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
              }
              let numSol;
              if (!!req.body.sol) {
                numSol=req.body.sol;
              }
              else {
                numSol=getRandomInRange(0, jwt.salts.length-1);
              }
              bcrypt.hash(req.body.password, jwt.salts[numSol],async function(err, hash) {
                  return res.status(200).json({sol:numSol,hash:hash,tokenOne:tokenOne});
              });
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
