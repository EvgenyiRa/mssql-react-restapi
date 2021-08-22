const express = require('express');
const routerMYSQL = new express.Router();
const mysqlrun = require('../controllers/mysqlrun.js');
const mysqlrun2 = require('../controllers/mysqlrun2.js');

routerMYSQL.route('/sqlrun')
  .post(mysqlrun.post);

routerMYSQL.route('/sqlrun2')
  .post(mysqlrun2.post);

module.exports = routerMYSQL;
