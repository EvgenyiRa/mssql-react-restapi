const webServerConfig = require('../config/web-server.js');
let https;
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
const router = require('./router.js');
const routerPost = require('./routerPost.js');
const routerAuth = require('./routerAuth.js');
const routerOLAP = require('./routerOLAP.js');
const redis=require('./redis.js');

const bodyParser = require('body-parser'),
      jwt = require('../config/jwt');

let httpsServer;

redis.client.on('connect', function() {
    console.log('redis connected');
});


function initialize() {
  return new Promise((resolve, reject) => {
    const app = express();

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
    }

    app.all('*', function(req, res, next) {
          let origin = req.headers.origin;
          if(jwt.host.indexOf(origin) >= 0){
              res.header("Access-Control-Allow-Origin", origin);
          }
          res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
          next();
    });

    app.use(bodyParser.json({limit: '100mb', extended: true}));
    app.use('/get', router);
    app.use('/ora', routerPost);
    app.use('/auth', routerAuth);
    app.use('/olap', routerOLAP);

    httpsServer.listen(webServerConfig.port,webServerConfig.host)
      .on('listening', () => {
        console.log(`Web server listening on ${webServerConfig.host}:${webServerConfig.port}`);

        resolve();
      })
      .on('error', err => {
        reject(err);
      })
      .setTimeout(700000);
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
