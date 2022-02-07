/*01*/const query = require('../db_apis/query.js'),
            execquery = require('../db_apis/execquery.js'),
            configs=require('../config/configs.js'),
            jwt = configs.jwt,
            database = require('../services/database.js'),
            dbConfig = configs.database;;
/*02*/
/*03*/async function post(req, res, next) {
        //console.log('req.body',req.body);
        if ((!!req.body.repUserId)
              && (!!req.body.currentUser)
              && (!!req.body.data)
              && (!!req.body.date)
            ) {
          try {
            let context = {};
            context.params=[req.body.repUserId,req.body.currentUser];
            const data=req.body.data;
            //получаем ограничения пользователя
            context.sql=`SELECT L.TIME_ALL,
                                L.REP_USERS_CONTROL_ID
                           FROM REP_USR_CNTRL_SYS_LIM L
                           JOIN REP_USERS_CONTROL U
                             ON U.ID=L.REP_USERS_CONTROL_ID
                          WHERE U.REP_USERS_ID=?
                            AND U.LOGIN=?`;
            const contextE={execsql:[]};
            contextE.execsql.push(context);
            context={...context};
            context.sql=`SELECT L.PRC_NAME,
                                L.LIM
                          FROM REP_USR_CNTRL_PRC_LIM L
                          JOIN REP_USERS_CONTROL U
                            ON U.ID=L.REP_USR_CNTRL_ID
                         WHERE U.REP_USERS_ID=?
                           AND U.LOGIN=?`;
            contextE.execsql.push(context);
            const resquery = await execquery.find(contextE);
            //проверяем ограничения
            let rows=resquery[0][0];
            if (rows.length>0) {
              rows=rows[0];
              const timeAllClient=data.timeAll/1000;
              data.access=true;
              if (rows['TIME_ALL']>0) {
                if (rows['TIME_ALL']<timeAllClient) {
                  data.access=false;
                }
              }
              const userCntlID=rows['REP_USERS_CONTROL_ID'];
              rows=resquery[1][0];
              if (rows.length>0) {
                //console.log(data.winsActiveSum);
                for (var i = 0; i < rows.length; i++) {
                  const rowOne=rows[i];
                  if (!!data.winsActiveSum[rowOne['PRC_NAME']]) {
                    const timeAllDeltaClient=data.winsActiveSum[rowOne['PRC_NAME']].timeAllDelta/1000;
                    data.winsActiveSum[rowOne['PRC_NAME']].access=true;
                    if (rowOne['LIM']<timeAllDeltaClient) {
                        data.winsActiveSum[rowOne['PRC_NAME']].access=false;
                    }
                  }
                }
              }
              contextE.execsql=[];
              context={};
              context.params=[timeAllClient,req.body.date,(data.access)?1:0];
              context.sql=`INSERT INTO REP_USR_CNTRL_SYS_STATE
                                      (REP_USR_CNTRL_ID,TIME_ALL,DATE,ACCESS)
                                VALUES (`+userCntlID+`,?,STR_TO_DATE(?, '%d-%m-%Y'),?) AS new
                          ON DUPLICATE KEY UPDATE TIME_ALL=new.TIME_ALL,ACCESS=new.ACCESS;`;
              contextE.execsql.push(context);
              for (var key in data.winsActiveSum) {
                const prcClient=data.winsActiveSum[key];
                context={};
                context.params=[req.body.date,key,prcClient.pid,(prcClient.access)?1:0,prcClient.lastTimeProcess,prcClient.timeAll,parseInt(prcClient.timeAllDelta/1000),prcClient.timeAllUser];
                context.sql=`INSERT INTO REP_USR_CNTRL_PRC_STATE
                                        (REP_USR_CNTRL_ID,DATE,PRC_NAME,PID,ACCESS,LAST_TIME,TIME_ALL,TIME_ALL_DELTA,TIME_ALL_USR)
                                  VALUES (`+userCntlID+`, STR_TO_DATE(?, '%d-%m-%Y'),?,?,?,?,?,?,?) AS new
                            ON DUPLICATE KEY UPDATE PID=new.PID,ACCESS=new.ACCESS,LAST_TIME=new.LAST_TIME,TIME_ALL=new.TIME_ALL,TIME_ALL_DELTA=new.TIME_ALL_DELTA,TIME_ALL_USR=new.TIME_ALL_USR;`;
                contextE.execsql.push(context);
              }
              //не дожидаемся завершения
              execquery.find(contextE);

            }
            //console.log(resquery[0][0],resquery[1][0]);
            return res.status(200).json({ data: data })
            //let rows=resquery.recordsets[0];
          } catch (err) {
            next(err);
          }
        }
        else {
            return res.status(200).json({ message: 'Data error' });
        }

}

module.exports.post = post;
