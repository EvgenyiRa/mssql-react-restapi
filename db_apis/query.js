const database = require('../services/database.js');

async function find(context) {
  return await database.simpleExecute(context);
}

module.exports.find = find;
