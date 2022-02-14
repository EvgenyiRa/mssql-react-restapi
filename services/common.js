const configs=require('../config/configs.js'),
      redis=require('./redis.js'),
      { promisify } = require("util"),
      getAsync = promisify(redis.client.get).bind(redis.client);

module.exports.getAsync=getAsync;      

const checkErr=async (ipMac,getMsgErrLog,textNoMaxCountErr)=>{
  let resultErrNum;
  const verify = configs.verify,
  resultErr=await getAsync('err_'+ipMac);
  //test
  //console.log('resultErr',resultErr);
  resultErrNum=parseInt(resultErr);
  if (!isNaN(resultErrNum)) {
    ++resultErrNum;
  }
  else {
    resultErrNum=1;
  }
  //test
  //console.log('resultErrNum',resultErrNum);
  if (resultErrNum>=verify.maxCountErrAuth) {
    redis.client.del('err_'+ipMac);
    redis.client.set('errblock_'+ipMac,'block');
    redis.client.expire('errblock_'+ipMac, verify.countSecondBlock);//установка времени действия кэша
    console.log('User set block for');
    console.log(getMsgErrLog);
    return 'User block for '+verify.countSecondBlock+' seconds';
  }
  else {
    redis.client.set('err_'+ipMac,resultErrNum);
    redis.client.expire('err_'+ipMac, verify.countSecondBlock);//установка времени действия кэша
    console.log(textNoMaxCountErr+' for');
    console.log(getMsgErrLog);
    return textNoMaxCountErr;
  }
}
module.exports.checkErr = checkErr;

const getIP=(req)=>{
  let ip = req.ip; // trust proxy sets ip to the remote client (not to the ip of the last reverse proxy server)
  if (ip.substr(0,7) == '::ffff:') { // fix for if you have both ipv4 and ipv6
    ip = ip.substr(7);
  }
  return ip;
}
module.exports.getIP=getIP;
