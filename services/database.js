const configs=require('../config/configs.js'),
      dbConfig = configs.database;

let sql,poolPromise,oracledb;

if (dbConfig.dbtype==='mssql') {
    sql = require('mssql');
    poolPromise = new sql.ConnectionPool(dbConfig.pool)
      .connect()
      .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
      })
      .catch(err => console.log('MSSQL Connection Failed! Bad Config: ', err))
    module.exports.poolPromise=poolPromise;
}
else if (dbConfig.dbtype==='mysql') {
    sql = require('mysql2/promise');
    try {
      poolPromise = sql.createPool(dbConfig.pool);
      /*const test=async ()=>{
        const result=await poolPromise.execute('select * from REP_USERS',[]);
        //update new_table set new_tablecol=555 where idnew_table=1
        console.log(result);
      }
      test();*/
      module.exports.poolPromise=poolPromise;
      console.log('Connected to MYSQL');
    } catch (err) {
      console.log('MYSQL Connection Failed! Bad Config: ', err)
    }
}
else if (dbConfig.dbtype==='ora') {
    oracledb=require('oracledb');
}
else if (dbConfig.dbtype==='pg') {
    const { Pool } = require('pg');
    try {
      poolPromise=new Pool(dbConfig.pool);
      poolPromise.connect()
        .then(client => {
          console.log('Connected to PostgreSQL');
          client.release();
        })
        .catch(err => {
          console.log('PostgreSQL connection Failed! Bad Config: ', err)
        })
      module.exports.poolPromise=poolPromise;

    } catch (err) {
      console.log('PostgreSQL connection Failed! Bad Config: ', err)
    }
}

async function close() {
  const pool = await poolPromise;
  pool.close();
}

async function oraClose() {
  await oracledb.getPool().close();
}

async function mysqlClose() {
  //для mysql не требуется закрывать пул соединения, фунция
  //создана для единообразия кода
  console.log('mysql pool close');
}

async function pgClose() {
  poolPromise.end(() => {
    console.log('pool Postgres has ended')
  })
}

if (dbConfig.dbtype==='mssql') {
  module.exports.close = close;
}
else if (dbConfig.dbtype==='ora') {
  module.exports.close = oraClose;
}
else if (dbConfig.dbtype==='mysql') {
  module.exports.close = mysqlClose;
}
else if (dbConfig.dbtype==='pg') {
  module.exports.close = pgClose;
}

function getParamsOut(result,params_out) {
  if (Array.isArray(params_out)) {
    params_out.forEach((el) => {
        if (['varchar','nvarchar','char','nchar'].indexOf(el.type)>-1) {
          let type;
          if (el.type==='varchar') {
              if (!!el.length) {
                type=sql.VarChar(el.length);
              }
              else {
                type=sql.VarChar;
              }
          }
          else if (el.type==='nvarchar') {
              if (!!el.length) {
                type=sql.NVarChar(el.length);
              }
              else {
                type=sql.NVarChar;
              }
          }
          else if (el.type==='char') {
              if (!!el.length) {
                type=sql.Char(el.length);
              }
              else {
                type=sql.Char;
              }
          }
          else if (el.type==='nchar') {
              if (!!el.length) {
                type=sql.NChar(el.length);
              }
              else {
                type=sql.NChar;
              }
          }
          result.output(el.name, type,((!!el.value)?el.value:null));
        }
        else if (el.type==='bigint') {
          result.output(el.name, sql.BigInt,((!!el.value)?el.value:null));
        }
        else if (el.type==='int') {
          result.output(el.name, sql.Int,((!!el.value)?el.value:null));
        }
        else if (el.type==='float') {
          result.output(el.name, sql.Float,((!!el.value)?el.value:null));
        }
        if (['numeric','decimal'].indexOf(el.type)>-1) {
          let type;
          if ((!!el.precision) & (!!!el.scale)) {
              if (el.type==='numeric') {
                sql.Numeric(el.precision);
              }
              else if (el.type==='decimal') {
                sql.Decimal(el.precision);
              }
          }
          else if ((!!el.precision) & (!!el.scale)) {
            if (el.type==='numeric') {
              sql.Numeric(el.precision,el.scale);
            }
            else if (el.type==='decimal') {
              sql.Decimal(el.precision,el.scale);
            }
          }
          else {
            if (el.type==='numeric') {
              sql.Numeric;
            }
            else if (el.type==='decimal') {
              sql.Decimal;
            }
          }
          result.output(el.name, type,((!!el.value)?el.value:null));
        }
    })
  }
  return result;
}

function simpleExecute(context) {
  if (dbConfig.dbtype==='mssql') {
    return new Promise(async (resolve, reject) => {
      let statement=context.sql,
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
        result=getParamsOut(result,context.params_out);
        result=await result.query(statement);
        //resolve(result.recordset);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
  else if (dbConfig.dbtype==='mysql') {
    return new Promise(async (resolve, reject) => {
      let statement=context.sql,
          binds = [];
      if (!!context.params) {
          binds=context.params;
      }
      try {
        const result = await poolPromise.execute(statement,binds);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
  else if (dbConfig.dbtype==='ora') {
    return new Promise(async (resolve, reject) => {
      let conn,
          statement=context.sql,
          binds = {},
          opts = {};
      if (!!context.opts) {
          opts=context.opts;
      }
      opts.outFormat = oracledb.OUT_FORMAT_OBJECT;
      opts.autoCommit = true;
      if (!!context.params) {
          binds=context.params;
      }
      try {
        conn = await oracledb.getConnection();
        const result = await conn.execute(statement, binds, opts);
        resolve(result.rows);
      } catch (err) {
        reject(err);
      } finally {
        if (conn) { // conn assignment worked, need to close
          try {
            await conn.close();
          } catch (err) {
            console.log(err);
          }
        }
      }
    });
  }
  else if (dbConfig.dbtype==='pg') {
    return new Promise(async (resolve, reject) => {
      let statement=context.sql,
          binds = [];
      if (!!context.params) {
          binds=context.params;
      }
      try {
        const result = await poolPromise.query(statement,binds);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports.simpleExecute = simpleExecute;

function doubleExecute(context) {
  if (dbConfig.dbtype==='mssql') {
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
          resultsql=getParamsOut(resultsql,context.query_params_out);
          resultsql=await resultsql.query(context.sql);
          result.sqlout=resultsql;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      }
    });
  }
  else if (dbConfig.dbtype==='mysql') {
    return new Promise(async (resolve, reject) => {
      let statement=context.execsql,
          binds = [];
      try {
        const conn=await poolPromise.getConnection();
         try  {
            const result=[];
            for (var i = 0; i < statement.length; i++) {
              binds = [];
              const item=statement[i];
              if (!!item.params) {
                  binds=item.params;
              }
              const resultOne=await conn.execute(item.sql,binds);
              result.push(resultOne);
            }
            conn.release();
            resolve(result);
         } catch (err) {
           conn.release();
           reject(err);
         }
       //});
      } catch (err) {
        reject(err);
      }
    });
  }
  else if (dbConfig.dbtype==='ora') {
    return new Promise(async (resolve, reject) => {
      let conn;
      if (!!!context.opts) {
        context.opts={};
        context.opts.outFormat = oracledb.OUT_FORMAT_OBJECT;
        context.opts.autoCommit = true;
      }
      let execbinds = Object.assign({}, context.exec_params_in);
      if (!!context.exec_params_out) {
        context.exec_params_out.forEach(function(item) {
            execbinds[item.name]= {
                              dir: oracledb.BIND_OUT
                            };
            if (item.type=='number') {
                execbinds[item.name]['type']=oracledb.NUMBER;
            }
            else if (item.type=='string') {
                execbinds[item.name]['type']=oracledb.STRING;
            }
            else if (item.type=='blob') {
                execbinds[item.name]['type']=oracledb.BLOB;
            }
            else if (item.type=='buffer') {
                execbinds[item.name]['type']=oracledb.BUFFER;
            }
            else if (item.type=='clob') {
                execbinds[item.name]['type']=oracledb.CLOB;
            }
            else if (item.type=='cursor') {
                execbinds[item.name]['type']=oracledb.CURSOR;
            }
            else if (item.type=='date') {
                execbinds[item.name]['type']=oracledb.DATE;
            }
            else if (item.type=='default') {
                execbinds[item.name]['type']=oracledb.DEFAULT;
            }
            else if (item.type=='nclob') {
                execbinds[item.name]['type']=oracledb.NCLOB;
            }
            else {
               execbinds[item.name]['type']=oracledb.STRING;
            }
        });
      }


      try {
        conn = await oracledb.getConnection();
        let result={};
        //console.log('execbinds',execbinds);
        const execresult = await conn.execute(context.execsql, execbinds, context.opts);
        if (!!context.exec_params_out) {
            result.execout=execresult.outBinds;
        }
        else {
            result.execout='ok';
        }
        if (!!context.sql) {
          const queryresult = await conn.execute(context.sql, context.query_params, context.opts);
          result.sqlrows=queryresult.rows;
        }
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        if (conn) { // conn assignment worked, need to close
          try {
            await conn.close();
          } catch (err) {
            console.log(err);
          }
        }
      }
    });
  }
  else if (dbConfig.dbtype==='pg') {
    return new Promise(async (resolve, reject) => {
      let statement=context.execsql,
          binds = [];
      try {
        const conn=await poolPromise.connect();
         try  {
            const result=[];
            for (var i = 0; i < statement.length; i++) {
              binds = [];
              const item=statement[i];
              if (!!item.params) {
                  binds=item.params;
              }
              const resultOne=await conn.query(item.sql,binds);
              result.push(resultOne);
            }
            conn.release();
            resolve(result);
         } catch (err) {
           conn.release();
           reject(err);
         }
       //});
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports.doubleExecute = doubleExecute;

async function oraInitialize() {
  try {
    await oracledb.createPool(dbConfig.pool);
    oracledb.fetchAsString = [ oracledb.CLOB ];
  } catch (err) {
    console.log('Error create pool',err);
  }
}

module.exports.oraInitialize = oraInitialize;

async function authUser(req,rows,context) {
  const jwt = configs.jwt,
        jwtlib = require('jsonwebtoken'),
        redis=require('../services/redis.js'),
        query = require('../db_apis/query.js'),
        crypto = require('crypto');
  //на всякий случай удаляем значения для пользователя если они есть
  redis.client.del('user_'+rows[0]['USER_ID']);
  redis.client.del('userToken_'+rows[0]['USER_ID']);
  redis.client.del('userRigths_'+rows[0]['USER_ID']);
  const user_obj_jwt={ id: rows[0]['USER_ID'], host:req.headers.origin};
  if (dbConfig.dbtype==='mysql') {
      user_obj_jwt.login=context.params[0];
      context.params=[rows[0]['USER_ID']];
  }
  else {
      user_obj_jwt.login=context.params.login;
      context.params={user_id:rows[0]['USER_ID']};
  }
  const user_obj={...user_obj_jwt};
  user_obj.fio=rows[0]['FIO'];
  user_obj.email=rows[0]['EMAIL'];
  user_obj.phone=rows[0]['PHONE'];
  //получаем права пользователя
   context.sql=`SELECT UR.RIGHT_ID,R.NAME RIGHT_NAME,R.SYSNAME RIGHT_SYSNAME
                 FROM REP_USERS U
                 JOIN REP_USERS_RIGHTS UR
                   ON UR.USER_ID=U.USER_ID
                 JOIN REP_RIGHTS R
                   ON R.RIGHTS_ID=UR.RIGHT_ID
                WHERE U.USER_ID=`;
   if (dbConfig.dbtype==='mssql') {
     context.sql+=`@user_id`;
   }
   else if (dbConfig.dbtype==='mysql') {
      context.sql+=`?`;
   }
   else if (dbConfig.dbtype==='ora') {
      context.sql+=`:user_id`;
   }
   const resquery = await query.find(context);
   let rowsR;
   if (dbConfig.dbtype==='mssql') {
     rowsR=resquery.recordsets[0];
   }
   else if (dbConfig.dbtype==='mysql') {
      rowsR=resquery[0];
   }
   else if (dbConfig.dbtype==='ora') {
      rowsR=resquery;
   }
   if (rowsR.length>0) {
     redis.client.set('userRigths_'+rows[0]['USER_ID'], JSON.stringify(rowsR));
     redis.client.expire('userRigths_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
     user_obj.rights=1;
   }
   else {
     user_obj.rights=0;
   }
  //console.log('user_obj',user_obj);
  redis.client.hmset('user_'+rows[0]['USER_ID'], user_obj);
  redis.client.expire('user_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
  var tokenOne = crypto.randomBytes(64).toString('hex'); //X-CSRF-Token
  redis.client.rpush(['userToken_'+rows[0]['USER_ID'], tokenOne]);
  redis.client.expire('userToken_'+rows[0]['USER_ID'], jwt.redisExpire);//установка времени действия кэша
  return {
    token: jwtlib.sign(user_obj_jwt, jwt.tokenKey,{ expiresIn: jwt.expiresIn }),
    tokenOne:tokenOne
  };
}

module.exports.authUser = authUser;
