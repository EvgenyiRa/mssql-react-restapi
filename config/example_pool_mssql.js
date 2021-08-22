database:{
  pool: {
    user: process.env.MSSQL_USER || 'user',
    password: process.env.MSSQL_PWD || 'pwd',
    server: process.env.MSSQL_SERVER || 'localhost',
    port: +process.env.MSSQL_PORT || 1433,
    database: process.env.MSSQL_DB || 'database',
    pool: {
        max: 10,
        min: 10,
        idleTimeoutMillis: 14400000 /*4hours*/
    },
    options: {
      encrypt: false
    }
  },
  dbtype:'mssql'
}
