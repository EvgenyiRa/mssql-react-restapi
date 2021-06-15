const express = require('express');
const routerMSSQL = new express.Router();
const sqlrun = require('../controllers/sqlrun.js');
const sqlrun2 = require('../controllers/sqlrun2.js');

routerMSSQL.route('/sqlrun')
  .post(sqlrun.post);

routerMSSQL.route('/sqlrun2')
  .post(sqlrun2.post);

module.exports = routerMSSQL;
