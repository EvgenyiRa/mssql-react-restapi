/*01*/const query = require('../db_apis/query.js'),
            configs=require('../config/configs.js'),
            jwt = configs.jwt,
            database = require('../services/database.js'),
            dbConfig = configs.database;;
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if ((!!req.body.login) && (!!req.body.password)) {
          try {
            const context = {};
            if (dbConfig.dbtype==='mysql') {
               context.params=[req.body.login];
            }
            else {
              context.params={login:req.body.login};
            }
            context.sql=`SELECT USER_ID,
                                PASSWORD,
                                COALESCE(FIO,'null') FIO,
                                COALESCE(EMAIL,'null') EMAIL,
                                COALESCE(PHONE,'null') PHONE,
                                SOL
                           FROM REP_USERS
                          WHERE LOGIN=`;
            if (dbConfig.dbtype==='mssql') {
              context.sql+=`@login`;
            }
            else if (dbConfig.dbtype==='ora') {
               context.sql+=`:login`;
            }
            else if (dbConfig.dbtype==='mysql') {
               context.sql+=`?`;
            }
            const resquery = await query.find(context);
            let rows;
            if (dbConfig.dbtype==='mssql') {
              rows=resquery.recordsets[0];
            }
            else if (dbConfig.dbtype==='mysql') {
               rows=resquery[0];
            }
            else if (dbConfig.dbtype==='ora') {
               rows=resquery;
            }
            if (rows.length>0) {
              const bcrypt = require('bcrypt');
              bcrypt.hash(req.body.password, jwt.salts[rows[0]['SOL']],async function(err, hash) {
                  /*console.log('hash',hash);*/
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
