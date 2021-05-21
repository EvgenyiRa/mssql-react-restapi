module.exports = {
  port: process.env.HTTP_PORT || 3777,
  host: process.env.HTTP_BIND_IP || '127.0.0.1',
  https:false
};
