const express = require('express');
const routerPost = new express.Router();
const query = require('../controllers/query.js');
const execquery = require('../controllers/execquery.js');

routerPost.route('/query')
  .post(query.post);

routerPost.route('/execquery')
    .post(execquery.post);

module.exports = routerPost;
