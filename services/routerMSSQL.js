const express = require('express');
const routerMSSQL = new express.Router();
const query = require('../controllers/query.js');
const execquery = require('../controllers/execquery.js');

routerMSSQL.route('/query')
  .post(query.post);

routerMSSQL.route('/execquery')
  .post(execquery.post);

module.exports = routerMSSQL;
