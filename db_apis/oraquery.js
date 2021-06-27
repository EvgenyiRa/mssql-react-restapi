const database = require('../services/database.js');

async function find(context) {
  const result = await database.oraExecute(context);
  return result.rows;
}

module.exports.find = find;
