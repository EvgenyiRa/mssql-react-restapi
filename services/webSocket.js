const WebSocket = require('ws'),
      wss= new WebSocket.Server({ noServer: true }),
      database = require('./database.js');

wss.on('connection', function connection(wsf, request, client) {
  console.log('Новый пользователь');
  let auth=false;
  wsf.send(JSON.stringify({type:'auth',data:"who is?"}));
  wsf.on('message', async (data)=> {
    console.log(`Received message ${data} from user ${client}`);
    try {
      const dataP=JSON.parse(data);
      if (dataP.type==='auth') {
          const result=await database.authWSC(dataP);
          auth=result.auth;
          wsf.send(JSON.stringify({type:'authRes',data:result}));
      }
    } catch (err) {
      console.log('wsCliient err msg: ', err);
    }
  });
  wsf.on('close', function() {
    // отправка уведомления в консоль
    auth=false;
    console.log('Пользователь отключился');
  });
});

module.exports=wss;
