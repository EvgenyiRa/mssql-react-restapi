const express = require('express');
const routerOLAP = new express.Router();
const gettable = require('../controllers/gettable.js');

routerOLAP.route('/gettable')
  .post(gettable.post);

module.exports = routerOLAP;
