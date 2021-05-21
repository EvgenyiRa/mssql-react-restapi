const express = require('express');
const routerAuth = new express.Router();
const authset = require('../controllers/authset.js');
const authdel = require('../controllers/authdel.js');
const authget = require('../controllers/authget.js');
const authbytoken = require('../controllers/authbytoken.js');
const gethashpwd = require('../controllers/gethashpwd.js');

routerAuth.route('/set')
  .post(authset.post);

routerAuth.route('/del')
  .post(authdel.post);

routerAuth.route('/get')
  .post(authget.post);

routerAuth.route('/bytoken')
  .post(authbytoken.post);

routerAuth.route('/gethashpwd')
  .post(gethashpwd.post);

module.exports = routerAuth;
