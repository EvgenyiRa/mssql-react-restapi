module.exports = {
  webServer:{
    port: process.env.WEBOLAP_RESTAPI_HTTP_PORT || 3777,
    host: process.env.WEBOLAP_RESTAPI_IP || '192.168.1.57',
    https:false,
    /*trust_proxy:'ip'*/
 },
 database:{
   pool: {
      connectionLimit : 10,
      host     : process.env.MYSQL_HOST || '127.0.0.1',
      user     : process.env.MYSQL_USER || 'user',
      password : process.env.MYSQL_PWD || '111111',
      database : process.env.MYSQL_DB || 'react',
      debug    :  false
   },
   dbtype:'mysql'
 },
 jwt:{
   tokenKey : '7a9b-5c7d-5e7f-7g9h',
   host: process.env.WEBOLAP_RESTAPI_FRONTEND_PATH || "http://localhost:3000",
   expiresIn:'8h',
   redisExpire:28800,//8часов
   salts:['$2a$10$eSl3zD7nD7diakkyP.oRNg$',
          '$2a$10$A.6oNVSpds0uiBe9PwjgBs$',
          '$2a$10$Ho/U/KN8Rg75Bjj8Zf2Z.w$',
          '$2a$10$u37ZiYRTq37uP2UUmQrwDg$',
          '$2a$10$r88PMCG7VUnmy8czYSg0nH$'
        ],
   tokenQueueCount:8,
 },
 verify:{
   maxCountErrAuth:3,
   countSecondBlock:10
 },
 redis:{
   port: process.env.WEBOLAP_RESTAPI_REDISPORT || 6379,
   host: process.env.WEBOLAP_RESTAPI_REDISHOST || 'localhost'
 }

};
