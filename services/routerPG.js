const express = require('express');
const routerPG = new express.Router();
const pgrun = require('../controllers/pgrun.js');
const pgrun2 = require('../controllers/pgrun2.js');

routerPG.route('/sqlrun')
  .post(pgrun.post);

routerPG.route('/sqlrun2')
  .post(pgrun2.post);

module.exports = routerPG;
