database:{
   pool: {
     user: process.env.ORA_USER || 'user_n',
      password: process.env.ORA_PASSWORD || '111111',
      connectString: process.env.ORA_DB || 'XEPDB1',
      poolMin: 10,
      poolMax: 10,
      poolIncrement: 0
   },
   dbtype:'ora'
 }
