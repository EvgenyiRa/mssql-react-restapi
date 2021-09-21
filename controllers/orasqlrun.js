/*01*/const query = require('../db_apis/query.js'),
            configs=require('../config/configs.js'),
            authcheck=require('../services/authcheck.js');

/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if (!!req.body.authorization) {
          const [resAuath,tokenOne,user]=await authcheck(req);
          if (resAuath) {
            try {
              const context = {};
              if (!!req.body.params) {
                  context.params=req.body.params;
              }
              else {
                  context.params={};
              }
              if (!!req.body.sql) {
                context.sql=req.body.sql;
                const rows = await query.find(context);
                res.status(200).json({rows:rows,tokenOne:tokenOne});
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
        }
        else {
          res.status(200).json({ message: 'User not authorized' })
        }

}

module.exports.post = post;
