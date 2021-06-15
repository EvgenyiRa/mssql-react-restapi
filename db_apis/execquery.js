const database = require('../services/database.js');

async function find(context) {
  const result = await database.doubleExecute(context);

  return result;
}

module.exports.find = find;
