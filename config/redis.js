module.exports = {
  port: process.env.MSSQL_REACT_RESTAPI_REDISPORT || 6379,
  host: process.env.MSSQL_REACT_RESTAPI_REDISHOST || '127.0.0.1'
};
