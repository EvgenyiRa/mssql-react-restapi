const sql = require('mssql'),
      dbConfig = require('../config/database.js');

const poolPromise = new sql.ConnectionPool(dbConfig.hrPool)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL')
    return pool
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err))

module.exports.poolPromise=poolPromise;

async function close() {
  const pool = await poolPromise;
  pool.close();
}

module.exports.close = close;

function simpleExecute(context) {
  return new Promise(async (resolve, reject) => {
    let conn,
        statement=context.sql,
        binds = {};
    if (!!context.params) {
        binds=context.params;
    }
    try {
      const pool = await poolPromise;
      let result = pool.request();
      for (var prop in binds) {
        result.input(prop,binds[prop]);
      }
      result=await result.query(statement);
      resolve(result.recordset);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports.simpleExecute = simpleExecute;

function doubleExecute(context) {
  return new Promise(async (resolve, reject) => {
    try {
      const pool = await poolPromise;

      let execresult = pool.request();
      let result={};
      result.execout=await execresult.batch(context.execsql);
      if (!!context.sql) {
        let resultsql = pool.request();
        if (!!context.query_params) {
          for (var prop in context.query_params) {
            resultsql.input(prop,context.query_params[prop]);
          }
        }
        resultsql=await resultsql.query(context.sql);
        result.sqlrows=result.recordset;
      }
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
}

module.exports.doubleExecute = doubleExecute;

async function authUser(req,rows,context) {
  const jwt = require('../config/jwt'),
        jwtlib = require('jsonwebtoken'),
        redis=require('../services/redis.js'),
        query = require('../db_apis/query.js'),
        crypto = require('crypto');
  //на всякий случай удаляем значения для пользователя если они есть
  redis.client.del('user_'+context.city+'_'+rows[0]['USER_ID']);
  redis.client.del('userToken_'+context.city+'_'+rows[0]['USER_ID']);
  redis.client.del('userRigths_'+context.city+'_'+rows[0]['USER_ID']);
  const user_obj_jwt={ id: rows[0]['USER_ID'], host:req.headers.origin,login:context.params.login, city:context.city},
        user_obj={...user_obj_jwt};
  user_obj.fio=rows[0]['FIO'];
  user_obj.email=rows[0]['EMAIL'];
  user_obj.phone=rows[0]['PHONE'];
  //получаем права пользователя
   context.params={user_id:rows[0]['USER_ID']};
   context.sql=`SELECT UR.RIGHT_ID,R.NAME RIGHT_NAME,R.SYSNAME RIGHT_SYSNAME
                 FROM REP_USERS U
                 JOIN REP_USERS_RIGHTS UR
                   ON UR.USER_ID=U.USER_ID
                 JOIN REP_RIGHTS R
                   ON R.RIGHTS_ID=UR.RIGHT_ID
                WHERE U.USER_ID=@user_id`;
   const rowsR = await query.find(context);
   if (rowsR.length>0) {
     redis.client.set('userRigths_'+context.city+'_'+rows[0]['USER_ID'], JSON.stringify(rowsR));
     redis.client.expire('userRigths_'+context.city+'_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
     user_obj.rights=1;
   }
   else {
     user_obj.rights=0;
   }
  //console.log('user_obj',user_obj);
  redis.client.hmset('user_'+context.city+'_'+rows[0]['USER_ID'], user_obj);
  redis.client.expire('user_'+context.city+'_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
  var tokenOne = crypto.randomBytes(64).toString('hex'); //X-CSRF-Token
  redis.client.rpush(['userToken_'+context.city+'_'+rows[0]['USER_ID'], tokenOne]);
  redis.client.expire('userToken_'+context.city+'_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
  return {
    token: jwtlib.sign(user_obj_jwt, jwt.tokenKey,{ expiresIn: jwt.expiresIn }),
    tokenOne:tokenOne
  };
}

module.exports.authUser = authUser;
