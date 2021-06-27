const express = require('express');
const routerPost = new express.Router();
const orasqlrun = require('../controllers/orasqlrun.js');
const orasqlrun2 = require('../controllers/orasqlrun2.js');

routerPost.route('/sqlrun')
  .post(query.post);

routerPost.route('/sqlrun2')
    .post(execquery.post);

module.exports = routerPost;
