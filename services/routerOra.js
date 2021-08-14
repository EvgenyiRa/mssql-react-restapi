const express = require('express');
const routerPost = new express.Router();
const orasqlrun = require('../controllers/orasqlrun.js');
const orasqlrun2 = require('../controllers/orasqlrun2.js');

routerPost.route('/sqlrun')
  .post(orasqlrun.post);

routerPost.route('/sqlrun2')
    .post(orasqlrun2.post);

module.exports = routerPost;
