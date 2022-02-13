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
    //console.log(`Received message ${data} from user ${client}`);
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
          //console.log('dataP.type enter');
          const resObj={type:'dataUpdateRes'};
          if ((!!dataP.data)
                && (!!dataP.date)
                && (!!dataP.data.lims)
              ) {
            try {
              let context = {};
              const userCntlID=dataP.data.lims.sys['REP_USERS_CONTROL_ID'];
              const contextE={execsql:[]};
              //можно выполнить только одну операцию за раз, разбиваем на много запросов
              context.params=[userCntlID];
              context.sql=`SET @usr_ctrl_id_v=?;`;
              contextE.execsql.push(context);
              context={};
              context.params=[dataP.date];
              context.sql=`SET @date_v=STR_TO_DATE(?, '%d-%m-%Y');`;
              contextE.execsql.push(context);
              context={};
              context.params=[parseInt(dataP.data.data.timeAll/1000),(dataP.data.data.access)?1:0];
              context.sql=`INSERT INTO REP_USR_CNTRL_SYS_STATE
                                      (REP_USR_CNTRL_ID,TIME_ALL,DATE,ACCESS)
                                VALUES (@usr_ctrl_id_v,?,@date_v,?) AS new
                          ON DUPLICATE KEY UPDATE TIME_ALL=new.TIME_ALL,ACCESS=new.ACCESS;`;
              contextE.execsql.push(context);
              for (var key in dataP.data.data.winsActiveSum) {
                const prcClient=dataP.data.data.winsActiveSum[key];
                context={};
                context.params=[key,prcClient.pid,(prcClient.access)?1:0,prcClient.lastTimeProcess,prcClient.timeAll,parseInt(prcClient.timeAllDelta/1000),prcClient.timeAllUser];
                context.sql=`INSERT INTO REP_USR_CNTRL_PRC_STATE
                                        (REP_USR_CNTRL_ID,DATE,PRC_NAME,PID,ACCESS,LAST_TIME,TIME_ALL,TIME_ALL_DELTA,TIME_ALL_USR)
                                  VALUES (@usr_ctrl_id_v, @date_v,?,?,?,?,?,?,?) AS new
                            ON DUPLICATE KEY UPDATE PID=new.PID,ACCESS=new.ACCESS,LAST_TIME=new.LAST_TIME,TIME_ALL=new.TIME_ALL,TIME_ALL_DELTA=new.TIME_ALL_DELTA,TIME_ALL_USR=new.TIME_ALL_USR;`;
                contextE.execsql.push(context);
              }
              if (!!dataP.data.data.browser) {
                  for (var key in dataP.data.data.browser) {
                    const brwrOneHost=dataP.data.data.browser[key];
                    context={};
                    context.params=[key];
                    context.sql=`SET @host_v=?;`;
                    contextE.execsql.push(context);
                    context={};
                    context.params=[parseInt(brwrOneHost.timeAll/1000)];
                    context.sql=`INSERT INTO REP_USR_CNTRL_BROWSER
                                        (REP_USR_CNTRL_ID,DATE,HOST,TIME_ALL)
                                 VALUES (@usr_ctrl_id_v, @date_v,@host_v,?) AS new
                           ON DUPLICATE KEY UPDATE TIME_ALL=new.TIME_ALL;`;
                    contextE.execsql.push(context);
                    context={};
                    /*получаем AI чтобы использовать его далее, т.к. поведение LAST_INSERT_ID не подходит*/
                    context.sql=`SELECT MAX(COALESCE(B.ID,-1)) AI
                                   FROM REP_USR_CNTRL_BROWSER B
                                  WHERE B.REP_USR_CNTRL_ID=@usr_ctrl_id_v
                                    AND B.DATE=@date_v
                                    AND B.HOST=@host_v
                                   INTO @brwr_max_id;`;
                    contextE.execsql.push(context);
                    for (var i = 0; i < brwrOneHost.urls.length; i++) {
                      context={};
                      context.params=[brwrOneHost.urls[i]];
                      context.sql=`INSERT INTO REP_USR_CNTRL_BRWR_URLS
                                               (REP_USR_CNTRL_BRWR_ID,URL)
                                        VALUES (@brwr_max_id,?) AS new
                                            ON DUPLICATE KEY UPDATE URL=new.URL;`;
                      contextE.execsql.push(context);
                    }
                  }
              }
              await execquery.find(contextE);
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
