const database = require('../services/database.js');

const baseQuery =
 `select squid
  from COUNTERPARTIES
  where squid in (3113)`;

async function find(context) {
  return await database.simpleExecute(context);
}

module.exports.find = find;
