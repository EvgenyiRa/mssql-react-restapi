const execquery = require('../db_apis/execquery.js'),
      configs=require('../config/configs.js'),
      jwt = configs.jwt;

async function post(req, res, next) {
  if (!!req.body.authorization) {
    jwt.verify(req,jwt,async function(resAuath,tokenOne,user) {
      if (resAuath) {
        try {
          const context = {};
          if (!!req.body.exec_params_in) {
              context.exec_params_in=req.body.exec_params_in;
          }
          else {
              context.exec_params_in=[];
          }
          if (!!req.body.query_params) {
              context.query_params=req.body.query_params;
          }
          else {
              context.query_params=[];
          }
          if (!!req.body.execsql) {
            context.execsql=req.body.execsql;
            if (!!req.body.sql) {
              context.sql=req.body.sql;
            }
            const resexecquery = await execquery.find(context);
            res.status(200).json({result:resexecquery,tokenOne:tokenOne});
          }
          else {
              res.status(404).end();
          }
        } catch (err) {
          next(err);
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
