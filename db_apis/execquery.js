const database = require('../services/database.js');

const baseQuery =
 `select squid
  from COUNTERPARTIES
  where squid in (3113)`;

async function find(context) {
  const result = await database.doubleExecute(context);

  return result;
}

module.exports.find = find;
