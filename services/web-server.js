const configs=require('../config/configs.js'),
      common=require('./common.js'),
      wss=require('./webSocket.js'),
      lurl=require('url');
      //WebSocket = require('ws'),
      webServerConfig = configs.webServer,
      dbConfig = configs.database;
let https,
    httpWs;
if (webServerConfig.https) {
    https = require('https');
}
else {
    https = require('http');
}
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const routerAuth = require('./routerAuth.js');
const routerOLAP = require('./routerOLAP.js');
const routerFClient = require('./routerFClient.js');
const redis=require('./redis.js');

let routerDB;
if (dbConfig.dbtype==='mssql') {
    routerDB = require('./routerMSSQL.js');
}
else if (dbConfig.dbtype==='mysql') {
    routerDB = require('./routerMYSQL.js');
}
else if (dbConfig.dbtype==='ora') {
    routerDB = require('./routerOra.js');
}
else if (dbConfig.dbtype==='pg') {
    routerDB = require('./routerPG.js');
}

const bodyParser = require('body-parser'),
      jwt=configs.jwt;

let httpsServer;

redis.client.on('connect', function() {
    console.log('redis connected');
});


function initialize() {
  return new Promise((resolve, reject) => {
    const app = express()/*,
          appWs = express()*/;

    if (webServerConfig.https) {
      const serverKey=path.resolve('cert', 'server.key');
      const serverCert=path.resolve('cert', 'server.cert');
      const pathCert='/cert/server.key';
      httpsServer =https.createServer({
        key: fs.readFileSync(path.normalize(serverKey)),
        cert: fs.readFileSync(path.normalize(serverCert))
      }, app);
    }
    else {
        httpsServer = https.createServer(app);
        //httpWsServer = httpWs.createServer(appWs);
    }

    if (!!webServerConfig.trust_proxy) {
      app.set('trust proxy', webServerConfig.trust_proxy);
    }

    app.all('*',async function(req, res, next) {
        const origin = req.headers.origin,
              ip=common.getIP(req);
        let isOk=false;
        req.ip=ip;
        const resErrblock=await common.getAsync('errblock_'+ip);
        //проверяем ip на нахождение в блокировке
        if (resErrblock!==null) {
            console.log('Заблокированный пользователь '+ip+' пытается войти');
        }
        else {
          if(jwt.host.indexOf(origin) >= 0){
              res.header("Access-Control-Allow-Origin", origin);
              res.header("Access-Control-Allow-Methods", "*");
              res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
              isOk=true;
              next();
          }
          else {
            //console.log(req);
            if ((req.originalUrl.split('/')[1]==='f-client') & (req.method==='POST')) {
              isOk=true;
              next();
            }
          }
        }
        if (!isOk) {
          res.status(404).end();
        }
    });

    app.use(bodyParser.json({limit: '100mb', extended: true}));
    app.use('/'+dbConfig.dbtype, routerDB);
    app.use('/auth', routerAuth);
    app.use('/olap', routerOLAP);
    app.use('/f-client', routerFClient);

    httpsServer.listen(webServerConfig.port,webServerConfig.host)
      .on('listening', () => {
        console.log(`Web server listening on ${webServerConfig.host}:${webServerConfig.port}`);

        //test
        /*const crypto = require('crypto'),
              key=crypto.randomBytes(32).toString('hex');
        console.log('Key ',key,' length='+key.length);*/

        resolve();
      })
      .on('error', err => {
        reject(err);
      })
      .setTimeout(700000);

    //const wss= new WebSocket.Server({ noServer: true });

    httpsServer.on('upgrade', async function upgrade(request, socket, head) {
      const { pathname } = lurl.parse(request.url);
      if (pathname === '/ws') {
        try {
          let ip;
          if (!!configs.trust_proxy) {
            ip=request.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
          }
          else {
            ip = request.connection.remoteAddress;
          }
          const resErrblock=await common.getAsync('errblock_'+ip);
          //проверяем ip на нахождение в блокировке
          if (resErrblock!==null) {
              socket.destroy();
              console.log('Заблокированный пользователь '+ip+' пытается войти');
          }
          else {
            console.log('Новый пользователь '+ip);
            request.ip=ip;
            wss.handleUpgrade(request, socket, head, function done(ws) {
              wss.emit('connection', ws, request, socket);
            });
          }
        } catch (err) {
          console.error(err);
          socket.destroy();
        }
      } else {
        socket.destroy();
      }
    });

  });
}

module.exports.initialize = initialize;

function close() {
  return new Promise((resolve, reject) => {
    httpsServer.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

module.exports.close = close;
