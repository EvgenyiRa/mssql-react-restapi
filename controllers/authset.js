/*01*/const query = require('../db_apis/query.js'),
            configs=require('../config/configs.js'),
            jwt = configs.jwt,
            database = require('../services/database.js'),
            common=require('../services/common.js'),
            dbConfig = configs.database;;
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if ((!!req.body.login) && (!!req.body.password)) {
          try {
            const context = {};
            if (['mysql','pg'].indexOf(dbConfig.dbtype)>-1) {
               context.params=[req.body.login];
            }
            else {
              context.params={login:req.body.login};
            }
            if (dbConfig.dbtype!=='pg') {
              context.sql=`SELECT USER_ID,
                                  PASSWORD,
                                  COALESCE(FIO,'null') FIO,
                                  COALESCE(EMAIL,'null') EMAIL,
                                  COALESCE(PHONE,'null') PHONE,
                                  SOL`;
            }
            else {
              //для PostgreSQL принудительно устанавливаем верхний регистр наименования полей
              //для унификации авторизации
              context.sql=`SELECT USER_ID "USER_ID",
                                  PASSWORD "PASSWORD",
                                  COALESCE(FIO,'null') "FIO",
                                  COALESCE(EMAIL,'null') "EMAIL",
                                  COALESCE(PHONE,'null') "PHONE",
                                  SOL "SOL"`;
            }
            context.sql+=`   FROM REP_USERS
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
            else if (dbConfig.dbtype==='pg') {
               context.sql+=`$1`;
            }
            const resquery = await query.find(context);
            //console.log(resquery);
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
            else if (dbConfig.dbtype==='pg') {
               rows=resquery.rows;
            }
            const textAuthErr='Auth user error: ip-'+req.ip+'; login-'+req.body.login+'; pwd-'+req.body.password;
            if (rows.length>0) {
              const bcrypt = require('bcrypt');
              bcrypt.hash(req.body.password, jwt.salts[rows[0]['SOL']],async function(err, hash) {
                  /*console.log('hash',hash);*/
                  if (rows[0]['PASSWORD']==hash) {
                    const resAuthUser=await database.authUser(req,rows,context);
                    return res.status(200).json(resAuthUser);
                  }
                  else {
                      const resMsg='PWD error';
                      await common.checkErr(req.ip,resMsg,textAuthErr);
                      return res.status(200).json({ message: resMsg});
                  }
              });
            }
            else {
                const resMsg='User not found';
                await common.checkErr(req.ip,resMsg,textAuthErr);
                return res.status(200).json({ message:  resMsg})
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
