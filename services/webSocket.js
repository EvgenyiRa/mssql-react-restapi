const WebSocket = require('ws'),
      wss= new WebSocket.Server({ noServer: true }),
      execquery = require('../db_apis/execquery.js'),
      database = require('./database.js');

wss.on('connection', async (wsf, request, client)=> {
  console.log('Новый пользователь');
  let auth=false;
  const messDefault=JSON.stringify({type:'auth',data:"who is?"});
  wsf.send(messDefault);
  wsf.on('message', async (data)=> {
    console.log(`Received message ${data} from user ${client}`);
    try {
      const dataP=JSON.parse(data);
      if (!auth) {
        if (dataP.type==='auth') {
            const result=await database.authWSC(dataP);
            auth=result.auth;
            wsf.send(JSON.stringify({type:'authRes',data:result}));
        }
        else {
            wsf.send(messDefault);
        }
      }
      else {
        if (dataP.type==='dataUpdate') {
          const resObj={type:'dataUpdateRes'};
          if ((!!dataP.data.repUserId)
                && (!!dataP.data.login)
                && (!!dataP.data.data)
                && (!!dataP.data.date)
                && (!!dataP.data.lims)
              ) {
            try {
              let context = {};
              const userCntlID=dataP.data.lims.sys['REP_USERS_CONTROL_ID'];
              const contextE={execsql:[]};
              context.params=[parseInt(dataP.data.datatimeAll/1000),dataP.data.date,(dataP.data.dataaccess)?1:0];
              context.sql=`INSERT INTO REP_USR_CNTRL_SYS_STATE
                                      (REP_USR_CNTRL_ID,TIME_ALL,DATE,ACCESS)
                                VALUES (`+userCntlID+`,?,STR_TO_DATE(?, '%d-%m-%Y'),?) AS new
                          ON DUPLICATE KEY UPDATE TIME_ALL=new.TIME_ALL,ACCESS=new.ACCESS;`;
              contextE.execsql.push(context);
              for (var key in dataP.data.datawinsActiveSum) {
                const prcClient=dataP.data.datawinsActiveSum[key];
                context={};
                context.params=[dataP.data.date,key,prcClient.pid,(prcClient.access)?1:0,prcClient.lastTimeProcess,prcClient.timeAll,parseInt(prcClient.timeAllDelta/1000),prcClient.timeAllUser];
                context.sql=`INSERT INTO REP_USR_CNTRL_PRC_STATE
                                        (REP_USR_CNTRL_ID,DATE,PRC_NAME,PID,ACCESS,LAST_TIME,TIME_ALL,TIME_ALL_DELTA,TIME_ALL_USR)
                                  VALUES (`+userCntlID+`, STR_TO_DATE(?, '%d-%m-%Y'),?,?,?,?,?,?,?) AS new
                            ON DUPLICATE KEY UPDATE PID=new.PID,ACCESS=new.ACCESS,LAST_TIME=new.LAST_TIME,TIME_ALL=new.TIME_ALL,TIME_ALL_DELTA=new.TIME_ALL_DELTA,TIME_ALL_USR=new.TIME_ALL_USR;`;
                contextE.execsql.push(context);
              }
              //не дожидаемся завершения
              execquery.find(contextE);
              resObj.message='ok';
            } catch (err) {
              console.log(err);
              resObj.message='err';
            }
            finally {
                wsf.send(JSON.stringify(resObj));
            }
          }
          else {
            resObj.message='Data error';
            wsf.send(JSON.stringify(resObj));
          }
        }
      }
    } catch (err) {
      console.log('wsCliient err msg: ', err);
      auth=false;
    }
  });
  wsf.on('close', function() {
    // отправка уведомления в консоль
    auth=false;
    console.log('Пользователь отключился');
  });
});

module.exports=wss;
