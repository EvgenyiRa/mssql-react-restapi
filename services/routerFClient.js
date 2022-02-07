const express = require('express');
const routerFClient = new express.Router();
const fClientSave = require('../controllers/fClientSave.js');

routerFClient.route('/save')
  .post(fClientSave.post);

module.exports = routerFClient;
