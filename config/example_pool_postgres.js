database:{
   pool: {
      host: process.env.PG_HOST || '127.0.0.1',
      port: +process.env.PG_PORT || 5432,
      user: process.env.PG_USER || 'user',
      password: process.env.PG_PWD || '111111',
      database: process.env.PG_DB || 'react',    
      max: 20,
      idleTimeoutMillis: 3600000,
      connectionTimeoutMillis: 10000,
   },
   dbtype:'pg'
 }
