const WebSocket = require('ws'),
      wss= new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(wsf, request, client) {
  console.log('Новый пользователь');
  wsf.send('Привет');
  wsf.on('message', function message(data) {
    console.log(`Received message ${data} from user ${client}`);
  });
  wsf.on('close', function() {
    // отправка уведомления в консоль
    console.log('Пользователь отключился');
  });
});

module.exports=wss;
