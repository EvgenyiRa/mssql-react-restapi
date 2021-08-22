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
}
