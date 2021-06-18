/*01*/const query = require('../db_apis/query.js'),
            configs=require('../config/configs.js'),
            jwt = configs.jwt,
            database = require('../services/database.js');
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if ((!!req.body.login) && (!!req.body.password)) {
          try {
            const context = {};
            context.params={login:req.body.login};
            context.sql=`SELECT USER_ID,
                                PASSWORD,
                                ISNULL(FIO,'null') FIO,
                                ISNULL(EMAIL,'null') EMAIL,
                                ISNULL(PHONE,'null') PHONE,
                                SOL
                           FROM REP_USERS
                          WHERE LOGIN=@login`;
            const resquery = await query.find(context),
                  rows=resquery.recordsets[0];
            if (rows.length>0) {
              const bcrypt = require('bcrypt');
              bcrypt.hash(req.body.password, jwt.salts[rows[0]['SOL']],async function(err, hash) {
                  //console.log('hash',hash);
                  if (rows[0]['PASSWORD']==hash) {
                    const resAuthUser=await database.authUser(req,rows,context);
                    return res.status(200).json(resAuthUser);
                  }
                  else {
                      return res.status(200).json({ message: 'PWD error' });
                  }
              });
            }
            else {
                return res.status(200).json({ message: 'User not found' })
            }
          } catch (err) {
            next(err);
          }
        }
        else {
            return res.status(200).json({ message: 'Data error' });
        }

}

module.exports.post = post;
